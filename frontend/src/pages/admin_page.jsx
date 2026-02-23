import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import '../styles/AdminPage.css';

const API = 'http://localhost:5000';

/* ===== SVG Icons ===== */
const Icons = {
  book: (
    <svg viewBox="0 0 24 24"><path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5zM6 4h5v6h7v10H6V4z"/></svg>
  ),
  users: (
    <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05C16.19 13.89 17 15.02 17 16.5V19h6v-2.5C23 14.17 18.33 13 16 13z"/></svg>
  ),
  cart: (
    <svg viewBox="0 0 24 24"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.17 14.75l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25z"/></svg>
  ),
  star: (
    <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
  ),
  euro: (
    <svg viewBox="0 0 24 24"><path d="M15 18.5A6.48 6.48 0 0 1 9.24 15H15v-2H8.58c-.05-.33-.08-.66-.08-1s.03-.67.08-1H15V9H9.24A6.49 6.49 0 0 1 15 5.5c1.61 0 3.09.59 4.23 1.57L21 5.3A8.96 8.96 0 0 0 15 3c-3.92 0-7.24 2.51-8.48 6H3v2h3.06a8.3 8.3 0 0 0 0 2H3v2h3.52c1.24 3.49 4.56 6 8.48 6 2.31 0 4.41-.87 6-2.3l-1.78-1.77c-1.13.98-2.6 1.57-4.22 1.57z"/></svg>
  ),
};

const STATUS_LABELS_ADMIN = {
  'panier': { label: 'Panier', color: 'pending' },
  'commande validée': { label: 'Commande validée', color: 'pending' },
  'paiement en attente': { label: 'Paiement en attente', color: 'pending' },
  'payée': { label: 'Payée', color: 'completed' },
  'en préparation': { label: 'En préparation', color: 'pending' },
  'expédiée': { label: 'Expédiée', color: 'completed' },
  'livrée': { label: 'Livrée', color: 'completed' },
  'annulée': { label: 'Annulée', color: 'cancelled' },
  "accès ebook activé": { label: 'Accès ebook activé', color: 'completed' },
  'retour accepté': { label: 'Retour accepté', color: 'pending' },
  'remboursement': { label: 'Remboursement', color: 'cancelled' },
};

function getAdminStatusLabel(status) {
  if (!status) return '—';
  const key = String(status).toLowerCase();
  return (STATUS_LABELS_ADMIN[key] && STATUS_LABELS_ADMIN[key].label) || status;
}

function getAdminStatusClass(status) {
  if (!status) return 'pending';
  const key = String(status).toLowerCase();
  return (STATUS_LABELS_ADMIN[key] && STATUS_LABELS_ADMIN[key].color) || 'pending';
}

