import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config/api';
import '../styles/OrdersPage.css';

const STATUS_LABELS = {
  'payée': { label: 'Payée', color: 'green' },
  'expédiée': { label: 'Expédiée', color: 'blue' },
  'livrée': { label: 'Livrée', color: 'gray' },
  'annulée': { label: 'Annulée', color: 'red' },
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user, isConnected } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isConnected) navigate('/');
  }, [isConnected, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/commandes?user_id=${user.id}`)
      .then(r => r.json())
      .then(data => setOrders(data.data || data || []))
      .catch(() => setError('Impossible de charger vos commandes'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!isConnected) return null;

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>Mes commandes</h1>
        <span className="orders-count">{orders.length} commande{orders.length !== 1 ? 's' : ''}</span>
      </div>

      {loading && <div className="orders-loading">Chargement...</div>}

      {error && <div className="orders-error">{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="orders-empty">
          <div className="orders-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <h2>Aucune commande</h2>
          <p>Vous n'avez pas encore passé de commande.</p>
          <button className="btn-shop" onClick={() => navigate('/catalog')}>
            Découvrir le catalogue
          </button>
        </div>
      )}

      {orders.length > 0 && (
        <div className="orders-list">
          {orders.map(order => {
            const status = STATUS_LABELS[order.status] || { label: order.status, color: 'gray' };
            return (
              <div key={order.numCommande || order.id} className="order-card">
                <div className="order-card-top">
                  <div className="order-meta">
                    <span className="order-num">
                      Commande #{order.numCommande || order.id}
                    </span>
                    <span className="order-date">{formatDate(order.dateCommande || order.created_at)}</span>
                  </div>
                  <span className={`order-status status-${status.color}`}>{status.label}</span>
                </div>

                <div className="order-card-bottom">
                  <span className="order-total">
                    {(order.montantTotal ?? order.total ?? 0).toFixed(2)} €
                  </span>
                  <Link
                    to={`/commandes/${order.numCommande || order.id}`}
                    className="order-detail-link"
                  >
                    Voir le détail →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
