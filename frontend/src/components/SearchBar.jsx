import { useState } from 'react';
import '../styles/SearchBar.css';

function SearchBar({ onSearch, onClear, suggestions = [], onSelectSuggestion }) {
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
          className="search-input input-field"
          aria-label="Rechercher un livre"
          aria-autocomplete="list"
          aria-expanded={isFocused && query.length > 0 && suggestions.length > 0}
        />
        {query && (
          <button
            className="clear-btn"
            onClick={handleClear}
            title="Effacer la recherche"
            aria-label="Effacer la recherche"
          >
            ✕
          </button>
        )}
      </div>
      {isFocused && query.trim().length > 0 && suggestions.length > 0 && (
        <ul className="search-suggestions" role="listbox" aria-label="Suggestions de recherche">
          {suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                className="suggestion-btn"
                onMouseDown={() => {
                  setQuery(suggestion);
                  onSelectSuggestion?.(suggestion);
                }}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SearchBar;
