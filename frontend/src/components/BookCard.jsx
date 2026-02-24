import { useState } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import '../styles/BookCard.css';

/* ─── SVG icons (no external dependency) ─────────────────────────── */
const IconHeart = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="18" height="18"
    fill={filled ? '#ef4444' : 'none'}
    stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconStar = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="14" height="14"
    fill={filled ? '#ff9800' : 'none'} stroke="#ff9800" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconBell = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconCart = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const IconEye = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

/* ─── Component ───────────────────────────────────────────────────── */
function BookCard({
  book,
  onAddToCart = () => {},
  onViewDetails = () => {},
  onAlert = () => {},
  onQuickView
}) {
  const [showAlert, setShowAlert] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isConnected } = useUser();
  const { addToast } = useToast();
  const hasAvailableFormat = book.formats.some(f => f.available);
  const favorited = isFavorite(book.id);
  const minPrice = Math.min(...book.formats.map(f => f.price));
  const availableFormats = book.formats.filter(f => f.available);
  const lowStock = book.formats.some(f => f.available && f.stock > 0 && f.stock <= 5);

  const handleFavorite = async (e) => {
    e.stopPropagation();
    if (!isConnected) {
      addToast('Connectez-vous pour gérer vos favoris', 'info');
      return;
    }
    const ok = await toggleFavorite(book.id);
    if (ok) {
      addToast(favorited ? 'Retiré des favoris' : 'Ajouté aux favoris', 'success');
    }
  };

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

  /* render stars 1-5 */
  const renderStars = (rating) => {
    const full = Math.round(rating);
    return Array.from({ length: 5 }, (_, i) => (
      <IconStar key={i} filled={i < full} />
    ));
  };

  return (
    <div className="book-card">
      {/* Badges top-left */}
      <div className="badge-stack">
        {book.isNew && <span className="badge badge-new">Nouveau</span>}
        {book.isBestseller && <span className="badge badge-bestseller">Bestseller</span>}
      </div>

      {/* Favorites button top-right */}
      <button
        className={`btn-fav-corner ${favorited ? 'active' : ''}`}
        onClick={handleFavorite}
        aria-label={favorited ? `Retirer ${book.title} des favoris` : `Ajouter ${book.title} aux favoris`}
      >
        <IconHeart filled={favorited} />
      </button>

      {/* Cover + overlay */}
      <div className="book-cover">
        <img src={book.cover} alt={`Couverture de ${book.title}`} loading="lazy" />

        {/* Hover overlay with quick actions */}
        <div className="book-overlay">
          <div className="overlay-actions">
            {onQuickView && (
              <button
                className="overlay-btn"
                onClick={(e) => { e.stopPropagation(); onQuickView(book); }}
                aria-label={`Aperçu rapide de ${book.title}`}
              >
                <IconEye /> Aperçu rapide
              </button>
            )}
            <button
              className={`overlay-btn overlay-btn-cart ${!hasAvailableFormat ? 'disabled' : ''}`}
              onClick={(e) => { e.stopPropagation(); onAddToCart(book.id); }}
              disabled={!hasAvailableFormat}
              aria-label={hasAvailableFormat ? `Ajouter ${book.title} au panier` : `${book.title} indisponible`}
            >
              <IconCart /> {hasAvailableFormat ? 'Ajouter au panier' : 'Indisponible'}
            </button>
          </div>

          <div className="overlay-meta">
            {hasAvailableFormat
              ? <span className="stock-badge in-stock">En stock</span>
              : <span className="stock-badge out-of-stock">Rupture</span>}
            {availableFormats.length > 0 && (
              <div className="format-pills">
                {availableFormats.map(f => (
                  <span key={f.type} className="format-pill">{f.type}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="book-info">
        <div className="book-header">
          <span className="category-tag">{book.category}</span>
        </div>

        <h3 className="book-title" title={book.title}>{book.title}</h3>
        <p className="book-author">{book.author}</p>

        <div className="book-rating">
          <span className="stars-row">{renderStars(book.rating)}</span>
          <span className="rating-value">{book.rating}</span>
          <span className="reviews-count">({book.reviews} avis)</span>
        </div>

        <div className="book-price">
          <div className="price-block">
            <span className="price-label">À partir de</span>
            <span className="price">{minPrice.toFixed(2)} €</span>
          </div>
          {lowStock && <span className="low-stock">Stock limité</span>}
        </div>

        <div className="book-actions">
          <button
            className="btn btn-details"
            onClick={() => onViewDetails(book.id)}
            aria-label={`Voir la fiche du livre ${book.title}`}
          >
            Voir détails
          </button>
          <button
            className={`btn btn-cart ${!hasAvailableFormat ? 'disabled' : ''}`}
            onClick={() => onAddToCart(book.id)}
            disabled={!hasAvailableFormat}
            aria-label={hasAvailableFormat ? `Ajouter ${book.title} au panier` : `${book.title} indisponible`}
          >
            <IconCart />
            {hasAvailableFormat ? 'Panier' : 'Indisponible'}
          </button>
        </div>

        {!hasAvailableFormat && (
          <div className="alert-section">
            <button className="btn-alert" onClick={() => setShowAlert(!showAlert)}>
              <IconBell /> Être alerté
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
                  {alertSubmitted ? 'Alerte créée !' : 'Créer une alerte'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookCard;
