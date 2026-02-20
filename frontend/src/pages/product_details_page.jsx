import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService } from '../services/bookService';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import '../styles/ProductDetailsPage.css';

function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  // Mock data for extended book details
  const bookDetailsMap = {
    1: {
      isbn: '978-2-253-04940-9',
      publisher: 'Le Livre de Poche',
      publishDate: '15 décembre 1973',
      pages: 416,
      dimensions: '17.8 x 10.8 cm',
      weight: '300g',
      series: 'Seigneur des Anneaux',
      seriesNumber: 1,
      fullDescription: "L'épopée fantastique du Seigneur des Anneaux est l'une des plus grandes œuvres de fantasy jamais écrites. Suivez Frodon et ses compagnons dans leur quête pour détruire l'Anneau Unique et vaincre le Seigneur Noir.",
      librarianNote: "Un classique incontournable! À lire absolument!",
      librarianName: "Marie Dubois",
      librarianAvatar: "https://i.pravatar.cc/150?img=1",
      authorBio: "J.R.R. Tolkien (1892-1973) était un écrivain, poète et philologue anglais.",
      authorImage: "https://i.pravatar.cc/150?img=10"
    },
    2: {
      isbn: '978-2-07-036822-8',
      publisher: 'Gallimard',
      publishDate: '8 juin 1950',
      pages: 312,
      dimensions: '17.8 x 10.8 cm',
      weight: '250g',
      series: null,
      fullDescription: "1984 est un roman dystopique seminal qui a profondément influencé notre compréhension de la politique et de la surveillance.",
      librarianNote: "Un roman prophétique et inquiétant. Incontournable!",
      librarianName: "Pierre Martin",
      librarianAvatar: "https://i.pravatar.cc/150?img=2",
      authorBio: "George Orwell (1903-1950) était un écrivain et journaliste britannique.",
      authorImage: "https://i.pravatar.cc/150?img=11"
    }
  };

  useEffect(() => {
    const fetchBook = async () => {
      const books = await bookService.getBooks();
      const foundBook = books.find(b => b.id === parseInt(id));
      if (foundBook) {
        setBook(foundBook);
        // Set first available format as default
        if (foundBook.formats && foundBook.formats.length > 0) {
          setSelectedFormat(foundBook.formats[0].type);
        }
        const details = bookDetailsMap[foundBook.id];
        if (details) {
          setBook(prev => ({ ...prev, ...details }));
        }
      }
      setLoading(false);
    };
    fetchBook();
  }, [id]);

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
        addToast(`✓ "${book.title}" (${selectedFormat}) ajouté au panier (x${quantity})!`, 'success');
        setQuantity(1);
      }
    }
  };

  const getPriceByFormat = (formatType) => {
    if (!book?.formats) return 0;
    const format = book.formats.find(f => f.type === formatType);
    return format?.price || 0;
  };

  const getStockByFormat = (formatType) => {
    if (!book?.formats) return 0;
    const format = book.formats.find(f => f.type === formatType);
    return format?.stock || 0;
  };

  const isFormatAvailable = (formatType) => {
    if (!book?.formats) return false;
    const format = book.formats.find(f => f.type === formatType);
    return format?.available || false;
  };

  const getFormatLabel = (formatType) => {
    const labels = {
      'ebook': 'E-book',
      'papier-neuf': 'Livre Neuf',
      'papier-occasion': 'Livre d\'Occasion'
    };
    return labels[formatType] || formatType;
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!book) {
    return (
      <div className="not-found">
        <h1>Livre non trouvé</h1>
        <button onClick={() => navigate('/catalog')}>Retour au catalogue</button>
      </div>
    );
  }

  return (
    <div className="product-details-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button onClick={() => navigate('/')}>Accueil</button>
        <span>/</span>
        <button onClick={() => navigate('/catalog')}>Catalogue</button>
        <span>/</span>
        <button onClick={() => navigate('/catalog')}>{book.category}</button>
        <span>/</span>
        <span>{book.title}</span>
      </div>

      {/* Main Content */}
      <div className="product-container">
        {/* Left Column - Book Cover */}
        <div className="product-image-section">
          <div className="book-cover-wrapper">
            <img src={book.cover} alt={book.title} className="book-cover" />
            {book.isBestseller && <span className="badge badge-bestseller">BESTSELLER</span>}
            {book.isNew && <span className="badge badge-new">NOUVEAU</span>}
            <button className="btn-excerpt">📖 Feuilleter l'extrait</button>
          </div>
        </div>

        {/* Middle Column - Book Info */}
        <div className="product-info-section">
          <div className="breadcrumb-title">{book.category}</div>
          <h1 className="book-title">{book.title}</h1>
          
          {book.series && (
            <p className="book-series">
              Série: <span className="series-link">{book.series}</span> - Tome {book.seriesNumber}
            </p>
          )}

          <h2 className="book-author">{book.author}</h2>

          {/* Ratings */}
          <div className="ratings-section">
            <div className="rating-stars">
              <span className="stars">⭐</span>
              <span className="rating-value">{book.rating}</span>
              <span className="reviews-count">({book.reviews} avis)</span>
            </div>
          </div>

          {/* Format & Price Selection */}
          <div className="format-section">
            <h3>Format et Prix</h3>
            <div className="format-options">
              {book.formats?.map(format => (
                <button
                  key={format.type}
                  className={`format-btn ${selectedFormat === format.type ? 'active' : ''} ${!format.available ? 'disabled' : ''}`}
                  onClick={() => format.available && setSelectedFormat(format.type)}
                  disabled={!format.available}
                >
                  <span className="format-name">{getFormatLabel(format.type)}</span>
                  <span className="format-price">{format.price.toFixed(2)}€</span>
                  {!format.available && <span className="format-unavailable">Rupture</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Description Preview */}
          <div className="description-section">
            <h3>Résumé</h3>
            <p className={`description ${showFullDescription ? 'expanded' : 'collapsed'}`}>
              {showFullDescription ? book.fullDescription : book.description}
            </p>
            {book.fullDescription && (
              <button
                className="btn-read-more"
                onClick={() => setShowFullDescription(!showFullDescription)}
              >
                {showFullDescription ? 'Réduire' : 'Lire la suite'}
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Purchase Section (Sticky) */}
        <div className="product-purchase-section">
          <div className="purchase-card">
            {/* Price Display */}
            <div className="price-display">
              <span className="current-price">{getPriceByFormat(selectedFormat).toFixed(2)}€</span>
            </div>

            {/* Stock Status */}
            <div className={`stock-status ${isFormatAvailable(selectedFormat) ? 'in-stock' : 'out-of-stock'}`}>
              {isFormatAvailable(selectedFormat) ? (
                <>
                  <span className="status-icon">✓</span>
                  <span>En stock - Expédié sous 24h</span>
                </>
              ) : (
                <>
                  <span className="status-icon">✗</span>
                  <span>Rupture de stock</span>
                </>
              )}
            </div>

            {/* Low Stock Warning */}
            {isFormatAvailable(selectedFormat) && getStockByFormat(selectedFormat) > 0 && getStockByFormat(selectedFormat) <= 5 && (
              <div className="low-stock-warning">
                ⚠️ Plus que {getStockByFormat(selectedFormat)} exemplaire{getStockByFormat(selectedFormat) > 1 ? 's' : ''} en stock
              </div>
            )}

            {/* Quantity Selector */}
            {isFormatAvailable(selectedFormat) && (
              <div className="quantity-selector">
                <label>Quantité</label>
                <div className="qty-control">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="qty-btn"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={getStockByFormat(selectedFormat)}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="qty-input"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(getStockByFormat(selectedFormat), quantity + 1))}
                    className="qty-btn"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <button
              className={`btn-add-to-cart ${!isFormatAvailable(selectedFormat) ? 'disabled' : ''}`}
              onClick={handleAddToCart}
              disabled={!isFormatAvailable(selectedFormat)}
            >
              💳 Ajouter au Panier
            </button>

            <button
              className={`btn-wishlist ${inWishlist ? 'active' : ''}`}
              onClick={() => setInWishlist(!inWishlist)}
            >
              {inWishlist ? '❤️' : '🤍'} {inWishlist ? 'Dans ma liste' : 'Ajouter à ma liste'}
            </button>

            {/* Additional Info */}
            <div className="purchase-info">
              <p>✓ Livraison gratuite dès 50€</p>
              <p>✓ Retour sous 14 jours</p>
              <p>✓ Service client 24/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Librarian's Note */}
      <section className="librarian-note-section">
        <div className="librarian-card">
          <div className="librarian-header">
            <img src={book.librarianAvatar} alt={book.librarianName} className="librarian-avatar" />
            <div className="librarian-info">
              <h3>Le Mot du Libraire</h3>
              <p className="librarian-name">{book.librarianName}</p>
            </div>
          </div>
          <p className="librarian-note">{book.librarianNote}</p>
        </div>
      </section>

      {/* Technical Details */}
      <section className="technical-details-section">
        <h2>Caractéristiques Techniques</h2>
        <div className="details-table">
          <div className="detail-row">
            <span className="detail-label">Éditeur</span>
            <span className="detail-value">{book.publisher}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">ISBN</span>
            <span className="detail-value">{book.isbn}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Date de parution</span>
            <span className="detail-value">{book.publishDate}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Nombre de pages</span>
            <span className="detail-value">{book.pages}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Dimensions</span>
            <span className="detail-value">{book.dimensions}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Poids</span>
            <span className="detail-value">{book.weight}</span>
          </div>
        </div>
      </section>

      {/* About Author */}
      <section className="author-section">
        <div className="author-card">
          <img src={book.authorImage} alt={book.author} className="author-image" />
          <div className="author-content">
            <h2>À propos de l'Auteur</h2>
            <h3>{book.author}</h3>
            <p>{book.authorBio}</p>
            <button className="btn-author-books">Voir ses autres livres</button>
          </div>
        </div>
      </section>

      {/* Related Books */}
      <section className="related-books-section">
        <h2>Recommandations</h2>
        <div className="related-books-placeholder">
          <p>📚 Les lecteurs ont aussi aimé...</p>
          <p className="text-small">(À intégrer avec l'API)</p>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="reviews-section">
        <h2>Avis Lecteurs ({book.reviews})</h2>
        <div className="reviews-placeholder">
          <p>Section des avis (À implémenter)</p>
        </div>
      </section>
    </div>
  );
}

export default ProductDetailsPage;
