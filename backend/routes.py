from flask import Blueprint, request, jsonify, current_app
from models import db, Ouvrage, Auteur, Utilisateur, Commande, CommandeItem, Favori, Avis
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import random
import string

api = Blueprint('api', __name__)

# --- VALIDATION HELPERS ---

def generate_verification_code():
    """Génère un code de vérification à 6 chiffres"""
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(user):
    """Génère un code et envoie l'email de vérification via Gmail OAuth 2.0"""
    from mail_service import send_verification_code
    code = generate_verification_code()
    user.verification_code = code
    user.verification_code_expires = datetime.utcnow() + timedelta(minutes=15)
    db.session.commit()

    send_verification_code(user.email, code, user.prenom or user.nom or '')
    return code

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

def require_admin(f):
    """Décorateur pour protéger les routes admin"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = request.headers.get('X-User-Id') or request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "Authentification requise"}), 401
        user = Utilisateur.query.get(int(user_id))
        if not user or user.role != 'admin':
            return jsonify({"error": "Accès réservé aux administrateurs"}), 403
        return f(*args, **kwargs)
    return decorated

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
                "categorie": o.categorie or "Général",
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
            "categorie": ouvrage.categorie or "Général",
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
            categorie=data.get('categorie', 'Général'),
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

# --- PANIER (cart) endpoints ---
@api.route('/panier', methods=['GET'])
def get_panier():
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id requis'}), 400
    try:
        commande = Commande.query.filter_by(idUser=user_id, status='panier').first()
        if not commande:
            return jsonify({'items': []}), 200
        items = [
            {
                'isbn': it.isbn,
                'titre': it.titre,
                'format': it.format,
                'quantity': it.quantite,
                'prix_unitaire': it.prix_unitaire
            }
            for it in commande.lignes
        ]
        return jsonify({'items': items}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/panier', methods=['POST'])
def save_panier():
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        items = data.get('items', [])
        if not user_id:
            return jsonify({'error': 'user_id requis'}), 400
        # find existing panier
        commande = Commande.query.filter_by(idUser=user_id, status='panier').first()
        if not commande:
            commande = Commande(idUser=user_id, montantTotal=0.0, subtotal=0.0, status='panier')
            db.session.add(commande)
            db.session.flush()
        # clear existing items
        CommandeItem.query.filter_by(numCommande=commande.numCommande).delete()
        subtotal = 0.0
        for it in items:
            prix = float(it.get('prix_unitaire') or it.get('price') or 0)
            quant = int(it.get('quantity') or it.get('quantity') or 1)
            ligne = CommandeItem(numCommande=commande.numCommande, isbn=it.get('isbn'), titre=it.get('titre'), format=it.get('format'), quantite=quant, prix_unitaire=prix)
            db.session.add(ligne)
            subtotal += prix * quant
        commande.subtotal = subtotal
        commande.montantTotal = subtotal
        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api.route('/panier', methods=['DELETE'])
def clear_panier():
    try:
        data = request.get_json() or {}
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id requis'}), 400
        commande = Commande.query.filter_by(idUser=user_id, status='panier').first()
        if commande:
            CommandeItem.query.filter_by(numCommande=commande.numCommande).delete()
            db.session.delete(commande)
            db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# continue existing PUT route
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
        
        if 'categorie' in data:
            ouvrage.categorie = data['categorie']
        
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

# --- AUTHENTIFICATION ---

@api.route('/login', methods=['POST'])
@require_json
def login():
    """Authentifie un utilisateur par email/mot de passe"""
    try:
        data = request.get_json()
        if not data.get('email') or not data.get('mdp'):
            return jsonify({"error": "Email et mot de passe requis"}), 400

        user = Utilisateur.query.filter_by(email=data['email']).first()
        if not user or not check_password_hash(user.mdp, data['mdp']):
            return jsonify({"error": "Email ou mot de passe incorrect"}), 401

        if not user.email_verified:
            return jsonify({
                "error": "Email non vérifié. Vérifiez votre boîte de réception.",
                "requires_verification": True,
                "email": user.email
            }), 403

        return jsonify({
            "id": user.idUser,
            "nom": user.nom,
            "prenom": user.prenom,
            "email": user.email,
            "telephone": user.telephone,
            "adresse_rue": user.adresse_rue,
            "adresse_code_postal": user.adresse_code_postal,
            "adresse_ville": user.adresse_ville,
            "adresse_pays": user.adresse_pays or "France",
            "role": user.role or "user"
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500

# --- ROUTES POUR LES UTILISATEURS ---

@api.route('/utilisateurs', methods=['POST'])
def register_user():
    """Crée un nouvel utilisateur avec mot de passe sécurisé et envoie un code de vérification"""
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
            mdp=password_hash,
            email_verified=False
        )
        db.session.add(nouvel_user)
        db.session.commit()

        # Envoyer le code de vérification par email
        try:
            send_verification_email(nouvel_user)
        except Exception as mail_err:
            current_app.logger.error(f"Erreur envoi email: {mail_err}")
        
        return jsonify({
            "message": "Compte créé. Un code de vérification a été envoyé à votre email.",
            "id": nouvel_user.idUser,
            "email": nouvel_user.email,
            "email_verified": False,
            "requires_verification": True
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur lors de la création: {str(e)}"}), 500


@api.route('/verify-email', methods=['POST'])
@require_json
def verify_email():
    """Vérifie l'email avec le code envoyé"""
    try:
        data = request.get_json()
        email = data.get('email')
        code = data.get('code')

        if not email or not code:
            return jsonify({"error": "Email et code requis"}), 400

        user = Utilisateur.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "Utilisateur introuvable"}), 404

        if user.email_verified:
            return jsonify({"message": "Email déjà vérifié"}), 200

        if user.verification_code != code:
            return jsonify({"error": "Code incorrect"}), 400

        if user.verification_code_expires and user.verification_code_expires < datetime.utcnow():
            return jsonify({"error": "Code expiré. Demandez un nouveau code."}), 400

        user.email_verified = True
        user.verification_code = None
        user.verification_code_expires = None
        db.session.commit()

        return jsonify({
            "message": "Email vérifié avec succès",
            "id": user.idUser,
            "nom": user.nom,
            "prenom": user.prenom,
            "email": user.email,
            "telephone": user.telephone,
            "adresse_rue": user.adresse_rue,
            "adresse_code_postal": user.adresse_code_postal,
            "adresse_ville": user.adresse_ville,
            "adresse_pays": user.adresse_pays or "France",
            "role": user.role or "user"
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500


@api.route('/resend-verification', methods=['POST'])
@require_json
def resend_verification():
    """Renvoyer un code de vérification"""
    try:
        data = request.get_json()
        email = data.get('email')

        if not email:
            return jsonify({"error": "Email requis"}), 400

        user = Utilisateur.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "Utilisateur introuvable"}), 404

        if user.email_verified:
            return jsonify({"message": "Email déjà vérifié"}), 200

        try:
            send_verification_email(user)
            return jsonify({"message": "Nouveau code envoyé"}), 200
        except Exception as mail_err:
            current_app.logger.error(f"Erreur envoi email: {mail_err}")
            return jsonify({"error": "Erreur lors de l'envoi de l'email"}), 500
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500

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
            "email": user.email,
            "telephone": user.telephone,
            "adresse_rue": user.adresse_rue,
            "adresse_code_postal": user.adresse_code_postal,
            "adresse_ville": user.adresse_ville,
            "adresse_pays": user.adresse_pays or "France"
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500


