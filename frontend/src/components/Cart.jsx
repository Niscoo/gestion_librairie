import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/Cart.css';

function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="cart-wrapper">
      {/* Icône panier dans la navbar */}
      <button 
        className="cart-icon-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Panier"
      >
        🛒
        {cartItems.length > 0 && (
          <span className="cart-badge">{cartItems.length}</span>
        )}
      </button>

      {/* Panel panier */}
      {isOpen && (
        <div className="cart-panel">
          <div className="cart-header">
            <h2>🛒 Panier</h2>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <p>Votre panier est vide</p>
              <p className="empty-tip">Ajoutez des livres pour commencer!</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map(item => (
                  <div key={`${item.id}-${item.format}`} className="cart-item">
                    <img src={item.cover} alt={item.title} className="item-cover" />
                    
                    <div className="item-details">
                      <h3>{item.title}</h3>
                      <p className="author">{item.author}</p>
                      <p className="format-tag">{item.format}</p>
                      <p className="price">{(item.price ?? 0).toFixed(2)}€</p>
                    </div>

                    <div className="item-quantity">
                      <button 
                        onClick={() => updateQuantity(item.id, item.format, item.quantity - 1)}
                        className="qty-btn"
                      >
                        −
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.format, item.quantity + 1)}
                        className="qty-btn"
                      >
                        +
                      </button>
                    </div>

                    <div className="item-subtotal">
                      {((item.price ?? 0) * item.quantity).toFixed(2)}€
                    </div>

                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id, item.format)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total:</span>
                  <span className="total-price">{getTotalPrice().toFixed(2)}€</span>
                </div>

                <div className="cart-actions">
                  <button 
                    className="btn-checkout"
                    onClick={() => {
                      navigate('/cart');
                      setIsOpen(false);
                    }}
                  >
                    💳 Passer la commande
                  </button>
                  <button 
                    className="btn-continue-shopping"
                    onClick={() => setIsOpen(false)}
                  >
                    Continuer les achats
                  </button>
                  <button 
                    className="btn-clear"
                    onClick={clearCart}
                  >
                    Vider le panier
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div 
          className="cart-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default Cart;
