from flask import Flask
from flask_cors import CORS
from models import db
import logging
import os

# Charger les variables d'environnement depuis le fichier .env si présent
from dotenv import load_dotenv
load_dotenv()

# Importer routes après le chargement des variables d'environnement
from routes import api

app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///librairie.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_SORT_KEYS'] = False

# Désactiver le debug en production
DEBUG = os.getenv('FLASK_ENV', 'development') == 'development'
app.config['DEBUG'] = DEBUG

# Configuration CORS restrictive - uniquement le frontend local
CORS(app, resources={
    r"/api/*": {
        # Allow frontend origins during development; allow all origins to avoid CORS issues
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-User-Id"],
        "expose_headers": ["Content-Type"],
        "max_age": 3600,
        "supports_credentials": True
    }
})

# Configuration du logging
logging.basicConfig(
    level=logging.INFO if DEBUG else logging.WARNING,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialisation de la base de données
db.init_app(app)

# Enregistrement du blueprint
app.register_blueprint(api, url_prefix='/api')

# Créer les tables si nécessaire
with app.app_context():
    try:
        db.create_all()
        logger.info("✓ Base de données initialisée")
        # Migration : ajouter les nouvelles colonnes si elles n'existent pas
        from sqlalchemy import text
        new_columns = [
            "ALTER TABLE commande ADD COLUMN subtotal FLOAT DEFAULT 0",
            "ALTER TABLE commande ADD COLUMN shipping_cost FLOAT DEFAULT 0",
            "ALTER TABLE commande ADD COLUMN shipping_rue TEXT",
            "ALTER TABLE commande ADD COLUMN shipping_code_postal TEXT",
            "ALTER TABLE commande ADD COLUMN shipping_ville TEXT",
            "ALTER TABLE commande ADD COLUMN shipping_pays TEXT",
            "ALTER TABLE commande ADD COLUMN guest_email TEXT",
            "ALTER TABLE commande ADD COLUMN guest_nom TEXT",
            "ALTER TABLE commande ADD COLUMN guest_prenom TEXT",
            "ALTER TABLE commande ADD COLUMN guest_telephone TEXT",
            "ALTER TABLE utilisateur ADD COLUMN email_verified BOOLEAN DEFAULT 0",
            "ALTER TABLE utilisateur ADD COLUMN verification_code TEXT",
            "ALTER TABLE utilisateur ADD COLUMN verification_code_expires DATETIME",
            "ALTER TABLE utilisateur ADD COLUMN role TEXT DEFAULT 'user'",
        ]
        for sql in new_columns:
            try:
                db.session.execute(text(sql))
                db.session.commit()
            except Exception:
                db.session.rollback()
    except Exception as e:
        logger.error(f"✗ Erreur lors de l'initialisation de la base de données: {e}")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return {"status": "ok", "service": "librairie-api"}, 200

@app.route('/', methods=['GET'])
def index():
    return {
        "service": "Gestion Librairie API",
        "version": "1.0.0",
        "endpoints": {
            "books": "/api/ouvrages",
            "authors": "/api/auteurs",
            "orders": "/api/commandes",
            "users": "/api/utilisateurs",
            "health": "/health"
        }
    }, 200

if __name__ == '__main__':
    if DEBUG:
        logger.info("🚀 Démarrage du serveur en mode développement")
        app.run(debug=True, host='127.0.0.1', port=5000)
    else:
        logger.info("🚀 Démarrage du serveur en mode production")
        app.run(debug=False, host='0.0.0.0', port=5000)