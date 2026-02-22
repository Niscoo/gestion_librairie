import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useContext } from 'react'

// Import des pages
import HomePage from './pages/home_page'
import CatalogPage from './pages/catalog_page'
import CartPage from './pages/cart_page'
import ProductDetailsPage from './pages/product_details_page'
import CheckoutPage from './pages/checkout_page'
import OrderConfirmationPage from './pages/order_confirmation_page'
import Cart from './components/Cart'
import { ThemeContext } from './context/ThemeContext'

function AppContent() {
  const { isDark, toggleTheme } = useContext(ThemeContext)

  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <h1>Gestion de Librairie</h1>
          <ul className="nav-links">
            <li><Link to="/">Accueil</Link></li>
            <li><Link to="/catalog">Catalogue</Link></li>
            <li><Link to="/cart">🛒 Panier</Link></li>
            <li><Link to="/ai-results">Résultats IA</Link></li>
            <li><Link to="/chat">Chat</Link></li>
            <li><Link to="/ebook">Lecteur E-book</Link></li>
          </ul>
          <div className="nav-actions">
            <button className="theme-toggle" onClick={toggleTheme} title="Basculer le thème">
              {isDark ? '☀️' : '🌙'}
            </button>
            <Cart />
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
            <Route path="/product/:id" element={<ProductDetailsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default AppContent
