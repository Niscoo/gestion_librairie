import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useUser } from '../context/UserContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { bookService } from '../services/bookService';
import '../styles/FavoritesPage.css';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite, loading: favLoading } = useFavorites();
  const { isConnected, user } = useUser();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [books, setBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) navigate('/catalog');
  }, [isConnected, navigate]);

  // Load book details for each favorite
  useEffect(() => {
    if (!favorites.length) { setBooks([]); return; }
    setLoadingBooks(true);
    bookService.getBooks().then((allBooks) => {
      const favIsbns = new Set(favorites.map(f => f.isbn));
      setBooks(allBooks.filter(b => favIsbns.has(b.id)));
    }).finally(() => setLoadingBooks(false));
  }, [favorites]);

  const handleRemove = async (book) => {
    await toggleFavorite(book.id);
    addToast(`"${book.title}" retiré des favoris`, 'info');
  };

  const handleAddToCart = (book) => {
    const available = (book.formats || []).filter(f => f.available);
    if (!available.length) { addToast('Ce livre est indisponible', 'info'); return; }
    const cheapest = [...available].sort((a, b) => a.price - b.price)[0];
    addToCart({ ...book, format: cheapest.type, price: cheapest.price, quantity: 1 });
    addToast(`"${book.title}" ajouté au panier`, 'success');
  };

  if (!isConnected) return null;

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <div>
          <h1>Mes favoris</h1>
          {user && <p className="favorites-subtitle">{user.prenom || user.nom || user.email}</p>}
        </div>
        <span className="favorites-count">
          {favorites.length} livre{favorites.length !== 1 ? 's' : ''}
        </span>
      </div>

      {(favLoading || loadingBooks) && (
        <div className="favorites-loading">Chargement...</div>
      )}

      {!favLoading && !loadingBooks && favorites.length === 0 && (
        <div className="favorites-empty">
          <div className="favorites-empty-icon">♡</div>
          <h2>Aucun favori pour l'instant</h2>
          <p>Ajoutez des livres à vos favoris depuis le catalogue.</p>
          <button className="btn-go-catalog" onClick={() => navigate('/catalog')}>
            Parcourir le catalogue
          </button>
        </div>
      )}

      {books.length > 0 && (
        <div className="favorites-grid">
          {books.map(book => {
            const hasAvailable = book.formats.some(f => f.available);
            const minPrice = Math.min(...book.formats.map(f => f.price));
            return (
              <div key={book.id} className="fav-card">
                <div className="fav-card-cover" onClick={() => navigate(`/product/${book.id}`)}>
                  <img src={book.cover} alt={`Couverture de ${book.title}`} />
                  <button
                    className="fav-remove-btn"
                    onClick={(e) => { e.stopPropagation(); handleRemove(book); }}
                    aria-label={`Retirer ${book.title} des favoris`}
                    title="Retirer des favoris"
                  >
                    ♥
                  </button>
                </div>
                <div className="fav-card-info">
                  <h3 className="fav-title" onClick={() => navigate(`/product/${book.id}`)}>
                    {book.title}
                  </h3>
                  <p className="fav-author">{book.author}</p>
                  <div className="fav-footer">
                    <span className="fav-price">À partir de {minPrice.toFixed(2)} €</span>
                    <button
                      className={`fav-cart-btn ${!hasAvailable ? 'disabled' : ''}`}
                      onClick={() => handleAddToCart(book)}
                      disabled={!hasAvailable}
                    >
                      {hasAvailable ? 'Ajouter au panier' : 'Indisponible'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
