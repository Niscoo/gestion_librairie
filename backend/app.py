from flask import Flask
from flask_cors import CORS
from models import db
from routes import api
import logging
import os

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
        "origins": ["http://localhost:5173", "http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "max_age": 3600,
        "supports_credentials": False
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