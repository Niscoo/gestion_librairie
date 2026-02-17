import { useState } from 'react';
import { useCart } from '../context/CartContext';
import '../styles/Cart.css';

function Cart() {
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
                  <div key={item.id} className="cart-item">
                    <img src={item.cover} alt={item.title} className="item-cover" />
                    
                    <div className="item-details">
                      <h3>{item.title}</h3>
                      <p className="author">{item.author}</p>
                      <p className="price">{item.price.toFixed(2)}€</p>
                    </div>

                    <div className="item-quantity">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="qty-btn"
                      >
                        −
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="qty-btn"
                      >
                        +
                      </button>
                    </div>

                    <div className="item-subtotal">
                      {(item.price * item.quantity).toFixed(2)}€
                    </div>

                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
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
                      alert('Passer la commande (À implémenter)');
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
