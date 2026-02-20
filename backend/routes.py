from flask import Blueprint, request, jsonify
from models import db, Ouvrage, Auteur, Utilisateur, Commande
from datetime import datetime

# Création du Blueprint pour organiser les routes
api = Blueprint('api', __name__)

# --- ROUTES POUR LES OUVRAGES (LIVRES) ---

@api.route('/ouvrages', methods=['GET'])
def get_ouvrages():
    ouvrages = Ouvrage.query.all()
    # On utilise une liste de compréhension pour transformer les objets en dictionnaires
    return jsonify([{
        "isbn": o.isbn,
        "titre": o.titre,
        "prix": o.prix,
        "stock": o.stockDisponible,
        "auteur": f"{o.auteur_rel.prenom} {o.auteur_rel.nom}" if o.auteur_rel else "Inconnu"
    } for o in ouvrages]), 200

@api.route('/ouvrages', methods=['POST'])
def add_ouvrage():
    data = request.get_json()
    try:
        nouveau_livre = Ouvrage(
            isbn=data['isbn'],
            titre=data['titre'],
            prix=data['prix'],
            resume=data.get('resume', ''),
            stockDisponible=data.get('stock', 0),
            idAuteur=data.get('idAuteur')
        )
        db.session.add(nouveau_livre)
        db.session.commit()
        return jsonify({"message": "Ouvrage créé avec succès"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

# --- ROUTES POUR LES UTILISATEURS ---

@api.route('/utilisateurs', methods=['POST'])
def register_user():
    data = request.get_json()
    if Utilisateur.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email déjà utilisé"}), 400
    
    nouvel_user = Utilisateur(
        nom=data.get('nom'),
        prenom=data.get('prenom'),
        email=data['email'],
        mdp=data['mdp'] # Note: En production, utilise werkzeug.security pour hacher le mdp
    )
    db.session.add(nouvel_user)
    db.session.commit()
    return jsonify({"message": "Compte utilisateur créé"}), 201

# --- ROUTES POUR LES COMMANDES ---

@api.route('/commandes', methods=['POST'])
def passer_commande():
    data = request.get_json()
    # Logique simplifiée pour créer une commande selon ton diagramme
    nouvelle_cmd = Commande(
        idUser=data['idUser'],
        montantTotal=data['montant'],
        status="payée",
        dateCommande=datetime.utcnow()
    )
    db.session.add(nouvelle_cmd)
    db.session.commit()
    return jsonify({"message": "Commande enregistrée", "numCommande": nouvelle_cmd.numCommande}), 201

# --- ROUTE POUR LES AUTEURS ---

@api.route('/auteurs', methods=['GET'])
def get_auteurs():
    auteurs = Auteur.query.all()
    return jsonify([{
        "id": a.idAuteur,
        "nom": a.nom,
        "prenom": a.prenom
    } for a in auteurs]), 200