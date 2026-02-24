import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config/api';
import '../styles/CheckoutForm.css';

export default function UserCheckoutForm({ user, hasPhysicalBooks, onSubmit, loading }) {
  const { setUser } = useUser();

  const [formData, setFormData] = useState({
    rue: user.adresse_rue || '',
    ville: user.adresse_ville || '',
    code_postal: user.adresse_code_postal || '',
    pays: user.adresse_pays || 'France'
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [errors, setErrors] = useState({});

  // Detect if form differs from saved profile address
  const hasChanges = formData.rue !== (user.adresse_rue || '') ||
    formData.ville !== (user.adresse_ville || '') ||
    formData.code_postal !== (user.adresse_code_postal || '');

  const validateZipCode = (zip) => /^\d{5}$/.test(zip);

  const validate = () => {
    const newErrors = {};
    if (hasPhysicalBooks) {
      if (!formData.rue.trim()) newErrors.rue = 'Rue/adresse requise';
      if (!formData.ville.trim()) newErrors.ville = 'Ville requise';
      if (!formData.code_postal.trim()) newErrors.code_postal = 'Code postal requis';
      else if (!validateZipCode(formData.code_postal)) newErrors.code_postal = 'Code postal invalide (5 chiffres)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Optionally persist address to user profile
    if (saveAddress && user.id && hasChanges) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/utilisateurs/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adresse_rue: formData.rue,
            adresse_code_postal: formData.code_postal,
            adresse_ville: formData.ville,
            adresse_pays: formData.pays,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setUser({ ...user, ...updated });
        }
      } catch {
        // silently ignore — order still goes through
      }
    }

    onSubmit({
      shippingAddress: {
        rue: formData.rue,
        ville: formData.ville,
        code_postal: formData.code_postal,
        pays: formData.pays
      }
    });
  };

  return (
    <form className="checkout-form-user" onSubmit={handleSubmit}>
      <fieldset disabled={loading}>
        {/* User info — read only */}
        <div className="form-section">
          <h3>Vos informations</h3>
          <div className="form-group read-only">
            <label>Email</label>
            <div className="form-value">{user.email}</div>
          </div>
          <div className="form-row">
            <div className="form-group read-only">
              <label>Prénom</label>
              <div className="form-value">{user.prenom || '—'}</div>
            </div>
            <div className="form-group read-only">
              <label>Nom</label>
              <div className="form-value">{user.nom || '—'}</div>
            </div>
          </div>
          {user.telephone && (
            <div className="form-group read-only">
              <label>Téléphone</label>
              <div className="form-value">{user.telephone}</div>
            </div>
          )}
        </div>

        {/* Shipping address */}
        {hasPhysicalBooks && (
          <div className="form-section">
            <h3>Adresse de livraison</h3>

            <div className="form-group">
              <label htmlFor="rue">Rue / Adresse *</label>
              <input
                type="text"
                id="rue"
                name="rue"
                value={formData.rue}
                onChange={handleChange}
                className={errors.rue ? 'error' : ''}
                placeholder="123 Rue de la Paix"
                autoComplete="street-address"
              />
              {errors.rue && <span className="error-text">{errors.rue}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="code_postal">Code postal *</label>
                <input
                  type="text"
                  id="code_postal"
                  name="code_postal"
                  value={formData.code_postal}
                  onChange={handleChange}
                  className={errors.code_postal ? 'error' : ''}
                  placeholder="75000"
                  maxLength="5"
                  autoComplete="postal-code"
                />
                {errors.code_postal && <span className="error-text">{errors.code_postal}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="ville">Ville *</label>
                <input
                  type="text"
                  id="ville"
                  name="ville"
                  value={formData.ville}
                  onChange={handleChange}
                  className={errors.ville ? 'error' : ''}
                  placeholder="Paris"
                  autoComplete="address-level2"
                />
                {errors.ville && <span className="error-text">{errors.ville}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pays">Pays</label>
              <input
                type="text"
                id="pays"
                name="pays"
                value={formData.pays}
                onChange={handleChange}
                placeholder="France"
                autoComplete="country-name"
              />
            </div>

            {/* Save address option */}
            {hasChanges && (
              <label className="save-address-label">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={e => setSaveAddress(e.target.checked)}
                />
                <span>Enregistrer cette adresse dans mon profil</span>
              </label>
            )}
          </div>
        )}

        {!hasPhysicalBooks && (
          <div className="info-box">
            <p>✓ Votre commande ne contient que des e-books. Pas d'adresse requise.</p>
          </div>
        )}

        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Création de la commande...' : 'Passer la commande'}
        </button>
      </fieldset>
    </form>
  );
}
