import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import '../styles/OrderDetailPage.css';

const STATUS_LABELS = {
  'payée':    { label: 'Payée',    color: 'green' },
  'expédiée': { label: 'Expédiée', color: 'blue'  },
  'livrée':   { label: 'Livrée',   color: 'gray'  },
  'annulée':  { label: 'Annulée',  color: 'red'   },
};

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/commandes/${id}`)
      .then(r => { if (!r.ok) throw new Error('Commande introuvable'); return r.json(); })
      .then(data => setOrder(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) return <div className="od-loading">Chargement de la commande…</div>;

  if (error || !order) {
    return (
      <div className="od-error">
        <p>{error || 'Commande introuvable'}</p>
        <button className="od-btn-back" onClick={() => navigate('/commandes')}>
          ← Retour aux commandes
        </button>
      </div>
    );
  }

  const status = STATUS_LABELS[order.status] || { label: order.status, color: 'gray' };
  const contactName = order.guest_prenom || order.guest_nom
    ? `${order.guest_prenom || ''} ${order.guest_nom || ''}`.trim()
    : null;

  return (
    <div className="od-page">
      {/* Header */}
      <div className="od-header">
        <button className="od-btn-back" onClick={() => navigate('/commandes')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Mes commandes
        </button>
        <div className="od-title-row">
          <h1>Commande <span>#{order.numCommande || order.id}</span></h1>
          <span className={`od-status status-${status.color}`}>{status.label}</span>
        </div>
        <p className="od-date">Passée le {formatDate(order.dateCommande || order.created_at)}</p>
      </div>

      <div className="od-body">
        {/* Articles */}
        <section className="od-card od-items">
          <h2>Articles commandés</h2>
          <div className="od-items-list">
            {(order.items || []).map((item, i) => (
              <div key={i} className="od-item-row">
                <div className="od-item-info">
                  <p className="od-item-title">{item.book_title}</p>
                  {item.format && <p className="od-item-format">{item.format}</p>}
                  {item.isbn && <p className="od-item-isbn">ISBN : {item.isbn}</p>}
                </div>
                <div className="od-item-right">
                  <span className="od-item-qty">× {item.quantity}</span>
                  <span className="od-item-price">{(item.price * item.quantity).toFixed(2)} €</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totaux */}
          <div className="od-totals">
            <div className="od-total-row">
              <span>Sous-total</span>
              <span>{(order.subtotal ?? order.montantTotal ?? 0).toFixed(2)} €</span>
            </div>
            {(order.shipping_cost || 0) > 0 && (
              <div className="od-total-row">
                <span>Frais de livraison</span>
                <span>{(order.shipping_cost).toFixed(2)} €</span>
              </div>
            )}
            <div className="od-total-row od-total-final">
              <span>Total TTC</span>
              <span>{(order.total ?? order.montantTotal ?? 0).toFixed(2)} €</span>
            </div>
          </div>
        </section>

        <div className="od-sidebar">
          {/* Adresse de livraison */}
          {order.shipping_address && (
            <section className="od-card">
              <h3>Adresse de livraison</h3>
              {contactName && <p className="od-addr-name">{contactName}</p>}
              <p>{order.shipping_address.rue}</p>
              <p>{order.shipping_address.code_postal} {order.shipping_address.ville}</p>
              <p>{order.shipping_address.pays}</p>
            </section>
          )}

          {/* Coordonnées */}
          {(order.guest_email || order.guest_telephone) && (
            <section className="od-card">
              <h3>Contact</h3>
              {order.guest_email && <p>{order.guest_email}</p>}
              {order.guest_telephone && <p>{order.guest_telephone}</p>}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
