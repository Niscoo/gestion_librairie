import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCard from '../components/BookCard';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import SortOptions from '../components/SortOptions';
import { bookService } from '../services/bookService';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import '../styles/CatalogPage.css';

function CatalogPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    format: [],
    availability: null,
    category: [],
    priceRange: [0, 100]
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceBounds, setPriceBounds] = useState([0, 100]);

  const ITEMS_PER_PAGE = 12;

  // Charger les livres au montage
  useEffect(() => {
    loadBooks();
  }, []);

  // Appliquer filtres et tri quand ils changent
  useEffect(() => {
    applyFiltersAndSort();
  }, [searchQuery, filters, sort, books]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await bookService.getBooks({}, 'popular');
      setBooks(data);
      const range = await bookService.getPriceRange();
      setPriceBounds(range);
      setFilters(prev => ({ ...prev, priceRange: range }));
    } catch (err) {
      setError('Erreur lors du chargement des livres');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = async () => {
    try {
      // Appliquer les filtres du service sur les livres chargés
      // (Ou charger directement avec les filtres - c'est plus simple)
      const result = await bookService.getBooks(filters, sort);

      // Appliquer la recherche
      let searchFiltered = result;
      if (searchQuery.trim()) {
        const searchResults = await bookService.searchBooks(searchQuery);
        searchFiltered = result.filter(book => searchResults.find(b => b.id === book.id));
      }

      setFilteredBooks(searchFiltered);
      setCurrentPage(1);
    } catch (err) {
      console.error('Erreur lors du filtrage:', err);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      format: [],
      availability: null,
      category: [],
      priceRange: priceBounds
    });
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
  };

  const handleAddToCart = (bookId) => {
    const book = books.find(b => b.id === bookId);
    if (book) {
      const availableFormats = (book.formats || []).filter(f => f.available);
      if (availableFormats.length === 0) {
        addToast(`Le livre "${book.title}" est indisponible.`, 'info');
        return;
      }
      const chosen = [...availableFormats].sort((a, b) => a.price - b.price)[0];
      addToCart({ ...book, format: chosen.type, price: chosen.price, quantity: 1 });
      addToast(`✓ "${book.title}" (${chosen.type}) ajouté au panier!`, 'success');
    }
  };

  const handleViewDetails = (bookId) => {
    navigate(`/product/${bookId}`);
  };

  const handleAlert = (bookId, email) => {
    addToast(`Alerte créée pour ${email} sur le livre ${bookId}`, 'info');
  };

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBooks = filteredBooks.slice(startIndex, endIndex);

  if (loading) {
    return <div className="loading">Chargement des livres...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="catalog-page">
      <div className="catalog-container">
        {/* Panneau latéral des filtres */}
        <aside className={`filters-panel ${showMobileFilters ? 'open' : ''}`}>
          <FilterPanel
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            filters={filters}
            priceBounds={priceBounds}
          />
        </aside>

        {/* Contenu principal */}
        <main className="catalog-main">
          {/* Barre de titre et recherche */}
          <div className="catalog-header">
            <h1>📚 Catalogue</h1>
            <div className="header-controls">
              <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />
              <SortOptions onSortChange={handleSortChange} currentSort={sort} />
              <button
                className="mobile-filters-btn"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                ⚙️ Filtres
              </button>
            </div>
          </div>

          {/* Résultats */}
          {filteredBooks.length === 0 ? (
            <div className="no-results">
              <p>Aucun livre ne correspond à vos critères de recherche.</p>
              <button
                className="btn btn-primary"
                onClick={handleResetFilters}
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              <div className="books-grid">
                {currentBooks.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onAddToCart={handleAddToCart}
                    onViewDetails={handleViewDetails}
                    onAlert={handleAlert}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Précédent
                  </button>

                  <div className="pagination-info">
                    Page {currentPage} sur {totalPages}
                  </div>

                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default CatalogPage;