function AdminPage() {
  const { user } = useUser();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    if (!user || user.role !== 'admin') navigate('/');
  }, [user, navigate]);

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    'X-User-Id': String(user?.id ?? ''),
  }), [user?.id]);

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="adm-container">
      <h1 className="adm-title">Administration</h1>
      <div className="adm-tabs">
        {['dashboard', 'livres', 'utilisateurs', 'commandes', 'avis'].map((t) => (
          <button
            key={t}
            className={`adm-tab${tab === t ? ' adm-tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'dashboard' ? 'Tableau de bord' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'dashboard' && <DashboardTab headers={headers} />}
      {tab === 'livres' && <LivresTab headers={headers} addToast={addToast} />}
      {tab === 'utilisateurs' && <UtilisateursTab headers={headers} addToast={addToast} currentUserId={user.id} />}
      {tab === 'commandes' && <CommandesTab headers={headers} />}
      {tab === 'avis' && <AvisTab headers={headers} addToast={addToast} />}
    </div>
  );
}

/* ================================================================
   TAB: Dashboard
   ================================================================ */
function DashboardTab({ headers }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/admin/stats`, { headers })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [headers]);

  if (loading) return <div className="adm-loading">Chargement…</div>;
  if (!stats) return <div className="adm-empty">Impossible de charger les statistiques.</div>;

  const cards = [
    { label: 'Livres', value: stats.total_livres ?? 0, icon: Icons.book },
    { label: 'Utilisateurs', value: stats.total_users ?? 0, icon: Icons.users },
    { label: 'Commandes', value: stats.total_commandes ?? 0, icon: Icons.cart },
    { label: 'Avis', value: stats.total_avis ?? 0, icon: Icons.star },
    { label: 'Revenus', value: `${(stats.revenus ?? 0).toFixed(2)} €`, icon: Icons.euro },
  ];

  return (
    <>
      <div className="adm-stats">
        {cards.map((c) => (
          <div key={c.label} className="adm-stat-card">
            <div className="adm-stat-icon">{c.icon}</div>
            <div className="adm-stat-info">
              <h3>{c.value}</h3>
              <p>{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="adm-section-title">Commandes récentes</h2>
      {stats.commandes_recentes?.length ? (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>ID</th><th>Date</th><th>Montant</th><th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {stats.commandes_recentes.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td>{new Date(c.created_at ?? c.date).toLocaleDateString('fr-FR')}</td>
                  <td>{Number(c.montant ?? c.total ?? 0).toFixed(2)} €</td>
                  <td><span className={`adm-badge adm-badge--${getAdminStatusClass(c.statut || c.status)}`}>{getAdminStatusLabel(c.statut || c.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="adm-empty">Aucune commande récente.</p>
      )}
    </>
  );
}

/* ================================================================
   TAB: Livres
   ================================================================ */
function LivresTab({ headers, addToast }) {
  const [livres, setLivres] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', data }

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/ouvrages`, { headers })
      .then((r) => r.json())
      .then((d) => setLivres(d.data ?? d))
      .catch(() => addToast('Erreur chargement livres', 'error'))
      .finally(() => setLoading(false));
  }, [headers, addToast]);

  useEffect(load, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return livres.filter(
      (l) =>
        l.titre?.toLowerCase().includes(q) ||
        l.auteur?.toLowerCase().includes(q) ||
        l.isbn?.toLowerCase().includes(q)
    );
  }, [livres, search]);

  const handleDelete = async (isbn) => {
    if (!confirm('Supprimer ce livre ?')) return;
    try {
      const res = await fetch(`${API}/api/ouvrages/${isbn}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      addToast('Livre supprimé', 'success');
      load();
    } catch {
      addToast('Erreur suppression', 'error');
    }
  };

  const handleSave = async (data) => {
    const isEdit = modal?.mode === 'edit';
    const url = isEdit ? `${API}/api/ouvrages/${modal.data.isbn}` : `${API}/api/ouvrages`;
    const method = isEdit ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(data) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur');
      }
      addToast(isEdit ? 'Livre modifié' : 'Livre ajouté', 'success');
      setModal(null);
      load();
    } catch (e) {
      addToast(e.message || 'Erreur sauvegarde', 'error');
    }
  };

  return (
    <>
      <div className="adm-toolbar">
        <input
          className="adm-search"
          placeholder="Rechercher un livre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="adm-btn adm-btn--primary" onClick={() => setModal({ mode: 'add', data: {} })}>
          + Ajouter
        </button>
      </div>

      {loading ? (
        <div className="adm-loading">Chargement…</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>ISBN</th><th>Titre</th><th>Auteur</th><th>Prix</th><th>Stock</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Aucun livre trouvé.</td></tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.isbn}>
                    <td>{l.isbn}</td>
                    <td>{l.titre}</td>
                    <td>{l.auteur}</td>
                    <td>{Number(l.prix).toFixed(2)} €</td>
                    <td>{l.stock}</td>
                    <td className="adm-actions">
                      <button
                        className="adm-btn adm-btn--ghost adm-btn--small"
                        onClick={() => setModal({ mode: 'edit', data: l })}
                      >
                        Modifier
                      </button>
                      <button
                        className="adm-btn adm-btn--danger adm-btn--small"
                        onClick={() => handleDelete(l.isbn)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <BookModal
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}

function BookModal({ mode, initial, onClose, onSave }) {
  const [form, setForm] = useState({
    isbn: initial.isbn || '',
    titre: initial.titre || '',
    auteur: initial.auteur || '',
    prix: initial.prix ?? '',
    stock: initial.stock ?? '',
    resume: initial.resume || '',
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, prix: Number(form.prix), stock: Number(form.stock) });
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h2>{mode === 'edit' ? 'Modifier le livre' : 'Ajouter un livre'}</h2>
          <button className="adm-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="adm-modal-body">
            <div className="adm-form-group">
              <label>ISBN</label>
              <input value={form.isbn} onChange={set('isbn')} required disabled={mode === 'edit'} />
            </div>
            <div className="adm-form-group">
              <label>Titre</label>
              <input value={form.titre} onChange={set('titre')} required />
            </div>
            <div className="adm-form-group">
              <label>Auteur</label>
              <input value={form.auteur} onChange={set('auteur')} required />
            </div>
            <div className="adm-form-group">
              <label>Prix (€)</label>
              <input type="number" step="0.01" min="0" value={form.prix} onChange={set('prix')} required />
            </div>
            <div className="adm-form-group">
              <label>Stock</label>
              <input type="number" min="0" value={form.stock} onChange={set('stock')} required />
            </div>
            <div className="adm-form-group">
              <label>Résumé</label>
              <textarea value={form.resume} onChange={set('resume')} />
            </div>
          </div>
          <div className="adm-modal-footer">
            <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="adm-btn adm-btn--primary">
              {mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================================================================
   TAB: Utilisateurs
   ================================================================ */
function UtilisateursTab({ headers, addToast, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/admin/utilisateurs`, { headers })
      .then((r) => r.json())
      .then((d) => setUsers(d.data ?? d))
      .catch(() => addToast('Erreur chargement utilisateurs', 'error'))
      .finally(() => setLoading(false));
  }, [headers, addToast]);

  useEffect(load, [load]);

  const toggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    if (u.id === currentUserId && newRole === 'user') {
      addToast('Vous ne pouvez pas retirer votre propre rôle admin', 'error');
      return;
    }
    try {
      const res = await fetch(`${API}/api/admin/utilisateurs/${u.id}/role`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error();
      addToast(`Rôle changé en ${newRole}`, 'success');
      load();
    } catch {
      addToast('Erreur changement de rôle', 'error');
    }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Supprimer l'utilisateur ${u.prenom} ${u.nom} ?`)) return;
    try {
      const res = await fetch(`${API}/api/admin/utilisateurs/${u.id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      addToast('Utilisateur supprimé', 'success');
      load();
    } catch {
      addToast('Erreur suppression', 'error');
    }
  };

  if (loading) return <div className="adm-loading">Chargement…</div>;

  return (
    <div className="adm-table-wrap">
      <table className="adm-table">
        <thead>
          <tr>
            <th>Nom</th><th>Email</th><th>Rôle</th><th>Email vérifié</th><th>Commandes</th><th>Inscrit le</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr><td colSpan="7" style={{ textAlign: 'center' }}>Aucun utilisateur.</td></tr>
          ) : (
            users.map((u) => (
              <tr key={u.id}>
                <td>{u.prenom} {u.nom}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`adm-badge adm-badge--${u.role}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className={`adm-badge adm-badge--${u.email_verified ? 'verified' : 'unverified'}`}>
                    {u.email_verified ? 'Vérifié' : 'Non vérifié'}
                  </span>
                </td>
                <td>{u.nb_commandes ?? 0}</td>
                <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                <td className="adm-actions">
                  <button
                    className="adm-btn adm-btn--ghost adm-btn--small"
                    onClick={() => toggleRole(u)}
                    title={u.role === 'admin' ? 'Rétrograder' : 'Promouvoir'}
                  >
                    {u.role === 'admin' ? '↓ User' : '↑ Admin'}
                  </button>
                  {u.id !== currentUserId && (
                    <button
                      className="adm-btn adm-btn--danger adm-btn--small"
                      onClick={() => handleDelete(u)}
                    >
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ================================================================
   TAB: Commandes
   ================================================================ */
function CommandesTab({ headers }) {
  const [commandes, setCommandes] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/commandes?page=${page}&per_page=20`, { headers })
      .then((r) => r.json())
      .then((d) => {
        setCommandes(d.data ?? []);
        setTotalPages(d.pages ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, headers]);

  if (loading) return <div className="adm-loading">Chargement…</div>;

  return (
    <>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>ID</th><th>Date</th><th>Client</th><th>Montant</th><th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {commandes.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>Aucune commande.</td></tr>
            ) : (
              commandes.map((c) => (
                <tr key={c.id}>
                  <td>#{c.id}</td>
                  <td>{new Date(c.created_at ?? c.date).toLocaleDateString('fr-FR')}</td>
                  <td>{c.client ?? c.user?.nom ?? `Utilisateur #${c.user_id ?? '—'}`}</td>
                  <td>{Number(c.montant ?? c.total ?? 0).toFixed(2)} €</td>
                  <td><span className={`adm-badge adm-badge--${getAdminStatusClass(c.statut || c.status)}`}>{getAdminStatusLabel(c.statut || c.status)}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="adm-pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Précédent</button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Suivant →</button>
        </div>
      )}
    </>
  );
}

/* ================================================================
   TAB: Avis
   ================================================================ */
function AvisTab({ headers, addToast }) {
  const [livres, setLivres] = useState([]);
  const [selected, setSelected] = useState('');
  const [avis, setAvis] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/ouvrages`, { headers })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data ?? d;
        setLivres(list);
        if (list.length > 0) setSelected(list[0].isbn);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [headers]);

  const loadAvis = useCallback(() => {
    if (!selected) return;
    fetch(`${API}/api/avis/${selected}`, { headers })
      .then((r) => r.json())
      .then((d) => setAvis(d.data ?? []))
      .catch(() => setAvis([]));
  }, [selected, headers]);

  useEffect(loadAvis, [loadAvis]);

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet avis ?')) return;
    try {
      const res = await fetch(`${API}/api/admin/avis/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error();
      addToast('Avis supprimé', 'success');
      loadAvis();
    } catch {
      addToast('Erreur suppression avis', 'error');
    }
  };

  const renderStars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return avis;
    return avis.filter(
      (a) =>
        a.commentaire?.toLowerCase().includes(q) ||
        a.user?.nom?.toLowerCase().includes(q) ||
        a.user?.prenom?.toLowerCase().includes(q)
    );
  }, [avis, search]);

  const currentBook = livres.find((l) => l.isbn === selected);

  if (loading) return <div className="adm-loading">Chargement…</div>;

  return (
    <>
      <div className="adm-toolbar">
        <select
          className="adm-search"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {livres.map((l) => (
            <option key={l.isbn} value={l.isbn}>
              {l.titre} — {l.auteur}
            </option>
          ))}
        </select>
        <input
          className="adm-search"
          placeholder="Filtrer les avis…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 250 }}
        />
      </div>

      {currentBook && (
        <p className="adm-section-title">
          Avis pour « {currentBook.titre} » ({filtered.length})
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="adm-empty">Aucun avis pour ce livre.</p>
      ) : (
        filtered.map((a) => (
          <div key={a.id} className="adm-review-card">
            <div className="adm-review-header">
              <div>
                <span className="adm-review-meta">
                  <strong>{a.user?.prenom ?? ''} {a.user?.nom ?? 'Anonyme'}</strong>
                  {' · '}
                  {a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : ''}
                </span>
                <div className="adm-review-stars">{renderStars(a.note)}</div>
              </div>
              <button
                className="adm-btn adm-btn--danger adm-btn--small"
                onClick={() => handleDelete(a.id)}
              >
                Supprimer
              </button>
            </div>
            <p className="adm-review-text">{a.commentaire}</p>
          </div>
        ))
      )}
    </>
  );
}

export default AdminPage;
