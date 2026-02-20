from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Modèle Auteur
class Auteur(db.Model):
    idAuteur = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100))
    biographie = db.Column(db.Text)
    # Relation : Un auteur peut avoir plusieurs ouvrages
    ouvrages = db.relationship('Ouvrage', backref='auteur_rel', lazy=True)

# Modèle Ouvrage (Livre)
class Ouvrage(db.Model):
    isbn = db.Column(db.String(20), primary_key=True)
    titre = db.Column(db.String(200), nullable=False)
    prix = db.Column(db.Float, nullable=False)
    resume = db.Column(db.Text)
    dateParution = db.Column(db.Date)
    stockDisponible = db.Column(db.Integer, default=0)
    idAuteur = db.Column(db.Integer, db.ForeignKey('auteur.idAuteur'))
    # idCategorie à ajouter selon ton diagramme

# Modèle Utilisateur
class Utilisateur(db.Model):
    idUser = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100))
    prenom = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True, nullable=False)
    mdp = db.Column(db.String(200), nullable=False) # Mot de passe haché
    date_naissance = db.Column(db.Date)
    # Relation vers les commandes
    commandes = db.relationship('Commande', backref='client', lazy=True)

# Modèle Commande
class Commande(db.Model):
    numCommande = db.Column(db.Integer, primary_key=True)
    dateCommande = db.Column(db.DateTime, default=datetime.utcnow)
    montantTotal = db.Column(db.Float)
    status = db.Column(db.String(50)) # ex: 'payée', 'expédiée'
    idUser = db.Column(db.Integer, db.ForeignKey('utilisateur.idUser'))