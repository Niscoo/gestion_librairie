import { useState, useEffect } from 'react';
import '../styles/FilterPanel.css';

function FilterPanel({ onFilterChange, onReset, filters: parentFilters, priceBounds = [0, 100] }) {
  const [filters, setFilters] = useState(parentFilters || {
    format: [],
    availability: null,
    category: [],
    priceRange: parentFilters && parentFilters.priceRange ? parentFilters.priceRange : priceBounds
  });

  // Sync local filters when parentFilters or priceBounds change
  useEffect(() => {
    if (parentFilters) {
      setFilters(parentFilters);
    } else {
      setFilters({
        format: [],
        availability: null,
        category: [],
        priceRange: priceBounds
      });
    }
  }, [parentFilters, priceBounds]);

  const [expanded, setExpanded] = useState({
    format: true,
    availability: true,
    category: true,
    price: true
  });

  const formats = [
    { value: 'ebook', label: 'E-book' },
    { value: 'papier-neuf', label: 'Livre Neuf' },
    { value: 'papier-occasion', label: 'Livre d\'Occasion' }
  ];
  const categories = ['Fantasy', 'Science-Fiction', 'Dystopie', 'Classique', 'Non-Fiction', 'Développement Personnel', 'Informatique', 'Contes'];

  const toggleFormat = (format) => {
    const newFormats = filters.format.includes(format)
      ? filters.format.filter(f => f !== format)
      : [...filters.format, format];
    
    const newFilters = { ...filters, format: newFormats };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleCategory = (category) => {
    const newCategories = filters.category.includes(category)
      ? filters.category.filter(c => c !== category)
      : [...filters.category, category];
    
    const newFilters = { ...filters, category: newCategories };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleAvailability = (available) => {
    const newFilters = { ...filters, availability: filters.availability === available ? null : available };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceChange = (e) => {
    const newFilters = {
      ...filters,
      priceRange: [filters.priceRange[0], parseFloat(e.target.value)]
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      format: [],
      availability: null,
      category: [],
      priceRange: priceBounds
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
    onReset();
  };

  const hasActiveFilters = filters.format.length > 0 || filters.availability !== null || filters.category.length > 0 || filters.priceRange[1] < priceBounds[1];

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3>Filtres</h3>
        {hasActiveFilters && (
          <button className="reset-btn" onClick={handleReset}>
            Réinitialiser
          </button>
        )}
      </div>

      {/* Formats */}
      <div className="filter-section">
        <button
          className="filter-title"
          onClick={() => setExpanded({ ...expanded, format: !expanded.format })}
        >
          Format
          <span className="toggle-icon">{expanded.format ? '▼' : '▶'}</span>
        </button>
        {expanded.format && (
          <div className="filter-options">
            {formats.map(format => (
              <label key={format.value} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.format.includes(format.value)}
                  onChange={() => toggleFormat(format.value)}
                />
                <span>{format.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Disponibilité */}
      <div className="filter-section">
        <button
          className="filter-title"
          onClick={() => setExpanded({ ...expanded, availability: !expanded.availability })}
        >
          Disponibilité
          <span className="toggle-icon">{expanded.availability ? '▼' : '▶'}</span>
        </button>
        {expanded.availability && (
          <div className="filter-options">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.availability === true}
                onChange={() => toggleAvailability(true)}
              />
              <span>En stock</span>
            </label>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.availability === false}
                onChange={() => toggleAvailability(false)}
              />
              <span>Rupture</span>
            </label>
          </div>
        )}
      </div>

      {/* Catégories */}
      <div className="filter-section">
        <button
          className="filter-title"
          onClick={() => setExpanded({ ...expanded, category: !expanded.category })}
        >
          Catégories
          <span className="toggle-icon">{expanded.category ? '▼' : '▶'}</span>
        </button>
        {expanded.category && (
          <div className="filter-options">
            {categories.map(category => (
              <label key={category} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filters.category.includes(category)}
                  onChange={() => toggleCategory(category)}
                />
                <span>{category}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Prix */}
      <div className="filter-section">
        <button
          className="filter-title"
          onClick={() => setExpanded({ ...expanded, price: !expanded.price })}
        >
          Prix
          <span className="toggle-icon">{expanded.price ? '▼' : '▶'}</span>
        </button>
        {expanded.price && (
          <div className="price-filter">
            <div className="price-range">
              <span>{priceBounds[0]}€</span>
              <span>{filters.priceRange[1]}€</span>
            </div>
            <input
              type="range"
              min={priceBounds[0]}
              max={priceBounds[1]}
              value={filters.priceRange[1]}
              onChange={handlePriceChange}
              className="price-slider"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterPanel;
