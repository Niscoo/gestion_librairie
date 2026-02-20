from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import re
from datetime import datetime
from database import get_db_connection, init_db

app = Flask(__name__)
CORS(app)

# Initialize database on startup
init_db()

# Helper functions
def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    # French phone: 10 digits
    return re.match(r'^\d{10}$', phone.replace(' ', '').replace('.', '')) is not None

def validate_zip_code(zip_code):
    # French postal code: 5 digits
    return re.match(r'^\d{5}$', zip_code) is not None

@app.route('/api/hello', methods=['GET'])
def hello():
    return jsonify({
        'message': 'Bonjour depuis Flask!',
        'status': 'Backend connecté avec succès 🎉'
    })

# ===== AUTH ENDPOINTS =====

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validation
    if not data.get('email') or not data.get('password') or not data.get('nom') or not data.get('prenom'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if not validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        password_hash = generate_password_hash(data['password'])
        cursor.execute('''
        INSERT INTO users (email, password_hash, nom, prenom, telephone)
        VALUES (?, ?, ?, ?, ?)
        ''', (data['email'], password_hash, data['nom'], data['prenom'], data.get('telephone', '')))
        
        conn.commit()
        user_id = cursor.lastrowid
        
        return jsonify({
            'id': user_id,
            'email': data['email'],
            'nom': data['nom'],
            'prenom': data['prenom']
        }), 201
    
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already exists'}), 409
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = ?', (data['email'],))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not check_password_hash(user['password_hash'], data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    return jsonify({
        'id': user['id'],
        'email': user['email'],
        'nom': user['nom'],
        'prenom': user['prenom'],
        'telephone': user['telephone']
    }), 200

@app.route('/api/users/profile/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, email, nom, prenom, telephone FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user['id'],
        'email': user['email'],
        'nom': user['nom'],
        'prenom': user['prenom'],
        'telephone': user['telephone']
    }), 200

# ===== ORDERS ENDPOINTS =====

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    
    # Validate required fields
    if not data.get('items') or not isinstance(data['items'], list):
        return jsonify({'error': 'Missing or invalid items'}), 400
    
    if not data.get('shipping_address'):
        return jsonify({'error': 'Missing shipping address'}), 400
    
    shipping = data['shipping_address']
    required_shipping_fields = ['rue', 'ville', 'code_postal']
    for field in required_shipping_fields:
        if not shipping.get(field):
            return jsonify({'error': f'Missing shipping address field: {field}'}), 400
    
    if not validate_zip_code(shipping['code_postal']):
        return jsonify({'error': 'Invalid postal code format (must be 5 digits)'}), 400
    
    # For guest users
    if not data.get('user_id'):
        if not data.get('guest_info'):
            return jsonify({'error': 'Missing guest info'}), 400
        guest = data['guest_info']
        if not all(k in guest for k in ['email', 'nom', 'prenom']):
            return jsonify({'error': 'Missing guest information fields'}), 400
        if not validate_email(guest['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        if guest.get('telephone') and not validate_phone(guest['telephone']):
            return jsonify({'error': 'Invalid phone format (must be 10 digits)'}), 400
    
    # Calculate totals
    subtotal = sum(item['price'] * item['quantity'] for item in data['items'])
    shipping_cost = 0  # Can be set based on rules
    total = subtotal + shipping_cost
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create order
        if data.get('user_id'):
            cursor.execute('''
            INSERT INTO orders (user_id, shipping_rue, shipping_ville, shipping_code_postal, 
                              shipping_pays, subtotal, shipping_cost, total, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
            ''', (
                data['user_id'],
                shipping['rue'],
                shipping['ville'],
                shipping['code_postal'],
                shipping.get('pays', 'France'),
                subtotal,
                shipping_cost,
                total
            ))
        else:
            guest = data['guest_info']
            cursor.execute('''
            INSERT INTO orders (guest_email, guest_nom, guest_prenom, guest_telephone,
                              shipping_rue, shipping_ville, shipping_code_postal, 
                              shipping_pays, subtotal, shipping_cost, total, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
            ''', (
                guest['email'],
                guest['nom'],
                guest['prenom'],
                guest.get('telephone', ''),
                shipping['rue'],
                shipping['ville'],
                shipping['code_postal'],
                shipping.get('pays', 'France'),
                subtotal,
                shipping_cost,
                total
            ))
        
        order_id = cursor.lastrowid
        
        # Add items to order
        for item in data['items']:
            cursor.execute('''
            INSERT INTO order_items (order_id, book_id, book_title, format, quantity, price)
            VALUES (?, ?, ?, ?, ?, ?)
            ''', (order_id, item['id'], item['title'], item['format'], item['quantity'], item['price']))
        
        conn.commit()
        
        return jsonify({
            'id': order_id,
            'total': total,
            'status': 'confirmed'
        }), 201
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get order
    cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
    order = cursor.fetchone()
    
    if not order:
        conn.close()
        return jsonify({'error': 'Order not found'}), 404
    
    # Get order items
    cursor.execute('SELECT * FROM order_items WHERE order_id = ?', (order_id,))
    items = cursor.fetchall()
    conn.close()
    
    return jsonify({
        'id': order['id'],
        'user_id': order['user_id'],
        'guest_email': order['guest_email'],
        'total': order['total'],
        'status': order['status'],
        'created_at': order['created_at'],
        'shipping_address': {
            'rue': order['shipping_rue'],
            'ville': order['shipping_ville'],
            'code_postal': order['shipping_code_postal'],
            'pays': order['shipping_pays']
        },
        'items': [dict(item) for item in items]
    }), 200

@app.route('/api/orders', methods=['GET'])
def get_user_orders():
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'Missing user_id parameter'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
    orders = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(order) for order in orders]), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
