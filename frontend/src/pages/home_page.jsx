import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import FeaturedBooks from '../components/FeaturedBooks';
import ValueProposition from '../components/ValueProposition';
import { bookService } from '../services/bookService';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import '../styles/HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [newBooks, setNewBooks] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const books = await bookService.getBooks({}, 'popular');
        const detectedNew = books.filter((book) => book.isNew);
        const detectedBestsellers = books.filter((book) => book.isBestseller);
        setNewBooks((detectedNew.length ? detectedNew : books).slice(0, 4));
        setBestsellers((detectedBestsellers.length ? detectedBestsellers : books.slice(4)).slice(0, 4));
      } catch (err) {
        console.error("Failed to load home data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const testimonials = useMemo(
    () => [
      {
        author: 'Camille B.',
        message: 'Service rapide et catalogue clair. J’ai trouvé mon livre en moins de 2 minutes.'
      },
      {
        author: 'Nicolas D.',
        message: 'Checkout simple et sans friction. Super expérience sur mobile.'
      },
      {
        author: 'Sophie R.',
        message: 'Les fiches livres sont détaillées et les recommandations sont pertinentes.'
      }
    ],
    []
  );

  const handleAddToCart = (bookId) => {
    const allBooks = [...newBooks, ...bestsellers];
    const target = allBooks.find((book) => book.id === bookId);
    if (!target) return;
    const availableFormats = (target.formats || []).filter((format) => format.available);
    if (!availableFormats.length) {
      addToast(`"${target.title}" est indisponible pour le moment.`, 'info');
      return;
    }
    const selectedFormat = [...availableFormats].sort((a, b) => a.price - b.price)[0];
    addToCart({
      ...target,
      format: selectedFormat.type,
      price: selectedFormat.price,
      quantity: 1
    });
    addToast(`"${target.title}" ajouté au panier.`, 'success');
  };

  const handleViewDetails = (bookId) => {
    navigate(`/product/${bookId}`);
  };

  const handleAlert = (_bookId, email) => {
    addToast(`Alerte créée pour ${email}`, 'info');
  };

  return (
    <div className="home-page">
      <HeroSection />
      <ValueProposition />

      {loading ? (
        <div className="loading-spinner">Chargement...</div>
      ) : (
        <>
          <FeaturedBooks
            books={newBooks}
            title="🔥 Nouveautés"
            viewAllLink="/catalog"
            onAddToCart={handleAddToCart}
            onViewDetails={handleViewDetails}
            onAlert={handleAlert}
          />

          <FeaturedBooks
            books={bestsellers}
            title="⭐ Meilleures ventes"
            viewAllLink="/catalog"
            onAddToCart={handleAddToCart}
            onViewDetails={handleViewDetails}
            onAlert={handleAlert}
          />

          <section className="social-proof" aria-label="Avis clients">
            <h2>Ils recommandent la librairie</h2>
            <div className="testimonial-grid">
              {testimonials.map((testimonial) => (
                <article key={testimonial.author} className="testimonial-card">
                  <p>“{testimonial.message}”</p>
                  <span>{testimonial.author}</span>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default HomePage
