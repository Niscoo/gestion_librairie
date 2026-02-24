import { Link } from 'react-router-dom';
import '../styles/HeroSection.css';

function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1>Découvrez votre prochaine lecture préférée</h1>
        <p>Explorez notre vaste collection de livres, des classiques intemporels aux dernières nouveautés.</p>
        <div className="hero-actions">
          <Link to="/catalog" className="btn btn-primary btn-lg">Parcourir le catalogue</Link>
          <Link to="/catalog?sort=newest" className="btn btn-secondary btn-lg">Voir les nouveautés</Link>
        </div>
      </div>
      <div className="hero-image">
        {/* Placeholder for hero image or illustration */}
        <div className="hero-placeholder">📚</div>
      </div>
    </section>
  );
}

export default HeroSection;
