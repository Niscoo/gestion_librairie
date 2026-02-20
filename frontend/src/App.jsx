import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'

// Import des pages
import HomePage from './pages/home_page'
import CatalogPage from './pages/catalog_page'
import ProductDetailsPage from './pages/product_details_page'
import AIResultsPage from './pages/ai_results_page'
import ChatEphemPage from './pages/chat_ephem_page'
import EbookLiseuse from './pages/ebook_liseuse'

function App() {
  return (
<<<<<<< HEAD
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <h1>🎉 Gestion de Librairie</h1>
          <ul className="nav-links">
            <li><Link to="/">Accueil</Link></li>
            <li><Link to="/catalog">Catalogue</Link></li>
            <li><Link to="/ai-results">Résultats IA</Link></li>
            <li><Link to="/chat">Chat</Link></li>
            <li><Link to="/ebook">Lecteur E-book</Link></li>
          </ul>
        </nav>
=======
    <div className="card">
      <h1>🎉 Salut c'est Dina</h1>
      <h1>🎉 Gestion de Librairie</h1>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '2px solid #61dafb', borderRadius: '8px' }}>
        <h2>{message}</h2>
        <p style={{ fontSize: '18px', color: 'green' }}>{status}</p>
        
        {error && (
          <p style={{ fontSize: '16px', color: 'red', marginTop: '20px' }}>
            ⚠️ {error}
          </p>
        )}
      </div>
>>>>>>> origin/Dina

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/product/:id" element={<ProductDetailsPage />} />
            <Route path="/ai-results" element={<AIResultsPage />} />
            <Route path="/chat" element={<ChatEphemPage />} />
            <Route path="/ebook" element={<EbookLiseuse />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
