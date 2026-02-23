import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import orderService from '../services/orderService';
import { API_BASE_URL } from '../config/api';
import GuestCheckoutForm from '../components/GuestCheckoutForm';
import UserCheckoutForm from '../components/UserCheckoutForm';
import '../styles/CheckoutPage.css';

function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user, isConnected } = useUser();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPhysicalBooks, setHasPhysicalBooks] = useState(false);

  // Check if cart has physical books
  useEffect(() => {
    const hasPhysical = cartItems.some(item => 
      item.format === 'papier-neuf' || item.format === 'papier-occasion'
    );
    setHasPhysicalBooks(hasPhysical);
  }, [cartItems]);

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty">
        <div className="empty-state">
          <h2>Votre panier est vide</h2>
          <p>Ajoutez des livres avant de passer commande</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Continuer les achats
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (formData) => {
    setLoading(true);
    setIsSubmitting(true);
    try {
      // Prepare items for order
      const items = cartItems.map(item => ({
        id: item.id,
        title: item.title,
        format: item.format,
        quantity: item.quantity,
        price: item.price ?? 0
      }));

      const orderData = {
        items,
        shipping_address: formData.shippingAddress
      };

      if (isConnected && user) {
        orderData.user_id = user.id;
      } else {
        orderData.guest_info = {
          email: formData.email,
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone
        };
      }

      const result = await orderService.createOrder(
        items,
        isConnected && user ? { id: user.id } : { guestInfo: orderData.guest_info },
        formData.shippingAddress
      );

      addToast(`Commande créée avec succès! Numéro: ${result.id}`, 'success');
      clearCart();
      
      // Create Stripe Checkout Session and redirect
      try {
        const resp = await fetch(`${API_BASE_URL}/api/commandes/${result.id}/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          addToast(err.error || 'Erreur création session de paiement', 'error');
          navigate(`/order-confirmation/${result.id}`);
          return;
        }
        const data = await resp.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } catch (e) {
        addToast('Erreur lors de la redirection au paiement', 'error');
        navigate(`/order-confirmation/${result.id}`);
        return;
      }
    } catch (error) {
      addToast(error.message || 'Erreur lors de la création de la commande', 'error');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
  const shippingCost = hasPhysicalBooks ? 5.99 : 0;
  const total = subtotal + shippingCost;
  const currentStep = isSubmitting ? 3 : 2;


  return (
    <div className="checkout-page">
      <div className="checkout-progress">
        <div className="step active">
          <div className="step-number">1</div>
          <span>Panier</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <span>Coordonnées</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <span>Confirmation</span>
        </div>
      </div>

      <div className="checkout-container">
        {/* Left: Form */}
        <div className="checkout-form">
          <h1>Passer la commande</h1>
          {!isConnected && (
            <div className="guest-checkout-info">
              <h2>Commande invité</h2>
              <p>Vous pouvez commander sans créer de compte. Vos informations servent uniquement au suivi de commande.</p>
            </div>
          )}
          
          {isConnected && user ? (
            <UserCheckoutForm 
              user={user}
              hasPhysicalBooks={hasPhysicalBooks}
              onSubmit={handleSubmit}
              loading={loading}
            />
          ) : (
            <GuestCheckoutForm 
              onSubmit={handleSubmit}
              loading={loading}
            />
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="checkout-summary">
          <h2>Résumé de la commande</h2>
          
          <div className="summary-items">
            {cartItems.map(item => (
              <div key={`${item.id}-${item.format}`} className="summary-item">
                <div className="item-info">
                  <h4>{item.title}</h4>
                  <p className="item-format">{item.format}</p>
                  <p className="item-qty">Quantité: {item.quantity}</p>
                </div>
                <div className="item-price">
                  {((item.price ?? 0) * item.quantity).toFixed(2)} €
                </div>
              </div>
            ))}
          </div>

          <div className="summary-divider"></div>

          <div className="summary-totals">
            <div className="total-row">
              <span>Sous-total:</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            
            {hasPhysicalBooks && (
              <div className="total-row">
                <span>Livraison:</span>
                <span>{shippingCost.toFixed(2)} €</span>
              </div>
            )}

            <div className="total-row total">
              <span>Total:</span>
              <span>{total.toFixed(2)} €</span>
            </div>
          </div>

          {hasPhysicalBooks && (
            <div className="info-box">
              <p>ℹ️ Frais de livraison appliqués pour vos achats de livres physiques</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
