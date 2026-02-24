import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/Cart.css';

function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div className="cart-wrapper">
      {/* Bouton flottant panier en bas à droite */}
      <button 
        className="cart-fab"
        onClick={() => setIsOpen(!isOpen)}
        title="Panier"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="cart-panel"
        aria-label="Ouvrir le panier"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        {cartItems.length > 0 && (
          <span className="cart-fab-badge">{cartItems.length}</span>
        )}
      </button>

      {/* Panel panier */}
      {isOpen && (
        <div id="cart-panel" className="cart-panel" role="dialog" aria-modal="true" aria-label="Panier">
          <div className="cart-header">
            <h2>🛒 Panier</h2>
            <button 
              className="close-btn"
              ref={closeButtonRef}
              onClick={() => setIsOpen(false)}
              aria-label="Fermer le panier"
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
                          aria-label={`Réduire la quantité de ${item.title}`}
                        >
                          −
                        </button>
                      <span className="qty-value">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.format, item.quantity + 1)}
                          className="qty-btn"
                          aria-label={`Augmenter la quantité de ${item.title}`}
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
                        aria-label={`Supprimer ${item.title} du panier`}
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
        <button
          className="cart-overlay"
          aria-label="Fermer le panier"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default Cart;
