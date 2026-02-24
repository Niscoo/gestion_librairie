import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BookCard from '../components/BookCard';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import SortOptions from '../components/SortOptions';
import { bookService } from '../services/bookService';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import '../styles/CatalogPage.css';

const DEFAULT_FILTERS = (priceBounds = [0, 100]) => ({
  format: [],
  availability: null,
  category: [],
  priceRange: priceBounds
});

function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState(searchParams.get('sort') || 'popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [priceBounds, setPriceBounds] = useState([0, 100]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS());
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [quickViewBook, setQuickViewBook] = useState(null);

  const ITEMS_PER_PAGE = 12;

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const [data, range] = await Promise.all([
        bookService.getBooks({}, 'popular'),
        bookService.getPriceRange()
      ]);
      setBooks(data);
      setPriceBounds(range);
      setFilters(DEFAULT_FILTERS(range));
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement des livres');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const applyFiltersAndSort = useCallback(() => {
    if (!books.length) {
      setFilteredBooks([]);
      return;
    }

    let result = [...books];

    if (filters.format.length > 0) {
      result = result.filter((book) => {
        const availableFormats = book.formats || [];
        return availableFormats.some((format) => filters.format.includes(format.type));
      });
    }

    if (filters.availability !== null) {
      result = result.filter((book) => {
        const hasAvailable = (book.formats || []).some((format) => format.available);
        return filters.availability ? hasAvailable : !hasAvailable;
      });
    }

    if (filters.category.length > 0) {
      result = result.filter((book) => filters.category.includes(book.category));
    }

    if (filters.priceRange) {
      result = result.filter((book) => {
        const minPrice = Math.min(...(book.formats || []).map((format) => format.price));
        return minPrice >= filters.priceRange[0] && minPrice <= filters.priceRange[1];
      });
    }

    if (searchQuery.trim()) {
      const normalized = searchQuery.toLowerCase();
      result = result.filter((book) =>
        [book.title, book.author, book.category]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(normalized))
      );
    }

    result.sort((a, b) => {
      const getMinPrice = (book) => Math.min(...(book.formats || []).map((format) => format.price));
      switch (sort) {
        case 'price-asc':
          return getMinPrice(a) - getMinPrice(b);
        case 'price-desc':
          return getMinPrice(b) - getMinPrice(a);
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          return Number(b.isNew) - Number(a.isNew);
        case 'popular':
        default:
          return b.reviews - a.reviews;
      }
    });

    setFilteredBooks(result);
    setCurrentPage(1);
  }, [books, filters, searchQuery, sort]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const normalized = searchQuery.toLowerCase();
    const matches = books
      .filter((book) =>
        [book.title, book.author]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(normalized))
      )
      .map((book) => book.title)
      .filter((value, index, self) => self.indexOf(value) === index)
      .slice(0, 6);
    setSearchSuggestions(matches);
  }, [books, searchQuery]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setQuickViewBook(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (searchQuery.trim()) {
      chips.push({ id: 'search', type: 'search', label: `Recherche: ${searchQuery}` });
    }
    filters.format.forEach((value) => {
      chips.push({ id: `format-${value}`, type: 'format', value, label: `Format: ${value}` });
    });
    if (filters.availability !== null) {
      chips.push({
        id: 'availability',
        type: 'availability',
        label: filters.availability ? 'Disponibilité: en stock' : 'Disponibilité: rupture'
      });
    }
    filters.category.forEach((value) => {
      chips.push({ id: `category-${value}`, type: 'category', value, label: `Catégorie: ${value}` });
    });
    if (filters.priceRange[1] < priceBounds[1]) {
      chips.push({
        id: 'price',
        type: 'price',
        label: `Prix max: ${filters.priceRange[1]}€`
      });
    }
    return chips;
  }, [filters, priceBounds, searchQuery]);

  const handleRemoveFilterChip = (chip) => {
    if (chip.type === 'search') {
      setSearchQuery('');
      return;
    }

    if (chip.type === 'format') {
      setFilters((prev) => ({
        ...prev,
        format: prev.format.filter((value) => value !== chip.value)
      }));
      return;
    }

    if (chip.type === 'availability') {
      setFilters((prev) => ({ ...prev, availability: null }));
      return;
    }

    if (chip.type === 'category') {
      setFilters((prev) => ({
        ...prev,
        category: prev.category.filter((value) => value !== chip.value)
      }));
      return;
    }

    if (chip.type === 'price') {
      setFilters((prev) => ({ ...prev, priceRange: priceBounds }));
    }
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS(priceBounds));
    setSearchQuery('');
    setSearchSuggestions([]);
  };

  const handleAddToCart = (bookId) => {
    const book = books.find((item) => item.id === bookId);
    if (!book) return;
    const availableFormats = (book.formats || []).filter((format) => format.available);
    if (!availableFormats.length) {
      addToast(`Le livre "${book.title}" est indisponible.`, 'info');
      return;
    }
    const chosenFormat = [...availableFormats].sort((a, b) => a.price - b.price)[0];
    addToCart({
      ...book,
      format: chosenFormat.type,
      price: chosenFormat.price,
      quantity: 1
    });
    addToast(`✓ "${book.title}" (${chosenFormat.type}) ajouté au panier!`, 'success');
  };

  const handleViewDetails = (bookId) => {
    navigate(`/product/${bookId}`);
  };

  const handleAlert = (_bookId, email) => {
    addToast(`Alerte créée pour ${email}`, 'info');
  };

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
  const currentBooks = filteredBooks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return <div className="loading">Chargement des livres...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="catalog-page">
      <div className="catalog-container">
        <aside className={`filters-panel ${showMobileFilters ? 'open' : ''}`}>
          <FilterPanel
            onFilterChange={setFilters}
            onReset={handleResetFilters}
            filters={filters}
            priceBounds={priceBounds}
          />
        </aside>

        <main className="catalog-main">
          <header className="catalog-header">
            <div className="catalog-header-top">
              <div className="catalog-header-info">
                <h1>Catalogue</h1>
                <span className="catalog-results-count">
                  {filteredBooks.length} livre{filteredBooks.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="catalog-header-actions">
                <SortOptions onSortChange={setSort} currentSort={sort} />
                <button
                  className="mobile-filters-btn"
                  onClick={() => setShowMobileFilters((prev) => !prev)}
                  aria-expanded={showMobileFilters}
                  aria-label={showMobileFilters ? 'Fermer les filtres' : 'Ouvrir les filtres'}
                >
                  {showMobileFilters ? 'Fermer' : 'Filtres'}
                </button>
              </div>
            </div>
            <SearchBar
              onSearch={setSearchQuery}
              onClear={() => setSearchQuery('')}
              suggestions={searchSuggestions}
              onSelectSuggestion={setSearchQuery}
            />
          </header>

          {activeFilterChips.length > 0 && (
            <section className="active-filters" aria-label="Filtres actifs">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.id}
                  className="filter-chip"
                  onClick={() => handleRemoveFilterChip(chip)}
                  aria-label={`Retirer le filtre ${chip.label}`}
                >
                  {chip.label} <span>✕</span>
                </button>
              ))}
              <button className="clear-all-filters" onClick={handleResetFilters}>
                Tout effacer
              </button>
            </section>
          )}

          {filteredBooks.length === 0 ? (
            <div className="no-results">
              <p>Aucun livre ne correspond à vos critères de recherche.</p>
              <button className="btn btn-primary" onClick={handleResetFilters}>
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              <div className="books-grid">
                {currentBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onAddToCart={handleAddToCart}
                    onViewDetails={handleViewDetails}
                    onAlert={handleAlert}
                    onQuickView={setQuickViewBook}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Précédent
                  </button>
                  <div className="pagination-info">
                    Page {currentPage} sur {totalPages}
                  </div>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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

      {quickViewBook && (
        <div className="quickview-overlay" onClick={() => setQuickViewBook(null)}>
          <section
            className="quickview-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Aperçu rapide de ${quickViewBook.title}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="quickview-close" onClick={() => setQuickViewBook(null)} aria-label="Fermer l’aperçu">
              ✕
            </button>
            <img src={quickViewBook.cover} alt={`Couverture de ${quickViewBook.title}`} />
            <div className="quickview-content">
              <h2>{quickViewBook.title}</h2>
              <p className="quickview-author">{quickViewBook.author}</p>
              <p className="quickview-description">{quickViewBook.description}</p>
              <div className="quickview-formats">
                {(quickViewBook.formats || []).map((format) => (
                  <span key={format.type} className="quickview-format">
                    {format.type} · {format.price.toFixed(2)}€
                  </span>
                ))}
              </div>
              <div className="quickview-actions">
                <button className="btn btn-primary" onClick={() => handleViewDetails(quickViewBook.id)}>
                  Voir la fiche
                </button>
                <button className="btn btn-secondary" onClick={() => handleAddToCart(quickViewBook.id)}>
                  Ajouter au panier
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default CatalogPage;
