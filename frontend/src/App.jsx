import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'

// Import des pages
import HomePage from './pages/home_page'
import CatalogPage from './pages/catalog_page'
import CartPage from './pages/cart_page'
import ProductDetailsPage from './pages/product_details_page'
import CheckoutPage from './pages/checkout_page'
import OrderConfirmationPage from './pages/order_confirmation_page'
import Cart from './components/Cart'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { UserProvider } from './context/UserContext'
// import AIResultsPage from './pages/ai_results_page'
// import ChatEphemPage from './pages/chat_ephem_page'
// import EbookLiseuse from './pages/ebook_liseuse'

function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <UserProvider>
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
                <Cart />
              </nav>

              <main className="main-content">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/catalog" element={<CatalogPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                  <Route path="/product/:id" element={<ProductDetailsPage />} />
                  {/* <Route path="/ai-results" element={<AIResultsPage />} />
                  <Route path="/chat" element={<ChatEphemPage />} />
                  <Route path="/ebook" element={<EbookLiseuse />} /> */}
                </Routes>
              </main>
            </div>
          </Router>
        </UserProvider>
      </CartProvider>
    </ToastProvider>
  )
}

export default App
