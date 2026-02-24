import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config/api';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, isConnected } = useUser();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '',
    telephone: '',
    adresse_rue: '', adresse_code_postal: '', adresse_ville: '', adresse_pays: 'France',
    newPassword: '', confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isConnected) navigate('/');
  }, [isConnected, navigate]);

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        prenom: user.prenom || '',
        nom: user.nom || '',
        email: user.email || '',
        telephone: user.telephone || '',
        adresse_rue: user.adresse_rue || '',
        adresse_code_postal: user.adresse_code_postal || '',
        adresse_ville: user.adresse_ville || '',
        adresse_pays: user.adresse_pays || 'France',
      }));
    }
  }, [user]);

  const validate = () => {
    const errs = {};
    if (!form.nom.trim()) errs.nom = 'Nom requis';
    if (form.newPassword && form.newPassword.length < 6) errs.newPassword = 'Minimum 6 caractères';
    if (form.newPassword && form.newPassword !== form.confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        telephone: form.telephone.trim(),
        adresse_rue: form.adresse_rue.trim(),
        adresse_code_postal: form.adresse_code_postal.trim(),
        adresse_ville: form.adresse_ville.trim(),
        adresse_pays: form.adresse_pays.trim() || 'France',
      };
      if (form.newPassword) payload.mdp = form.newPassword;

      const res = await fetch(`${API_BASE_URL}/api/utilisateurs/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour');

      setUser({
        ...user,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        adresse_rue: data.adresse_rue,
        adresse_code_postal: data.adresse_code_postal,
        adresse_ville: data.adresse_ville,
        adresse_pays: data.adresse_pays,
      });
      setForm(f => ({ ...f, newPassword: '', confirmPassword: '' }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      addToast('Profil mis à jour', 'success');
    } catch (err) {
      setErrors({ global: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) return null;

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* Avatar */}
        <div className="profile-avatar">
          {(() => {
            const p = (user?.prenom || '').trim();
            const n = (user?.nom || '').trim();
            if (p && n) return `${p[0]}${n[0]}`.toUpperCase();
            if (n) return n.slice(0, 2).toUpperCase();
            return (user?.email || '?')[0].toUpperCase();
          })()}
        </div>

        <h1 className="profile-title">Informations personnelles</h1>
        <p className="profile-subtitle">Gérez votre nom et mot de passe</p>

        {errors.global && <div className="profile-error-banner">{errors.global}</div>}
        {saved && <div className="profile-success-banner">✓ Profil mis à jour avec succès</div>}

        <form onSubmit={handleSubmit} className="profile-form" noValidate>
          <div className="profile-row">
            <div className="profile-field">
              <label htmlFor="pf-prenom">Prénom</label>
              <input
                id="pf-prenom"
                type="text"
                value={form.prenom}
                onChange={e => setForm({ ...form, prenom: e.target.value })}
                placeholder="Jean"
                autoComplete="given-name"
              />
            </div>
            <div className="profile-field">
              <label htmlFor="pf-nom">Nom *</label>
              <input
                id="pf-nom"
                type="text"
                value={form.nom}
                onChange={e => setForm({ ...form, nom: e.target.value })}
                className={errors.nom ? 'error' : ''}
                placeholder="Dupont"
                autoComplete="family-name"
              />
              {errors.nom && <span className="profile-field-error">{errors.nom}</span>}
            </div>
          </div>

          <div className="profile-field">
            <label htmlFor="pf-email">Email <span className="profile-readonly-hint">(non modifiable)</span></label>
            <input id="pf-email" type="email" value={form.email} readOnly className="readonly" autoComplete="email" />
          </div>

          <div className="profile-field">
            <label htmlFor="pf-tel">Téléphone</label>
            <input
              id="pf-tel"
              type="tel"
              value={form.telephone}
              onChange={e => setForm({ ...form, telephone: e.target.value })}
              placeholder="06 12 34 56 78"
              autoComplete="tel"
            />
          </div>

          <div className="profile-section-title">Adresse de livraison</div>

          <div className="profile-field">
            <label htmlFor="pf-rue">Rue / Adresse</label>
            <input
              id="pf-rue"
              type="text"
              value={form.adresse_rue}
              onChange={e => setForm({ ...form, adresse_rue: e.target.value })}
              placeholder="123 Rue de la Paix"
              autoComplete="street-address"
            />
          </div>

          <div className="profile-row">
            <div className="profile-field">
              <label htmlFor="pf-cp">Code postal</label>
              <input
                id="pf-cp"
                type="text"
                value={form.adresse_code_postal}
                onChange={e => setForm({ ...form, adresse_code_postal: e.target.value })}
                placeholder="75000"
                maxLength="10"
                autoComplete="postal-code"
              />
            </div>
            <div className="profile-field">
              <label htmlFor="pf-ville">Ville</label>
              <input
                id="pf-ville"
                type="text"
                value={form.adresse_ville}
                onChange={e => setForm({ ...form, adresse_ville: e.target.value })}
                placeholder="Paris"
                autoComplete="address-level2"
              />
            </div>
          </div>

          <div className="profile-field">
            <label htmlFor="pf-pays">Pays</label>
            <input
              id="pf-pays"
              type="text"
              value={form.adresse_pays}
              onChange={e => setForm({ ...form, adresse_pays: e.target.value })}
              placeholder="France"
              autoComplete="country-name"
            />
          </div>

          <div className="profile-section-title">Changer le mot de passe <span>(optionnel)</span></div>

          <div className="profile-row">
            <div className="profile-field">
              <label htmlFor="pf-pwd">Nouveau mot de passe</label>
              <input
                id="pf-pwd"
                type="password"
                value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })}
                className={errors.newPassword ? 'error' : ''}
                placeholder="••••••"
                autoComplete="new-password"
              />
              {errors.newPassword && <span className="profile-field-error">{errors.newPassword}</span>}
            </div>
            <div className="profile-field">
              <label htmlFor="pf-confirm">Confirmer</label>
              <input
                id="pf-confirm"
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="••••••"
                autoComplete="new-password"
              />
              {errors.confirmPassword && <span className="profile-field-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="profile-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate(-1)} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
