import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useFavorites } from '../context/FavoritesContext';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config/api';
import '../styles/ProductDetailsPage.css';

/* ─── SVG Icons ───────────────────────────────────────────────────── */
const IconHeart = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="20" height="20"
    fill={filled ? '#ef4444' : 'none'}
    stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconCart = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const IconStar = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="18" height="18"
    fill={filled ? '#ff9800' : 'none'} stroke="#ff9800" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconBack = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const IconBook = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconTruck = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isConnected, user } = useUser();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [avis, setAvis] = useState([]);
  const [avisMoyenne, setAvisMoyenne] = useState(0);
  const [reviewNote, setReviewNote] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      const foundBook = await bookService.getBook(id);
      if (foundBook) {
        setBook(foundBook);
        if (foundBook.formats && foundBook.formats.length > 0) {
          const available = foundBook.formats.find(f => f.available);
          setSelectedFormat((available || foundBook.formats[0]).type);
        }
      }
      setLoading(false);
    };
    fetchBook();
  }, [id]);

  const fetchAvis = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/avis/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAvis(data.data || []);
        setAvisMoyenne(data.moyenne || 0);
      }
    } catch { /* silently fail */ }
  }, [id]);

  useEffect(() => {
    if (id) fetchAvis();
  }, [id, fetchAvis]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isConnected || !user?.id) {
      addToast('Connectez-vous pour laisser un avis', 'info');
      return;
    }
    if (reviewNote === 0) {
      addToast('Veuillez sélectionner une note', 'info');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/avis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          isbn: id,
          note: reviewNote,
          commentaire: reviewText
        })
      });
      if (res.ok) {
        addToast('Avis publié !', 'success');
        setReviewNote(0);
        setReviewText('');
        fetchAvis();
      } else {
        const err = await res.json();
        addToast(err.error || 'Erreur lors de la publication', 'error');
      }
    } catch {
      addToast('Erreur de connexion au serveur', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    if (book && selectedFormat) {
      const formatData = book.formats.find(f => f.type === selectedFormat);
      if (formatData) {
        for (let i = 0; i < quantity; i++) {
          addToCart({
            ...book,
            format: selectedFormat,
            price: formatData.price
          });
        }
        addToast(`"${book.title}" ajouté au panier (x${quantity})`, 'success');
        setQuantity(1);
      }
    }
  };

  const handleFavorite = async () => {
    if (!isConnected) {
      addToast('Connectez-vous pour gérer vos favoris', 'info');
      return;
    }
    const ok = await toggleFavorite(book.id);
    if (ok) {
      addToast(isFavorite(book.id) ? 'Retiré des favoris' : 'Ajouté aux favoris', 'success');
    }
  };

  const getSelectedFormat = () => {
    if (!book?.formats || !selectedFormat) return null;
    return book.formats.find(f => f.type === selectedFormat);
  };

  const getFormatLabel = (formatType) => {
    const labels = {
      'ebook': 'E-book',
      'papier-neuf': 'Neuf',
      'papier-occasion': 'Occasion'
    };
    return labels[formatType] || formatType;
  };

  const renderStars = (rating) => {
    const full = Math.round(rating);
    return Array.from({ length: 5 }, (_, i) => (
      <IconStar key={i} filled={i < full} />
    ));
  };

  if (loading) {
    return (
      <div className="pdp-loading">
        <div className="pdp-loading-spinner" />
        <p>Chargement du livre...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="pdp-not-found">
        <h1>Livre introuvable</h1>
        <p>Ce livre n'existe pas ou a été retiré du catalogue.</p>
        <button className="pdp-btn-back" onClick={() => navigate('/catalog')}>
          <IconBack /> Retour au catalogue
        </button>
      </div>
    );
  }

  const fmt = getSelectedFormat();
  const favorited = isFavorite(book.id);

  return (
    <div className="pdp">
      {/* Breadcrumb */}
      <nav className="pdp-breadcrumb">
        <button onClick={() => navigate('/')}>Accueil</button>
        <span className="pdp-breadcrumb-sep">/</span>
        <button onClick={() => navigate('/catalog')}>Catalogue</button>
        <span className="pdp-breadcrumb-sep">/</span>
        <span className="pdp-breadcrumb-current">{book.title}</span>
      </nav>

      {/* Main Content */}
      <div className="pdp-main">
        {/* Left - Cover */}
        <div className="pdp-cover-section">
          <div className="pdp-cover-wrapper">
            <img src={book.cover} alt={book.title} className="pdp-cover-img" />
            {book.isBestseller && <span className="pdp-badge pdp-badge-best">Bestseller</span>}
            {book.isNew && <span className="pdp-badge pdp-badge-new">Nouveau</span>}
          </div>
          <button className="pdp-btn-excerpt">
            <IconBook /> Feuilleter un extrait
          </button>
        </div>

        {/* Center - Info */}
        <div className="pdp-info-section">
          <span className="pdp-category">{book.category}</span>
          <h1 className="pdp-title">{book.title}</h1>
          <p className="pdp-author">par {book.author}</p>

          {/* Rating */}
          <div className="pdp-rating">
            <span className="pdp-stars-row">{renderStars(book.rating)}</span>
            <span className="pdp-rating-value">{book.rating}</span>
            <span className="pdp-rating-count">({book.reviews} avis)</span>
          </div>

          {/* Formats */}
          <div className="pdp-formats">
            <h3>Format disponible</h3>
            <div className="pdp-format-grid">
              {book.formats?.map(format => (
                <button
                  key={format.type}
                  className={`pdp-format-btn ${selectedFormat === format.type ? 'active' : ''} ${!format.available ? 'disabled' : ''}`}
                  onClick={() => format.available && setSelectedFormat(format.type)}
                  disabled={!format.available}
                >
                  <span className="pdp-format-name">{getFormatLabel(format.type)}</span>
                  <span className="pdp-format-price">{format.price.toFixed(2)} €</span>
                  {!format.available && <span className="pdp-format-oos">Rupture</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="pdp-description">
            <h3>Résumé</h3>
            <p className={showFullDescription ? '' : 'pdp-desc-collapsed'}>
              {book.description}
            </p>
            {book.description && book.description.length > 150 && (
              <button
                className="pdp-btn-more"
                onClick={() => setShowFullDescription(!showFullDescription)}
              >
                {showFullDescription ? '− Réduire' : '+ Lire la suite'}
              </button>
            )}
          </div>

          {/* Details */}
          <div className="pdp-details">
            <h3>Détails</h3>
            <div className="pdp-details-grid">
              <div className="pdp-detail-item">
                <span className="pdp-detail-label">ISBN</span>
                <span className="pdp-detail-value">{book.id}</span>
              </div>
              <div className="pdp-detail-item">
                <span className="pdp-detail-label">Catégorie</span>
                <span className="pdp-detail-value">{book.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Purchase */}
        <div className="pdp-purchase-section">
          <div className="pdp-purchase-card">
            {fmt && (
              <>
                <div className="pdp-price-display">
                  <span className="pdp-price">{fmt.price.toFixed(2)} €</span>
                  <span className="pdp-price-format">{getFormatLabel(fmt.type)}</span>
                </div>

                <div className={`pdp-stock ${fmt.available ? 'pdp-stock-ok' : 'pdp-stock-out'}`}>
                  {fmt.available ? (
                    <><IconCheck /> En stock</>
                  ) : (
                    <><span>✗</span> Rupture de stock</>
                  )}
                </div>

                {fmt.available && fmt.stock > 0 && fmt.stock <= 5 && (
                  <div className="pdp-low-stock">
                    ⚠ Plus que {fmt.stock} exemplaire{fmt.stock > 1 ? 's' : ''}
                  </div>
                )}

                {fmt.available && (
                  <div className="pdp-qty">
                    <label>Quantité</label>
                    <div className="pdp-qty-row">
                      <button className="pdp-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                      <input
                        type="number"
                        min="1"
                        max={fmt.stock}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="pdp-qty-input"
                      />
                      <button className="pdp-qty-btn" onClick={() => setQuantity(Math.min(fmt.stock, quantity + 1))}>+</button>
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              className={`pdp-btn-cart ${!fmt?.available ? 'disabled' : ''}`}
              onClick={handleAddToCart}
              disabled={!fmt?.available}
            >
              <IconCart /> {fmt?.available ? 'Ajouter au panier' : 'Indisponible'}
            </button>

            <button
              className={`pdp-btn-fav ${favorited ? 'active' : ''}`}
              onClick={handleFavorite}
            >
              <IconHeart filled={favorited} />
              {favorited ? 'Dans mes favoris' : 'Ajouter aux favoris'}
            </button>

            <div className="pdp-guarantees">
              <p><IconTruck /> Livraison gratuite dès 50 €</p>
              <p><IconCheck /> Retour sous 14 jours</p>
              <p><IconCheck /> Paiement sécurisé</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="pdp-reviews">
        <h2>Avis des lecteurs {avis.length > 0 && <span className="pdp-reviews-count">({avis.length})</span>}</h2>

        {avisMoyenne > 0 && (
          <div className="pdp-reviews-summary">
            <div className="pdp-reviews-avg">
              <span className="pdp-reviews-avg-num">{avisMoyenne}</span>
              <span className="pdp-reviews-avg-stars">{renderStars(avisMoyenne)}</span>
              <span className="pdp-reviews-avg-label">sur {avis.length} avis</span>
            </div>
          </div>
        )}

        {/* Review Form */}
        <div className="pdp-review-form-wrapper">
          <h3>Donner votre avis</h3>
          {isConnected ? (
            <form className="pdp-review-form" onSubmit={handleSubmitReview}>
              <div className="pdp-review-stars-input">
                <span className="pdp-review-label">Votre note :</span>
                <div className="pdp-review-stars-row">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className="pdp-review-star-btn"
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      onClick={() => setReviewNote(star)}
                    >
                      <IconStar filled={star <= (reviewHover || reviewNote)} />
                    </button>
                  ))}
                  {reviewNote > 0 && <span className="pdp-review-note-text">{reviewNote}/5</span>}
                </div>
              </div>
              <textarea
                className="pdp-review-textarea"
                placeholder="Partagez votre expérience avec ce livre..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
              />
              <button
                type="submit"
                className="pdp-review-submit"
                disabled={submittingReview || reviewNote === 0}
              >
                {submittingReview ? 'Publication...' : 'Publier mon avis'}
              </button>
            </form>
          ) : (
            <p className="pdp-review-login-msg">
              <button onClick={() => addToast('Connectez-vous pour laisser un avis', 'info')} className="pdp-review-login-btn">
                Connectez-vous
              </button> pour laisser un avis
            </p>
          )}
        </div>

        {/* Reviews List */}
        {avis.length > 0 ? (
          <div className="pdp-reviews-list">
            {avis.map(a => (
              <div key={a.id} className="pdp-review-card">
                <div className="pdp-review-header">
                  <div className="pdp-review-user">
                    <span className="pdp-review-avatar">
                      {(a.user?.prenom?.[0] || 'U').toUpperCase()}
                    </span>
                    <div>
                      <span className="pdp-review-username">
                        {a.user ? `${a.user.prenom} ${a.user.nom?.[0] || ''}.` : 'Utilisateur'}
                      </span>
                      <span className="pdp-review-date">
                        {a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                      </span>
                    </div>
                  </div>
                  <div className="pdp-review-stars">{renderStars(a.note)}</div>
                </div>
                {a.commentaire && <p className="pdp-review-text">{a.commentaire}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="pdp-reviews-empty">Aucun avis pour le moment. Soyez le premier à donner votre avis !</p>
        )}
      </section>
    </div>
  );
}

export default ProductDetailsPage;