@api.route('/utilisateurs/<int:id>', methods=['PUT'])
@require_json
def update_utilisateur(id):
    """Met à jour les infos personnelles d'un utilisateur"""
    try:
        user = Utilisateur.query.get(id)
        if not user:
            return jsonify({"error": "Utilisateur non trouvé"}), 404

        data = request.get_json()
        if 'nom' in data and data['nom'].strip():
            user.nom = data['nom'].strip()
        if 'prenom' in data:
            user.prenom = data['prenom'].strip()
        if 'telephone' in data:
            user.telephone = data['telephone'].strip() or None
        if 'adresse_rue' in data:
            user.adresse_rue = data['adresse_rue'].strip() or None
        if 'adresse_code_postal' in data:
            user.adresse_code_postal = data['adresse_code_postal'].strip() or None
        if 'adresse_ville' in data:
            user.adresse_ville = data['adresse_ville'].strip() or None
        if 'adresse_pays' in data:
            user.adresse_pays = data['adresse_pays'].strip() or 'France'
        if 'mdp' in data and data['mdp']:
            if len(data['mdp']) < 6:
                return jsonify({"error": "Mot de passe trop court (min. 6 caractères)"}), 400
            user.mdp = generate_password_hash(data['mdp'])

        db.session.commit()
        return jsonify({
            "id": user.idUser,
            "nom": user.nom,
            "prenom": user.prenom,
            "email": user.email,
            "telephone": user.telephone,
            "adresse_rue": user.adresse_rue,
            "adresse_code_postal": user.adresse_code_postal,
            "adresse_ville": user.adresse_ville,
            "adresse_pays": user.adresse_pays or "France"
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur: {str(e)}"}), 500

# --- ROUTES POUR LES COMMANDES ---

@api.route('/commandes', methods=['POST'])
def passer_commande():
    """Crée une nouvelle commande (utilisateur connecté ou invité)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON payload required"}), 400

        items = data.get('items', [])
        if not items:
            return jsonify({"error": "La commande doit contenir au moins un article"}), 400

        # Calcul du total
        subtotal = sum(float(i.get('price', 0)) * int(i.get('quantity', 1)) for i in items)
        shipping_cost = float(data.get('shipping_cost', 0))
        montant_total = subtotal + shipping_cost

        user_id = data.get('user_id')
        if user_id:
            if not Utilisateur.query.get(user_id):
                return jsonify({"error": "Utilisateur non trouvé"}), 404

        shipping = data.get('shipping_address') or {}
        guest = data.get('guest_info') or {}

        nouvelle_cmd = Commande(
            idUser=user_id,
            montantTotal=montant_total,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            status='paiement en attente',
            dateCommande=datetime.utcnow(),
            shipping_rue=shipping.get('rue'),
            shipping_code_postal=shipping.get('code_postal'),
            shipping_ville=shipping.get('ville'),
            shipping_pays=shipping.get('pays', 'France'),
            guest_email=guest.get('email'),
            guest_nom=guest.get('nom'),
            guest_prenom=guest.get('prenom'),
            guest_telephone=guest.get('telephone'),
        )
        db.session.add(nouvelle_cmd)
        db.session.flush()  # pour obtenir numCommande avant commit

        for i in items:
            ligne = CommandeItem(
                numCommande=nouvelle_cmd.numCommande,
                isbn=str(i.get('id', '')),
                titre=i.get('title', ''),
                format=i.get('format', ''),
                quantite=int(i.get('quantity', 1)),
                prix_unitaire=float(i.get('price', 0)),
            )
            db.session.add(ligne)

        db.session.commit()

        return jsonify({
            "id": nouvelle_cmd.numCommande,
            "numCommande": nouvelle_cmd.numCommande,
            "message": "Commande enregistrée avec succès",
            "total": montant_total,
            "status": nouvelle_cmd.status
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur: {str(e)}"}), 500


@api.route('/commandes/<int:id>/paiement', methods=['POST'])
@require_json
def payer_commande(id):
    """Traitement de paiement par carte (simulateur) et mise à jour des états de commande."""
    try:
        data = request.get_json() or {}
        card = data.get('card') or {}
        card_number = card.get('number') or data.get('card_number')
        cvc = card.get('cvc') or data.get('cvc')
        amount = None
        if data.get('amount') is not None:
            try:
                amount = float(data.get('amount'))
            except Exception:
                pass

        commande = Commande.query.get(id)
        if not commande:
            return jsonify({'error': 'Commande non trouvée'}), 404

        # Only allow payment when transitioning to 'payée' is permitted
        if not commande.can_transition_to('payée'):
            return jsonify({'error': f"Paiement non autorisé depuis l'état actuel: {commande.status}"}), 400

        if not card_number or not cvc:
            return jsonify({'error': 'Informations carte incomplètes'}), 400

        if amount is not None and abs(amount - (commande.montantTotal or 0)) > 0.01:
            return jsonify({'error': 'Montant invalide'}), 400

        # Simulation simple: paiement accepté si dernier chiffre de la carte pair
        success = False
        try:
            success = (int(str(card_number)[-1]) % 2 == 0)
        except Exception:
            success = False

        if success:
            # Marquer comme payée
            commande.transition_to('payée')
            # Avancer automatiquement selon le type d'articles
            try:
                if commande.has_physical_items():
                    if commande.can_transition_to('en préparation'):
                        commande.transition_to('en préparation')
                else:
                    if commande.can_transition_to("accès ebook activé"):
                        commande.transition_to("accès ebook activé")
            except Exception:
                # Ne pas bloquer en cas d'erreur secondaire
                pass

            return jsonify({'success': True, 'status': commande.status, 'message': 'Paiement accepté'}), 200
        else:
            # Paiement refusé -> annuler si possible
            try:
                if commande.can_transition_to('annulée'):
                    commande.transition_to('annulée')
            except Exception:
                pass
            return jsonify({'success': False, 'status': commande.status, 'message': 'Paiement refusé'}), 402
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f"Erreur paiement: {str(e)}"}), 500


@api.route('/commandes/<int:id>', methods=['GET'])
def get_commande(id):
    """Récupère une commande complète par ID"""
    try:
        commande = Commande.query.get(id)
        if not commande:
            return jsonify({"error": "Commande non trouvée"}), 404

        return jsonify({
            "id": commande.numCommande,
            "numCommande": commande.numCommande,
            "dateCommande": commande.dateCommande.isoformat(),
            "created_at": commande.created_at.isoformat(),
            "montantTotal": commande.montantTotal,
            "total": commande.montantTotal,
            "subtotal": commande.subtotal or commande.montantTotal,
            "shipping_cost": commande.shipping_cost or 0,
            "status": commande.status,
            "idUser": commande.idUser,
            "shipping_address": {
                "rue": commande.shipping_rue,
                "code_postal": commande.shipping_code_postal,
                "ville": commande.shipping_ville,
                "pays": commande.shipping_pays,
            } if commande.shipping_rue else None,
            "guest_email": commande.guest_email,
            "guest_nom": commande.guest_nom,
            "guest_prenom": commande.guest_prenom,
            "guest_telephone": commande.guest_telephone,
            "items": [{
                "book_title": l.titre,
                "isbn": l.isbn,
                "format": l.format,
                "quantity": l.quantite,
                "price": l.prix_unitaire,
            } for l in commande.lignes]
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500


@api.route('/commandes', methods=['GET'])
def get_commandes():
    """Récupère les commandes (filtrées par user_id si fourni)"""
    try:
        user_id = request.args.get('user_id', type=int)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)

        query = Commande.query
        if user_id:
            query = query.filter_by(idUser=user_id)

        commandes = query.order_by(Commande.dateCommande.desc()).paginate(page=page, per_page=per_page)

        return jsonify({
            "data": [{
                "numCommande": c.numCommande,
                "id": c.numCommande,
                "dateCommande": c.dateCommande.isoformat() if c.dateCommande else None,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "montantTotal": c.montantTotal,
                "montant": c.montantTotal,
                "total": c.montantTotal,
                "subtotal": c.subtotal or c.montantTotal,
                "shipping_cost": c.shipping_cost or 0,
                "status": c.status,
                "statut": c.status,
                "idUser": c.idUser,
                "client": (f"{c.client.prenom} {c.client.nom}" if c.client else None),
                "user": ({"nom": c.client.nom, "prenom": c.client.prenom, "id": c.client.idUser} if c.client else None)
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

# --- ROUTES POUR LES FAVORIS ---

# --- ROUTE POUR LA GESTION D'ÉTAT DE COMMANDE ---
@api.route('/commandes/<int:id>/status', methods=['PATCH'])
@require_json
def update_commande_status(id):
    """Met à jour l'état d'une commande en vérifiant la validité de la transition."""
    try:
        data = request.get_json() or {}
        new_status = data.get('new_status')
        if not new_status:
            return jsonify({'error': 'new_status requis'}), 400

        commande = Commande.query.get(id)
        if not commande:
            return jsonify({'error': 'Commande non trouvée'}), 404

        try:
            commande.transition_to(new_status)
            return jsonify({'success': True, 'status': commande.status}), 200
        except ValueError as ve:
            return jsonify({'error': str(ve)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur: {str(e)}'}), 500

# --- ROUTES POUR LES FAVORIS ---

@api.route('/favoris', methods=['GET'])
def get_favoris():
    """Retourne tous les favoris d'un utilisateur"""
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({"error": "user_id requis"}), 400

        favoris = Favori.query.filter_by(idUser=user_id).all()
        return jsonify({
            "data": [{"id": f.id, "isbn": f.isbn} for f in favoris]
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500


@api.route('/favoris', methods=['POST'])
@require_json
def add_favori():
    """Ajoute un livre en favori"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        isbn = data.get('isbn')

        if not user_id or not isbn:
            return jsonify({"error": "user_id et isbn requis"}), 400

        if not Utilisateur.query.get(user_id):
            return jsonify({"error": "Utilisateur non trouvé"}), 404
        if not Ouvrage.query.get(isbn):
            return jsonify({"error": "Livre non trouvé"}), 404

        existing = Favori.query.filter_by(idUser=user_id, isbn=isbn).first()
        if existing:
            return jsonify({"id": existing.id, "isbn": existing.isbn}), 200

        fav = Favori(idUser=user_id, isbn=isbn)
        db.session.add(fav)
        db.session.commit()
        return jsonify({"id": fav.id, "isbn": fav.isbn}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur: {str(e)}"}), 500


@api.route('/favoris/<int:fav_id>', methods=['DELETE'])
def delete_favori(fav_id):
    """Supprime un favori"""
    try:
        fav = Favori.query.get(fav_id)
        if not fav:
            return jsonify({"error": "Favori non trouvé"}), 404

        db.session.delete(fav)
        db.session.commit()
        return jsonify({"message": "Favori supprimé"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur suppression favori: {str(e)}"}), 500


# --- AVIS (Reviews) ---

@api.route('/avis/stats', methods=['GET'])
def get_avis_stats():
    """Statistiques des avis pour tous les ouvrages"""
    try:
        from sqlalchemy import func
        stats = db.session.query(
            Avis.isbn,
            func.avg(Avis.note).label('moyenne'),
            func.count(Avis.id).label('total')
        ).group_by(Avis.isbn).all()

        result = {}
        for s in stats:
            result[s.isbn] = {
                "moyenne": round(float(s.moyenne), 1),
                "total": s.total
            }
        return jsonify({"data": result}), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500


@api.route('/avis/<isbn>', methods=['GET'])
def get_avis(isbn):
    """Récupérer les avis d'un ouvrage"""
    try:
        avis_list = Avis.query.filter_by(isbn=isbn).order_by(Avis.created_at.desc()).all()
        result = []
        for a in avis_list:
            user = Utilisateur.query.get(a.idUser)
            result.append({
                "id": a.id,
                "isbn": a.isbn,
                "note": a.note,
                "commentaire": a.commentaire,
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "user": {
                    "id": user.idUser,
                    "prenom": user.prenom or "",
                    "nom": user.nom or ""
                } if user else None
            })

        notes = [a.note for a in avis_list]
        moyenne = round(sum(notes) / len(notes), 1) if notes else 0

        return jsonify({
            "data": result,
            "total": len(result),
            "moyenne": moyenne
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500


@api.route('/avis', methods=['POST'])
def create_avis():
    """Créer ou mettre à jour un avis"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        isbn = data.get('isbn')
        note = data.get('note')
        commentaire = data.get('commentaire', '')

        if not user_id or not isbn or not note:
            return jsonify({"error": "user_id, isbn et note sont requis"}), 400

        if not isinstance(note, int) or note < 1 or note > 5:
            return jsonify({"error": "La note doit être un entier entre 1 et 5"}), 400

        ouvrage = Ouvrage.query.get(isbn)
        if not ouvrage:
            return jsonify({"error": "Ouvrage non trouvé"}), 404

        existing = Avis.query.filter_by(idUser=user_id, isbn=isbn).first()
        if existing:
            existing.note = note
            existing.commentaire = commentaire
            existing.updated_at = datetime.utcnow()
            db.session.commit()
            return jsonify({
                "id": existing.id,
                "isbn": existing.isbn,
                "note": existing.note,
                "commentaire": existing.commentaire,
                "message": "Avis mis à jour"
            }), 200

        avis = Avis(idUser=user_id, isbn=isbn, note=note, commentaire=commentaire)
        db.session.add(avis)
        db.session.commit()

        return jsonify({
            "id": avis.id,
            "isbn": avis.isbn,
            "note": avis.note,
            "commentaire": avis.commentaire,
            "message": "Avis créé"
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur: {str(e)}"}), 500


@api.route('/avis/<int:avis_id>', methods=['DELETE'])
def delete_avis(avis_id):
    """Supprimer un avis"""
    try:
        avis = Avis.query.get(avis_id)
        if not avis:
            return jsonify({"error": "Avis non trouvé"}), 404

        db.session.delete(avis)
        db.session.commit()
        return jsonify({"message": "Avis supprimé"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur: {str(e)}"}), 500

# --- ADMIN ROUTES ---

@api.route('/admin/stats', methods=['GET'])
@require_admin
def admin_stats():
    """Statistiques du dashboard admin"""
    try:
        from sqlalchemy import func
        total_livres = Ouvrage.query.count()
        total_users = Utilisateur.query.count()
        total_commandes = Commande.query.count()
        total_avis = Avis.query.count()
        revenus = db.session.query(func.sum(Commande.montantTotal)).scalar() or 0
        commandes_recentes = Commande.query.order_by(Commande.dateCommande.desc()).limit(5).all()

        return jsonify({
            "total_livres": total_livres,
            "total_users": total_users,
            "total_commandes": total_commandes,
            "total_avis": total_avis,
            "revenus": round(float(revenus), 2),
            "commandes_recentes": [{
                "id": c.numCommande,
                "date": c.dateCommande.isoformat() if c.dateCommande else None,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "montant": c.montantTotal,
                "total": c.montantTotal,
                "statut": c.status,
                "client_id": c.idUser,
                "client": (f"{c.client.prenom} {c.client.nom}" if c.client else None)
            } for c in commandes_recentes]
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500


@api.route('/admin/utilisateurs', methods=['GET'])
@require_admin
def admin_list_users():
    """Liste tous les utilisateurs"""
    try:
        users = Utilisateur.query.order_by(Utilisateur.created_at.desc()).all()
        return jsonify({
            "data": [{
                "id": u.idUser,
                "nom": u.nom,
                "prenom": u.prenom,
                "email": u.email,
                "role": u.role or "user",
                "email_verified": u.email_verified,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "nb_commandes": len(u.commandes)
            } for u in users]
        }), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500


@api.route('/admin/utilisateurs/<int:id>/role', methods=['PUT'])
@require_admin
def admin_update_role(id):
    """Changer le rôle d'un utilisateur"""
    try:
        data = request.get_json()
        role = data.get('role')
        if role not in ('user', 'admin'):
            return jsonify({"error": "Rôle invalide"}), 400

        admin_id = request.headers.get('X-User-Id')
        if str(id) == str(admin_id) and role == 'user':
            return jsonify({"error": "Vous ne pouvez pas retirer votre propre rôle admin"}), 400

        user = Utilisateur.query.get(id)
        if not user:
            return jsonify({"error": "Utilisateur introuvable"}), 404

        user.role = role
        db.session.commit()
        return jsonify({"message": f"Rôle mis à jour: {role}"}), 200
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500


@api.route('/admin/utilisateurs/<int:id>', methods=['DELETE'])
@require_admin
def admin_delete_user(id):
    """Supprimer un utilisateur"""
    try:
        user = Utilisateur.query.get(id)
        if not user:
            return jsonify({"error": "Utilisateur introuvable"}), 404

        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "Utilisateur supprimé"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur: {str(e)}"}), 500


@api.route('/admin/avis/<int:id>', methods=['DELETE'])
@require_admin
def admin_delete_avis(id):
    """Supprimer un avis (modération)"""
    try:
        avis = Avis.query.get(id)
        if not avis:
            return jsonify({"error": "Avis introuvable"}), 404

        db.session.delete(avis)
        db.session.commit()
        return jsonify({"message": "Avis supprimé"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Erreur: {str(e)}"}), 500
