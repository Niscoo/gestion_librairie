from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Modèle Auteur
class Auteur(db.Model):
    __tablename__ = 'auteur'
    idAuteur = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False, index=True)
    prenom = db.Column(db.String(100))
    biographie = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Relation : Un auteur peut avoir plusieurs ouvrages
    ouvrages = db.relationship('Ouvrage', backref='auteur_rel', lazy=True)

    def __repr__(self):
        return f'<Auteur {self.prenom} {self.nom}>'

# Modèle Ouvrage (Livre)
class Ouvrage(db.Model):
    __tablename__ = 'ouvrage'
    isbn = db.Column(db.String(20), primary_key=True)
    titre = db.Column(db.String(200), nullable=False, index=True)
    prix = db.Column(db.Float, nullable=False)
    resume = db.Column(db.Text)
    dateParution = db.Column(db.Date)
    stockDisponible = db.Column(db.Integer, default=0)
    idAuteur = db.Column(db.Integer, db.ForeignKey('auteur.idAuteur'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.Index('idx_titre', 'titre'),
        db.Index('idx_prix', 'prix'),
    )

    def __repr__(self):
        return f'<Ouvrage {self.titre}>'

# Modèle Utilisateur
class Utilisateur(db.Model):
    __tablename__ = 'utilisateur'
    idUser = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100))
    prenom = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    mdp = db.Column(db.String(200), nullable=False)
    date_naissance = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Relation vers les commandes
    commandes = db.relationship('Commande', backref='client', lazy=True)

    def __repr__(self):
        return f'<Utilisateur {self.email}>'

# Modèle Commande
class Commande(db.Model):
    __tablename__ = 'commande'
    numCommande = db.Column(db.Integer, primary_key=True)
    dateCommande = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    montantTotal = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='payée')  # ex: 'payée', 'expédiée', 'livrée'
    idUser = db.Column(db.Integer, db.ForeignKey('utilisateur.idUser'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Commande #{self.numCommande}>'