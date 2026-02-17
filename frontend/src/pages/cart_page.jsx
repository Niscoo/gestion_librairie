import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/CartPage.css';

function CartPage() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart();

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Votre panier est vide!');
      return;
    }
    alert('Passer à la caisse (À implémenter)');
  };

  const shippingCost = cartItems.length > 0 ? 5.99 : 0;
  const totalTTC = getTotalPrice() + shippingCost;

  return (
    <div className="cart-page">
      <div className="cart-page-header">
        <button 
          className="back-btn"
          onClick={() => navigate('/catalog')}
        >
          ← Retour au catalogue
        </button>
        <h1>🛒 Panier d'achat</h1>
      </div>

      <div className="cart-page-container">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-icon">📭</div>
            <h2>Votre panier est vide</h2>
            <p>Commencez à ajouter des livres pour remplir votre panier!</p>
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/catalog')}
            >
              Continuer les achats
            </button>
          </div>
        ) : (
          <>
            {/* Colonne produits */}
            <div className="cart-items-section">
              <div className="section-header">
                <h2>Articles ({cartItems.length})</h2>
              </div>

              <div className="cart-items-list">
                {cartItems.map(item => (
                  <div key={item.id} className="cart-item-detailed">
                    <div className="item-image">
                      <img src={item.cover} alt={item.title} />
                    </div>

                    <div className="item-content">
                      <div className="item-header">
                        <div>
                          <h3>{item.title}</h3>
                          <p className="item-author">{item.author}</p>
                          <p className="item-category">{item.category}</p>
                        </div>
                        <p className="item-format">{item.format.toUpperCase()}</p>
                      </div>

                      <div className="item-details">
                        <span className="price">{item.price.toFixed(2)}€</span>
                        <span className="rating">⭐ {item.rating}</span>
                      </div>
                    </div>

                    <div className="item-actions">
                      <div className="quantity-control">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="qty-btn"
                        >
                          −
                        </button>
                        <span className="qty-display">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="qty-btn"
                        >
                          +
                        </button>
                      </div>

                      <div className="subtotal">
                        <p className="label">Sous-total</p>
                        <p className="amount">{(item.price * item.quantity).toFixed(2)}€</p>
                      </div>

                      <button 
                        className="remove-item-btn"
                        onClick={() => removeFromCart(item.id)}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="btn btn-outline"
                onClick={() => navigate('/catalog')}
              >
                ← Continuer les achats
              </button>
            </div>

            {/* Colonne résumé */}
            <div className="cart-summary-section">
              <div className="summary-card">
                <h2>Résumé de la commande</h2>

                <div className="summary-row">
                  <span>Sous-total ({cartItems.length} article{cartItems.length > 1 ? 's' : ''})</span>
                  <span>{getTotalPrice().toFixed(2)}€</span>
                </div>

                <div className="summary-row">
                  <span>Frais de port</span>
                  <span>{shippingCost.toFixed(2)}€</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row total">
                  <span>Total TTC</span>
                  <span>{totalTTC.toFixed(2)}€</span>
                </div>

                <button 
                  className="btn btn-primary btn-lg btn-block"
                  onClick={handleCheckout}
                >
                  💳 Passer la commande
                </button>

                <button 
                  className="btn btn-outline btn-block"
                  onClick={clearCart}
                >
                  Vider le panier
                </button>
              </div>

              {/* Promo Card */}
              <div className="promo-card">
                <h3>🎁 Code promo</h3>
                <div className="promo-input-group">
                  <input 
                    type="text"
                    placeholder="Entrez votre code..."
                    className="promo-input"
                  />
                  <button className="btn-apply">Appliquer</button>
                </div>
              </div>

              {/* Info Card */}
              <div className="info-card">
                <h3>ℹ️ Infos pratiques</h3>
                <ul>
                  <li>✓ Livraison gratuite dès 50€</li>
                  <li>✓ Retour sous 14 jours</li>
                  <li>✓ Satisfait ou remboursé</li>
                  <li>✓ Service client 24/7</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Section recommandations */}
      {cartItems.length > 0 && (
        <div className="recommendations-section">
          <h2>📚 Vous aimerez aussi</h2>
          <div className="recommendations-placeholder">
            <p>Recommandations personnalisées basées sur votre panier</p>
            <p className="text-small">(À intégrer avec l'API)</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
