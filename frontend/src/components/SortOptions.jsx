import '../styles/SortOptions.css';

function SortOptions({ onSortChange, currentSort }) {
  const sortOptions = [
    { value: 'popular', label: 'Popularité' },
    { value: 'newest', label: 'Nouveautés' },
    { value: 'price-asc', label: 'Prix: croissant' },
    { value: 'price-desc', label: 'Prix: décroissant' },
    { value: 'rating', label: 'Note moyenne' }
  ];

  return (
    <div className="sort-options">
      <label htmlFor="sort-select">Trier par:</label>
      <select
        id="sort-select"
        value={currentSort}
        onChange={(e) => onSortChange(e.target.value)}
        className="sort-select"
      >
        {sortOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SortOptions;
