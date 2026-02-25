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
    categorie = db.Column(db.String(100), default='Général')
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
    telephone = db.Column(db.String(20))
    adresse_rue = db.Column(db.String(200))
    adresse_code_postal = db.Column(db.String(10))
    adresse_ville = db.Column(db.String(100))
    adresse_pays = db.Column(db.String(100), default='France')
    email_verified = db.Column(db.Boolean, default=False)
    verification_code = db.Column(db.String(6))
    verification_code_expires = db.Column(db.DateTime)
    role = db.Column(db.String(20), default='user')
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
    subtotal = db.Column(db.Float, default=0.0)
    shipping_cost = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(50), default='panier')
    idUser = db.Column(db.Integer, db.ForeignKey('utilisateur.idUser'), nullable=True, index=True)
    # Adresse de livraison
    shipping_rue = db.Column(db.String(200))
    shipping_code_postal = db.Column(db.String(10))
    shipping_ville = db.Column(db.String(100))
    shipping_pays = db.Column(db.String(100), default='France')
    # Infos invité
    guest_email = db.Column(db.String(120))
    guest_nom = db.Column(db.String(100))
    guest_prenom = db.Column(db.String(100))
    guest_telephone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Relation vers les lignes de commande
    lignes = db.relationship('CommandeItem', backref='commande', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Commande #{self.numCommande}>'

    def has_physical_items(self):
        """Retourne True si la commande contient au moins un livre physique"""
        return any(getattr(item, 'format', '') in ('papier-neuf', 'papier-occasion') for item in (self.lignes or []))

    def allowed_transitions(self):
        """Calcule les transitions autorisées depuis l'état courant."""
        base = {
            'panier': {'commande validée', 'annulée'},
            'commande validée': {'paiement en attente', 'annulée'},
            'paiement en attente': {'payée', 'annulée'},
            'en préparation': {'expédiée', 'annulée'},
            'expédiée': {'livrée'},
            'livrée': {'retour accepté'},
            'accès ebook activé': set(),
            'retour accepté': {'remboursement'},
            'annulée': {'remboursement'},
            'remboursement': set(),
            'payée': set(),
        }
        # Cas particulier : après "payée" la suite dépend du type d'articles
        if self.status == 'payée':
            allowed = set()
            if self.has_physical_items():
                allowed.add('en préparation')
            # si des ebooks présents, permettre aussi l'activation d'accès
            if any(getattr(item, 'format', '') not in ('papier-neuf', 'papier-occasion') for item in (self.lignes or [])):
                allowed.add('accès ebook activé')
            return allowed
        return base.get(self.status, set())

    def can_transition_to(self, new_state):
        """Vérifie si la transition est autorisée."""
        return new_state in self.allowed_transitions()

    def transition_to(self, new_state, commit=True):
        """Applique une transition d'état si autorisée, et commit la transaction si demandé."""
        if not self.can_transition_to(new_state):
            raise ValueError(f"Transition non autorisée: {self.status} -> {new_state}")
        self.status = new_state
        if commit:
            db.session.add(self)
            db.session.commit()
        return self


# Modèle Ligne de commande
class CommandeItem(db.Model):
    __tablename__ = 'commande_item'
    id = db.Column(db.Integer, primary_key=True)
    numCommande = db.Column(db.Integer, db.ForeignKey('commande.numCommande'), nullable=False, index=True)
    isbn = db.Column(db.String(20))
    titre = db.Column(db.String(200))
    format = db.Column(db.String(50))
    quantite = db.Column(db.Integer, default=1)
    prix_unitaire = db.Column(db.Float, nullable=False)

    def __repr__(self):
        return f'<CommandeItem {self.titre} x{self.quantite}>'

# Modèle Favori
class Favori(db.Model):
    __tablename__ = 'favori'
    id = db.Column(db.Integer, primary_key=True)
    idUser = db.Column(db.Integer, db.ForeignKey('utilisateur.idUser'), nullable=False, index=True)
    isbn = db.Column(db.String(20), db.ForeignKey('ouvrage.isbn'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (
        db.UniqueConstraint('idUser', 'isbn', name='uq_favori_user_isbn'),
    )

    def __repr__(self):
        return f'<Favori user={self.idUser} isbn={self.isbn}>'

# Modèle Avis
class Avis(db.Model):
    __tablename__ = 'avis'
    id = db.Column(db.Integer, primary_key=True)
    idUser = db.Column(db.Integer, db.ForeignKey('utilisateur.idUser'), nullable=False, index=True)
    isbn = db.Column(db.String(20), db.ForeignKey('ouvrage.isbn'), nullable=False, index=True)
    note = db.Column(db.Integer, nullable=False)
    commentaire = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    __table_args__ = (
        db.UniqueConstraint('idUser', 'isbn', name='uq_avis_user_isbn'),
        db.CheckConstraint('note >= 1 AND note <= 5', name='ck_avis_note'),
    )
    utilisateur = db.relationship('Utilisateur', backref='avis', lazy=True)

    def __repr__(self):
        return f'<Avis user={self.idUser} isbn={self.isbn} note={self.note}>'


# Modèle Note / Annotation ebook
class Note(db.Model):
    __tablename__ = 'note'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('utilisateur.idUser'), nullable=True, index=True)
    book_id = db.Column(db.String(20), nullable=False, index=True)
    cfi_range = db.Column(db.Text, nullable=False)
    highlighted_text = db.Column(db.Text)
    content = db.Column(db.Text, default='')
    color = db.Column(db.String(50), default='rgba(255,220,0,0.45)')
    is_private = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    utilisateur = db.relationship('Utilisateur', backref='notes', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'book_id': self.book_id,
            'cfi_range': self.cfi_range,
            'highlighted_text': self.highlighted_text,
            'content': self.content,
            'color': self.color,
            'is_private': self.is_private,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f'<Note user={self.user_id} book={self.book_id}>'