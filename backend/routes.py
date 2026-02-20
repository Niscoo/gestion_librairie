from flask import Blueprint, request, jsonify
from models import db, Ouvrage, Auteur, Utilisateur, Commande
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

api = Blueprint('api', __name__)

# --- VALIDATION HELPERS ---

def validate_email(email):
    """Valide le format d'un email"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_isbn(isbn):
    """Valide le format ISBN"""
    return isbn and len(isbn) >= 10

def require_json(f):
    """Décorateur pour valider que le request contient du JSON"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400
        return f(*args, **kwargs)
    return decorated

# --- ERROR HANDLING ---

@api.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Mauvaise requête"}), 400

@api.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Ressource non trouvée"}), 404

@api.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Erreur serveur"}), 500

# --- ROUTES POUR LES OUVRAGES ---

@api.route('/ouvrages', methods=['GET'])
def get_ouvrages():
    """Récupère tous les ouvrages avec pagination optionnelle"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        ouvrages = Ouvrage.query.paginate(page=page, per_page=per_page)
        
        return jsonify({
            "data": [{
                "isbn": o.isbn,
                "titre": o.titre,
                "prix": o.prix,
                "stock": o.stockDisponible,
                "resume": o.resume,
                "auteur": f"{o.auteur_rel.prenom} {o.auteur_rel.nom}" if o.auteur_rel else "Inconnu"
            } for o in ouvrages.items],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": ouvrages.total,
                "pages": ouvrages.pages
            }
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur lors de la récupération des ouvrages: {str(e)}"}), 500

@api.route('/ouvrages/<isbn>', methods=['GET'])
def get_ouvrage(isbn):
    """Récupère un ouvrage par ISBN"""
    try:
        ouvrage = Ouvrage.query.get(isbn)
        if not ouvrage:
            return jsonify({"error": "Ouvrage non trouvé"}), 404
        
        return jsonify({
            "isbn": ouvrage.isbn,
            "titre": ouvrage.titre,
            "prix": ouvrage.prix,
            "stock": ouvrage.stockDisponible,
            "resume": ouvrage.resume,
            "auteur": f"{ouvrage.auteur_rel.prenom} {ouvrage.auteur_rel.nom}" if ouvrage.auteur_rel else "Inconnu",
            "auteur_id": ouvrage.idAuteur
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500

@api.route('/ouvrages', methods=['POST'])
def add_ouvrage():
    """Crée un nouvel ouvrage"""
    try:
        data = request.get_json()
        
        # Validation
        if not data.get('isbn'):
            return jsonify({"error": "ISBN est requis"}), 400
        if not data.get('titre'):
            return jsonify({"error": "Titre est requis"}), 400
        if not isinstance(data.get('prix'), (int, float)) or data['prix'] < 0:
            return jsonify({"error": "Prix doit être un nombre positif"}), 400
        
        if not validate_isbn(data['isbn']):
            return jsonify({"error": "Format ISBN invalide"}), 400
        
        if Ouvrage.query.get(data['isbn']):
            return jsonify({"error": "Cet ISBN existe déjà"}), 409
        
        # Vérifier que l'auteur existe si fourni
        if data.get('idAuteur'):
            auteur = Auteur.query.get(data['idAuteur'])
            if not auteur:
                return jsonify({"error": f"Auteur {data['idAuteur']} non trouvé"}), 404
        
        nouveau_livre = Ouvrage(
            isbn=data['isbn'],
            titre=data['titre'],
            prix=data['prix'],
            resume=data.get('resume', ''),
            stockDisponible=max(0, int(data.get('stock', 0))),
            idAuteur=data.get('idAuteur')
        )
        db.session.add(nouveau_livre)
        db.session.commit()
        
        return jsonify({
            "message": "Ouvrage créé avec succès",
            "isbn": nouveau_livre.isbn
        }), 201
    except ValueError as e:
        return jsonify({"error": f"Validation échouée: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur lors de la création: {str(e)}"}), 500

@api.route('/ouvrages/<isbn>', methods=['PUT'])
def update_ouvrage(isbn):
    """Modifie un ouvrage existant"""
    try:
        ouvrage = Ouvrage.query.get(isbn)
        if not ouvrage:
            return jsonify({"error": "Ouvrage non trouvé"}), 404
        
        data = request.get_json()
        
        # Validation et update sélectif
        if 'titre' in data:
            if not data['titre']:
                return jsonify({"error": "Titre ne peut pas être vide"}), 400
            ouvrage.titre = data['titre']
        
        if 'prix' in data:
            if not isinstance(data['prix'], (int, float)) or data['prix'] < 0:
                return jsonify({"error": "Prix doit être positif"}), 400
            ouvrage.prix = data['prix']
        
        if 'stock' in data:
            ouvrage.stockDisponible = max(0, int(data['stock']))
        
        if 'resume' in data:
            ouvrage.resume = data['resume']
        
        if 'idAuteur' in data and data['idAuteur']:
            auteur = Auteur.query.get(data['idAuteur'])
            if not auteur:
                return jsonify({"error": "Auteur non trouvé"}), 404
            ouvrage.idAuteur = data['idAuteur']
        
        db.session.commit()
        return jsonify({"message": "Ouvrage modifié avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur lors de la modification: {str(e)}"}), 500

@api.route('/ouvrages/<isbn>', methods=['DELETE'])
def delete_ouvrage(isbn):
    """Supprime un ouvrage"""
    try:
        ouvrage = Ouvrage.query.get(isbn)
        if not ouvrage:
            return jsonify({"error": "Ouvrage non trouvé"}), 404
        
        db.session.delete(ouvrage)
        db.session.commit()
        return jsonify({"message": "Ouvrage supprimé avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur lors de la suppression: {str(e)}"}), 500

# --- ROUTES POUR LES AUTEURS ---

@api.route('/auteurs', methods=['GET'])
def get_auteurs():
    """Récupère tous les auteurs"""
    try:
        auteurs = Auteur.query.all()
        return jsonify({
            "data": [{
                "id": a.idAuteur,
                "nom": a.nom,
                "prenom": a.prenom,
                "biographie": a.biographie
            } for a in auteurs]
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500

@api.route('/auteurs/<int:id>', methods=['GET'])
def get_auteur(id):
    """Récupère un auteur par ID"""
    try:
        auteur = Auteur.query.get(id)
        if not auteur:
            return jsonify({"error": "Auteur non trouvé"}), 404
        
        return jsonify({
            "id": auteur.idAuteur,
            "nom": auteur.nom,
            "prenom": auteur.prenom,
            "biographie": auteur.biographie,
            "ouvrages": [{
                "isbn": o.isbn,
                "titre": o.titre,
                "prix": o.prix
            } for o in auteur.ouvrages]
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500

@api.route('/auteurs', methods=['POST'])
def add_auteur():
    """Crée un nouvel auteur"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON payload required"}), 400
        
        if not data.get('nom'):
            return jsonify({"error": "Nom est requis"}), 400
        
        nouvel_auteur = Auteur(
            nom=data['nom'],
            prenom=data.get('prenom', ''),
            biographie=data.get('biographie', '')
        )
        db.session.add(nouvel_auteur)
        db.session.commit()
        
        return jsonify({
            "message": "Auteur créé avec succès",
            "id": nouvel_auteur.idAuteur
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur: {str(e)}"}), 500

# --- ROUTES POUR LES UTILISATEURS ---

@api.route('/utilisateurs', methods=['POST'])
def register_user():
    """Crée un nouvel utilisateur avec mot de passe sécurisé"""
    try:
        data = request.get_json()
        
        # Validation
        if not data.get('email'):
            return jsonify({"error": "Email est requis"}), 400
        if not data.get('mdp'):
            return jsonify({"error": "Mot de passe est requis"}), 400
        if len(data['mdp']) < 6:
            return jsonify({"error": "Le mot de passe doit avoir au moins 6 caractères"}), 400
        if not validate_email(data['email']):
            return jsonify({"error": "Format email invalide"}), 400
        
        # Vérifier email unique
        if Utilisateur.query.filter_by(email=data['email']).first():
            return jsonify({"error": "Cet email est déjà utilisé"}), 409
        
        # Hash du mot de passe
        password_hash = generate_password_hash(data['mdp'])
        
        nouvel_user = Utilisateur(
            nom=data.get('nom', ''),
            prenom=data.get('prenom', ''),
            email=data['email'],
            mdp=password_hash
        )
        db.session.add(nouvel_user)
        db.session.commit()
        
        return jsonify({
            "message": "Compte utilisateur créé avec succès",
            "id": nouvel_user.idUser
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur lors de la création: {str(e)}"}), 500

@api.route('/utilisateurs/<int:id>', methods=['GET'])
def get_utilisateur(id):
    """Récupère les infos d'un utilisateur (sans mot de passe)"""
    try:
        user = Utilisateur.query.get(id)
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404
        
        return jsonify({
            "id": user.idUser,
            "nom": user.nom,
            "prenom": user.prenom,
            "email": user.email
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500

# --- ROUTES POUR LES COMMANDES ---

@api.route('/commandes', methods=['POST'])
def passer_commande():
    """Crée une nouvelle commande"""
    try:
        data = request.get_json()
        
        # Validation
        if not data.get('idUser'):
            return jsonify({"error": "ID utilisateur est requis"}), 400
        if not isinstance(data.get('montant'), (int, float)) or data['montant'] <= 0:
            return jsonify({"error": "Le montant doit être positif"}), 400
        
        # Vérifier que l'utilisateur existe
        user = Utilisateur.query.get(data['idUser'])
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404
        
        nouvelle_cmd = Commande(
            idUser=data['idUser'],
            montantTotal=data['montant'],
            status=data.get('status', 'payée'),
            dateCommande=datetime.utcnow()
        )
        db.session.add(nouvelle_cmd)
        db.session.commit()
        
        return jsonify({
            "message": "Commande enregistrée avec succès",
            "numCommande": nouvelle_cmd.numCommande
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur: {str(e)}"}), 500

@api.route('/commandes/<int:id>', methods=['GET'])
def get_commande(id):
    """Récupère une commande par ID"""
    try:
        commande = Commande.query.get(id)
        if not commande:
            return jsonify({"error": "Commande non trouvée"}), 404
        
        return jsonify({
            "numCommande": commande.numCommande,
            "dateCommande": commande.dateCommande.isoformat(),
            "montantTotal": commande.montantTotal,
            "status": commande.status,
            "idUser": commande.idUser
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500

@api.route('/commandes', methods=['GET'])
def get_commandes():
    """Récupère les commandes avec pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        commandes = Commande.query.paginate(page=page, per_page=per_page)
        
        return jsonify({
            "data": [{
                "numCommande": c.numCommande,
                "dateCommande": c.dateCommande.isoformat(),
                "montantTotal": c.montantTotal,
                "status": c.status,
                "idUser": c.idUser
            } for c in commandes.items],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": commandes.total,
                "pages": commandes.pages
            }
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500