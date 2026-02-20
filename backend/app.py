from flask import Flask
from flask_cors import CORS
from models import db
from routes import api  # Importe ton blueprint

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///librairie.db'
db.init_app(app)

# C'est ici que le lien se fait !
app.register_blueprint(api, url_prefix='/api')

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)