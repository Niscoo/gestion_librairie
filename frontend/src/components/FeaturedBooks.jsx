import BookCard from './BookCard';
import { Link } from 'react-router-dom';
import '../styles/FeaturedBooks.css';

function FeaturedBooks({ books, title, viewAllLink, onAddToCart, onViewDetails, onAlert }) {
  if (!books || books.length === 0) return null;

  return (
    <section className="featured-books">
      <div className="featured-header">
        <h2>{title}</h2>
        <Link to={viewAllLink} className="featured-view-all">Voir tout →</Link>
      </div>
      <div className="books-grid-featured">
        {books.slice(0, 4).map(book => (
          <BookCard
            key={book.id}
            book={book}
            onAddToCart={onAddToCart}
            onViewDetails={onViewDetails}
            onAlert={onAlert}
          />
        ))}
      </div>
    </section>
  );
}

export default FeaturedBooks;
