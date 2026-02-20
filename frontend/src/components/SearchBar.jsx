import { useState, useEffect } from 'react';
import '../styles/SearchBar.css';

function SearchBar({ onSearch, onClear }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <div className="search-bar-container">
      <div className={`search-bar ${isFocused ? 'focused' : ''}`}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Rechercher un titre, auteur, ou catégorie..."
          value={query}
          onChange={handleSearch}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="search-input"
        />
        {query && (
          <button
            className="clear-btn"
            onClick={handleClear}
            title="Effacer la recherche"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
