import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import orderService from '../services/orderService';
import '../styles/OrderConfirmationPage.css';

export default function OrderConfirmationPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) {
          setError('No order ID provided');
          setLoading(false);
          return;
        }

        const data = await orderService.getOrder(parseInt(orderId));
        setOrder(data);
        clearCart();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, clearCart]);

  if (loading) {
    return (
      <div className="confirmation-page loading">
        <div className="spinner">⏳ Chargement de votre commande...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="confirmation-page error">
        <div className="error-box">
          <h2>❌ Erreur</h2>
          <p>{error || 'Commande introuvable'}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        {/* Success Banner */}
        <div className="success-banner">
          <div className="success-icon">✓</div>
          <h1>Commande confirmée!</h1>
          <p>Merci pour votre achat. Votre commande a été enregistrée avec succès.</p>
        </div>

        {/* Order Details */}
        <div className="confirmation-content">
          {/* Left: Order Info */}
          <div className="order-info">
            <div className="info-card">
              <h2>Numéro de commande</h2>
              <p className="order-number">#{order.id}</p>
              <p className="order-date">
                {new Date(order.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Shipping Address */}
            <div className="info-card">
              <h3>Adresse de livraison</h3>
              <div className="address-block">
                {order.shipping_address && (
                  <>
                    <p><strong>{order.guest_nom} {order.guest_prenom}</strong></p>
                    <p>{order.shipping_address.rue}</p>
                    <p>{order.shipping_address.code_postal} {order.shipping_address.ville}</p>
                    <p>{order.shipping_address.pays}</p>
                  </>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="info-card">
              <h3>Contact</h3>
              <p>Email: <strong>{order.guest_email || 'Utilisateur connecté'}</strong></p>
              {order.guest_telephone && (
                <p>Téléphone: <strong>{order.guest_telephone}</strong></p>
              )}
            </div>
          </div>

          {/* Right: Items & Summary */}
          <div className="order-summary">
            <div className="items-section">
              <h3>Articles commandés ({order.items?.length || 0})</h3>
              <div className="items-list">
                {order.items && order.items.map((item, idx) => (
                  <div key={idx} className="item-row">
                    <div className="item-details">
                      <p className="item-title">{item.book_title}</p>
                      <p className="item-format">{item.format}</p>
                    </div>
                    <div className="item-qty">× {item.quantity}</div>
                    <div className="item-price">{(item.price * item.quantity).toFixed(2)} €</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="totals-section">
              <div className="total-row">
                <span>Sous-total:</span>
                <span>{(order.subtotal).toFixed(2)} €</span>
              </div>
              {order.shipping_cost > 0 && (
                <div className="total-row">
                  <span>Frais de livraison:</span>
                  <span>{order.shipping_cost.toFixed(2)} €</span>
                </div>
              )}
              <div className="total-row final">
                <span>Total TTC:</span>
                <span>{order.total.toFixed(2)} €</span>
              </div>
            </div>

            {/* Status Info */}
            <div className="status-info">
              <p className="status-badge">
                Status: <span className={`badge badge-${order.status}`}>{order.status}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="next-steps">
          <h3>Prochaines étapes</h3>
          <div className="steps-list">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Confirmation</h4>
                <p>Un email de confirmation a été envoyé à votre adresse</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Préparation</h4>
                <p>Votre commande sera préparée dans les 24-48 heures</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Expédition</h4>
                <p>Vous recevrez un numéro de suivi par email</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Livraison</h4>
                <p>Réception de votre commande en 3-5 jours ouvrables</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            onClick={() => navigate('/catalog')} 
            className="btn-secondary"
          >
            Continuer les achats
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}
