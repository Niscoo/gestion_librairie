import '../styles/FilterPanel.css';

const FORMAT_OPTIONS = [
  { value: 'ebook',           label: 'E-book'   },
  { value: 'papier-neuf',     label: 'Neuf'     },
  { value: 'papier-occasion', label: 'Occasion' },
];

const CATEGORIES = [
  'Fantasy',
  'Science-Fiction',
  'Dystopie',
  'Classique',
  'Non-Fiction',
  'Développement Personnel',
  'Informatique',
  'Contes',
];

function FilterPanel({ onFilterChange, onReset, filters: parentFilters, priceBounds = [0, 100] }) {
  const filters = parentFilters || {
    format: [],
    availability: null,
    category: [],
    priceRange: priceBounds,
  };

  const activeCount =
    filters.format.length +
    (filters.availability !== null ? 1 : 0) +
    filters.category.length +
    (filters.priceRange[1] < priceBounds[1] ? 1 : 0);

  const toggleFormat = (value) => {
    const next = filters.format.includes(value)
      ? filters.format.filter(f => f !== value)
      : [...filters.format, value];
    onFilterChange({ ...filters, format: next });
  };

  const toggleCategory = (value) => {
    const next = filters.category.includes(value)
      ? filters.category.filter(c => c !== value)
      : [...filters.category, value];
    onFilterChange({ ...filters, category: next });
  };

  const setAvailability = (value) => {
    onFilterChange({ ...filters, availability: filters.availability === value ? null : value });
  };

  const handlePriceChange = (e) => {
    onFilterChange({ ...filters, priceRange: [filters.priceRange[0], parseFloat(e.target.value)] });
  };

  const handleReset = () => {
    onFilterChange({ format: [], availability: null, category: [], priceRange: priceBounds });
    onReset();
  };

  const priceFillPct =
    priceBounds[1] > priceBounds[0]
      ? ((filters.priceRange[1] - priceBounds[0]) / (priceBounds[1] - priceBounds[0])) * 100
      : 100;

  return (
    <aside className="filter-panel" aria-label="Filtres">

      {/* ── Header ── */}
      <div className="fp-header">
        <span className="fp-title">
          Filtres
          {activeCount > 0 && <span className="fp-badge">{activeCount}</span>}
        </span>
        {activeCount > 0 && (
          <button className="fp-reset" onClick={handleReset} aria-label="Réinitialiser tous les filtres">
            Tout effacer
          </button>
        )}
      </div>

      {/* ── Format ── */}
      <section className="fp-section">
        <p className="fp-label">Format</p>
        <div className="fp-format-grid">
          {FORMAT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`fp-format-btn ${filters.format.includes(opt.value) ? 'active' : ''}`}
              onClick={() => toggleFormat(opt.value)}
              aria-pressed={filters.format.includes(opt.value)}
            >
              <span className="fp-format-label">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Disponibilité ── */}
      <section className="fp-section">
        <p className="fp-label">Disponibilité</p>
        <div className="fp-avail-row">
          <button
            className={`fp-avail-btn ${filters.availability === true ? 'active' : ''}`}
            onClick={() => setAvailability(true)}
            aria-pressed={filters.availability === true}
          >
            <span className="fp-avail-dot in-stock" />
            En stock
          </button>
          <button
            className={`fp-avail-btn ${filters.availability === false ? 'active' : ''}`}
            onClick={() => setAvailability(false)}
            aria-pressed={filters.availability === false}
          >
            <span className="fp-avail-dot out-stock" />
            Rupture
          </button>
        </div>
      </section>

      {/* ── Prix ── */}
      <section className="fp-section">
        <div className="fp-price-header">
          <p className="fp-label" style={{ margin: 0 }}>Prix max</p>
          <span className="fp-price-value">{filters.priceRange[1].toFixed(0)} €</span>
        </div>
        <div className="fp-slider-wrap">
          <input
            type="range"
            min={priceBounds[0]}
            max={priceBounds[1]}
            step="1"
            value={filters.priceRange[1]}
            onChange={handlePriceChange}
            className="fp-slider"
            aria-label="Prix maximum"
            style={{ '--fill': `${priceFillPct}%` }}
          />
          <div className="fp-slider-bounds">
            <span>{priceBounds[0]} €</span>
            <span>{priceBounds[1]} €</span>
          </div>
        </div>
      </section>

      {/* ── Catégories ── */}
      <section className="fp-section fp-section--last">
        <p className="fp-label">Catégories</p>
        <div className="fp-categories">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`fp-cat-btn ${filters.category.includes(cat) ? 'active' : ''}`}
              onClick={() => toggleCategory(cat)}
              aria-pressed={filters.category.includes(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

    </aside>
  );
}

export default FilterPanel;
