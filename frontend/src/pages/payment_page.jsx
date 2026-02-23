import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { API_BASE_URL } from '../config/api';
import { useToast } from '../context/ToastContext';

function PaymentForm({ orderId }) {
  const stripe = useStripe();
  const elements = useElements();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation/${orderId}`
        },
        redirect: 'if_required'
      });

      if (result.error) {
        addToast(result.error.message || 'Erreur lors du paiement', 'error');
        return;
      }

      const pi = result.paymentIntent;
      if (pi && pi.status === 'succeeded') {
        addToast('Paiement effectué', 'success');
        try {
          await fetch(`${API_BASE_URL}/api/commandes/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_status: 'payée' })
          });
        } catch (e) {
          // ignore
        }
        navigate(`/order-confirmation/${orderId}`);
      } else {
        // In case of redirect we may not get here; still navigate to confirmation
        navigate(`/order-confirmation/${orderId}`);
      }
    } catch (err) {
      addToast(err.message || 'Erreur lors du paiement', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement />
      <div style={{ marginTop: 12 }}>
        <button className="btn-primary" type="submit" disabled={!stripe}>Payer</button>
      </div>
    </form>
  );
}

export default function PaymentPage() {
  const { orderId } = useParams();
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const cfgRes = await fetch(`${API_BASE_URL}/api/config/stripe`);
        const cfg = await cfgRes.json();
        const publishableKey = cfg.publishableKey;
        if (!publishableKey) {
          addToast('Clé publique Stripe non configurée', 'error');
          setLoading(false);
          return;
        }
        setStripePromise(loadStripe(publishableKey));

        const resp = await fetch(`${API_BASE_URL}/api/commandes/${orderId}/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          addToast(err.error || 'Impossible de créer le PaymentIntent', 'error');
          setLoading(false);
          return;
        }
        const data = await resp.json();
        setClientSecret(data.client_secret || data.client_secret || data.client_secret);
        // Some endpoints return client_secret or clientSecret; normalize
        setClientSecret(data.client_secret || data.clientSecret || data.clientSecret);
        setLoading(false);
      } catch (e) {
        addToast('Erreur initialisation paiement', 'error');
        setLoading(false);
      }
    };
    init();
  }, [orderId]);

  if (loading) return <div className="checkout-loading">Chargement du paiement…</div>;
  if (!clientSecret) return <div className="checkout-error">Impossible d\'initialiser le paiement.</div>;

  const options = { clientSecret };

  return (
    <div className="payment-page">
      <h1>Paiement commande #{orderId}</h1>
      <Elements stripe={stripePromise} options={options}>
        <PaymentForm orderId={orderId} />
      </Elements>
    </div>
  );
}