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
import { ThemeProvider } from './context/ThemeContext'
import { FavoritesProvider } from './context/FavoritesContext'

import AppContent from './AppContent'

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <UserProvider>
          <CartProvider>
            <FavoritesProvider>
              <AppContent />
            </FavoritesProvider>
          </CartProvider>
        </UserProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
