import { useState } from 'react';
import '../styles/BookCard.css';

function BookCard({ book, onAddToCart, onViewDetails, onAlert }) {
  const [showAlert, setShowAlert] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertSubmitted, setAlertSubmitted] = useState(false);

  const handleAlertSubmit = (e) => {
    e.preventDefault();
    if (alertEmail) {
      onAlert(book.id, alertEmail);
      setAlertSubmitted(true);
      setTimeout(() => {
        setShowAlert(false);
        setAlertEmail('');
        setAlertSubmitted(false);
      }, 2000);
    }
  };

  return (
    <div className="book-card">
      {book.isNew && <span className="badge badge-new">NOUVEAU</span>}
      {book.isBestseller && <span className="badge badge-bestseller">BESTSELLER</span>}

      <div className="book-cover">
        <img src={book.cover} alt={book.title} />
        <div className="book-overlay">
          {book.available ? (
            <span className="in-stock">En stock</span>
          ) : (
            <span className="out-of-stock">Rupture</span>
          )}
          <span className="format-badge">{book.format.toUpperCase()}</span>
        </div>
      </div>

      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>

        <div className="book-meta">
          <div className="rating">
            <span className="stars">⭐</span>
            <span className="rating-value">{book.rating}</span>
            <span className="reviews-count">({book.reviews})</span>
          </div>
        </div>

        <div className="book-category">
          <span className="category-tag">{book.category}</span>
        </div>

        <div className="book-price">
          <span className="price">{book.price.toFixed(2)}€</span>
          {book.stock > 0 && book.stock <= 5 && (
            <span className="low-stock">Seulement {book.stock} en stock</span>
          )}
        </div>

        <div className="book-actions">
          <button
            className="btn btn-primary"
            onClick={() => onViewDetails(book.id)}
          >
            Voir détails
          </button>
          <button
            className={`btn btn-secondary ${!book.available ? 'disabled' : ''}`}
            onClick={() => onAddToCart(book.id)}
            disabled={!book.available}
          >
            {book.available ? 'Ajouter au panier' : 'Indisponible'}
          </button>
        </div>

        {!book.available && (
          <>
            <button
              className="btn-alert"
              onClick={() => setShowAlert(!showAlert)}
            >
              🔔 Être alerté
            </button>

            {showAlert && (
              <form className="alert-form" onSubmit={handleAlertSubmit}>
                <input
                  type="email"
                  placeholder="Votre email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn-submit">
                  {alertSubmitted ? '✓ Alerte créée!' : 'Créer alerte'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BookCard;
