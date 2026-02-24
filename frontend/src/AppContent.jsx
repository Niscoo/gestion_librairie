import { BrowserRouter as Router, Routes, Route, NavLink, Link, Navigate } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react'
import './styles/ui-kit.css'
import './App.css'
import HomePage from './pages/home_page'
import CatalogPage from './pages/catalog_page'
import CartPage from './pages/cart_page'
import ProductDetailsPage from './pages/product_details_page'
import CheckoutPage from './pages/checkout_page'
import PaymentPage from './pages/payment_page'
import OrderConfirmationPage from './pages/order_confirmation_page'
import FavoritesPage from './pages/favorites_page'
import ProfilePage from './pages/profile_page'
import OrdersPage from './pages/orders_page'
import OrderDetailPage from './pages/order_detail_page'
import AdminPage from './pages/admin_page'
import Cart from './components/Cart'
import AuthModal from './components/AuthModal'
import ProfileDropdown from './components/ProfileDropdown'
import { ThemeContext } from './context/ThemeContext'
import { useUser } from './context/UserContext'
import { useFavorites } from './context/FavoritesContext'


function AppShell() {
  const { isDark, toggleTheme } = useContext(ThemeContext)
  const { user, isConnected, logout } = useUser()
  const { favoritesCount } = useFavorites()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const closeMenu = () => setIsMenuOpen(false)

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMenuOpen])

  return (
    <div className="app-container">
      <nav className="navbar" aria-label="Navigation principale">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <h1>Gestion de Librairie</h1>
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={isMenuOpen}
          aria-controls="primary-nav"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>

        <div id="primary-nav" className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          <ul className="nav-links">
            {isConnected && user && user.role === 'admin' ? (
              <li>
                <NavLink to="/admin" onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>
                  Admin
                </NavLink>
              </li>
            ) : (
              <>
                <li>
                  <NavLink to="/" end onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>
                    Accueil
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/catalog" onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>
                    Catalogue
                  </NavLink>
                </li>
                {/* <li>
                  <NavLink to="/cart" onClick={closeMenu} className={({ isActive }) => (isActive ? 'active' : '')}>
                    Panier
                  </NavLink>
                </li> */}
              </>
            )}
          </ul>

          <div className="nav-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
              title="Basculer le thème"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {isConnected && user ? (
              <div className="nav-profile-wrap">
                <button
                  className="btn-avatar"
                  onClick={() => setShowProfile(p => !p)}
                  aria-label="Ouvrir le profil"
                  aria-expanded={showProfile}
                >
                  {(() => {
                    const p = (user.prenom || '').trim();
                    const n = (user.nom || '').trim();
                    if (p && n) return `${p[0]}${n[0]}`.toUpperCase();
                    if (n) return n.slice(0, 2).toUpperCase();
                    return (user.email || '?')[0].toUpperCase();
                  })()}
                </button>
                {showProfile && <ProfileDropdown onClose={() => setShowProfile(false)} />}
              </div>
            ) : (
              <button
                className="btn-login"
                onClick={() => { setShowAuth(true); closeMenu(); }}
              >
                Connexion
              </button>
            )}

            {/* desktop-cart retiré de la navbar — Cart est maintenant flottant */}
          </div>
        </div>

        {isMenuOpen && (
          <button
            className="nav-backdrop"
            aria-label="Fermer le menu"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </nav>

      {/* Bouton panier flottant (masqué pour admin) */}
      {(!isConnected || user?.role !== 'admin') && <Cart />}

      <main className="main-content">
        <Routes>
          <Route path="/" element={isConnected && user?.role === 'admin' ? <Navigate to="/admin" replace /> : <HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/paiement/:orderId" element={<PaymentPage />} />
          <Route path="/favoris" element={<FavoritesPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/commandes" element={<OrdersPage />} />
          <Route path="/commandes/:id" element={<OrderDetailPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}

function AppContent() {
  return (
    <Router>
      <AppShell />
    </Router>
  )
}

export default AppContent
