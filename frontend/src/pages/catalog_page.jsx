import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookCard from '../components/BookCard';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import SortOptions from '../components/SortOptions';
import { bookService } from '../services/bookService';
import { useCart } from '../context/CartContext';
import '../styles/CatalogPage.css';

function CatalogPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
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
    priceRange: [0, 50]
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [searchQuery, filters, sort, books]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await bookService.getBooks({}, sort);
      setBooks(data);
    } catch (err) {
      setError('Erreur lors du chargement des livres');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = async () => {
    try {
      let result = [...books];

      if (searchQuery.trim()) {
        const searchResults = await bookService.searchBooks(searchQuery);
        result = result.filter(book => searchResults.find(b => b.id === book.id));
      }

      if (filters.format.length > 0) {
        result = result.filter(book => filters.format.includes(book.format));
      }

      if (filters.availability !== null) {
        result = result.filter(book => book.available === filters.availability);
      }

      if (filters.category.length > 0) {
        result = result.filter(book => filters.category.includes(book.category));
      }

      if (filters.priceRange) {
        result = result.filter(book =>
          book.price >= filters.priceRange[0] && book.price <= filters.priceRange[1]
        );
      }

      result.sort((a, b) => {
        switch (sort) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'newest':
            return b.isNew - a.isNew;
          case 'rating':
            return b.rating - a.rating;
          case 'popular':
          default:
            return b.reviews - a.reviews;
        }
      });

      setFilteredBooks(result);
      setCurrentPage(1);
    } catch (err) {
      console.error('Erreur lors de l\'application des filtres:', err);
    }
  };

  const handleSearch = async (query) => {
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
      priceRange: [0, 50]
    });
  };

  const handleSortChange = (newSort) => {
    setSort(newSort);
  };

  const handleAddToCart = (bookId) => {
    const book = books.find(b => b.id === bookId);
    if (book) {
      addToCart(book);
      // Optional: show feedback
      alert(`✓ "${book.title}" ajouté au panier!`);
    }
  };

  const handleViewDetails = (bookId) => {
    navigate(`/product/${bookId}`);
  };

  const handleAlert = (bookId, email) => {
    alert(`Alerte créée pour ${email} sur le livre ${bookId}`);
  };

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentBooks = filteredBooks.slice(startIndex, endIndex);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1>📚 Catalogue</h1>
        <p>Découvrez notre sélection de {books.length} livres</p>
      </div>

      <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />

      <div className="catalog-container">
        <aside className={`filter-sidebar ${showMobileFilters ? 'mobile-open' : ''}`}>
          <FilterPanel
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </aside>

        <main className="catalog-main">
          <button
            className="mobile-filter-toggle"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            ☰ Filtres
          </button>

          <div className="catalog-toolbar">
            <div className="results-info">
              {loading ? (
                <span>Chargement...</span>
              ) : (
                <span>
                  <strong>{filteredBooks.length}</strong> résultats
                  {searchQuery && ` pour "${searchQuery}"`}
                </span>
              )}
            </div>
            <SortOptions onSortChange={handleSortChange} currentSort={sort} />
          </div>

          {!searchQuery && filteredBooks.length > 0 && currentPage === 1 && (
            <div className="featured-section">
              <div className="featured-box bestsellers">
                <h3>🏆 Bestsellers</h3>
                <div className="featured-books">
                  {books
                    .filter(book => book.isBestseller)
                    .slice(0, 4)
                    .map(book => (
                      <div key={book.id} className="featured-item" onClick={() => handleViewDetails(book.id)}>
                        <img src={book.cover} alt={book.title} />
                      </div>
                    ))}
                </div>
              </div>

              <div className="featured-box new-arrivals">
                <h3>✨ Nouveautés</h3>
                <div className="featured-books">
                  {books
                    .filter(book => book.isNew)
                    .slice(0, 4)
                    .map(book => (
                      <div key={book.id} className="featured-item" onClick={() => handleViewDetails(book.id)}>
                        <img src={book.cover} alt={book.title} />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading">Chargement des livres...</div>
          ) : filteredBooks.length === 0 ? (
            <div className="no-results">
              <p>😞 Aucun livre ne correspond à vos critères</p>
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
