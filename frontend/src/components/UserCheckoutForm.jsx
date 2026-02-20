import React, { useState } from 'react';
import '../styles/CheckoutForm.css';

export default function UserCheckoutForm({ user, hasPhysicalBooks, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    rue: '',
    ville: '',
    code_postal: '',
    pays: 'France'
  });

  const [errors, setErrors] = useState({});

  const validateZipCode = (zip) => {
    return /^\d{5}$/.test(zip);
  };

  const validate = () => {
    const newErrors = {};

    // Only validate shipping address if there are physical books
    if (hasPhysicalBooks) {
      if (!formData.rue.trim()) {
        newErrors.rue = 'Rue/adresse requise';
      }

      if (!formData.ville.trim()) {
        newErrors.ville = 'Ville requise';
      }

      if (!formData.code_postal.trim()) {
        newErrors.code_postal = 'Code postal requis';
      } else if (!validateZipCode(formData.code_postal)) {
        newErrors.code_postal = 'Code postal invalide (5 chiffres requis)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
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
        {/* User Information - Read Only */}
        <div className="form-section">
          <h3>Vos informations</h3>
          
          <div className="form-group read-only">
            <label>Email</label>
            <div className="form-value">{user.email}</div>
          </div>

          <div className="form-row">
            <div className="form-group read-only">
              <label>Prénom</label>
              <div className="form-value">{user.prenom}</div>
            </div>

            <div className="form-group read-only">
              <label>Nom</label>
              <div className="form-value">{user.nom}</div>
            </div>
          </div>

          {user.telephone && (
            <div className="form-group read-only">
              <label>Téléphone</label>
              <div className="form-value">{user.telephone}</div>
            </div>
          )}
        </div>

        {/* Shipping Address - Only if physical books */}
        {hasPhysicalBooks && (
          <div className="form-section">
            <h3>Adresse de livraison</h3>

            <div className="form-group">
              <label htmlFor="rue">Rue/Adresse *</label>
              <input
                type="text"
                id="rue"
                name="rue"
                value={formData.rue}
                onChange={handleChange}
                className={errors.rue ? 'error' : ''}
                placeholder="123 Rue de la Paix"
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
              />
            </div>
          </div>
        )}

        {!hasPhysicalBooks && (
          <div className="info-box">
            <p>✓ Votre commande ne contient que des e-books. Pas d'adresse de livraison requise.</p>
          </div>
        )}

        {/* Submit */}
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Création de la commande...' : 'Passer la commande'}
        </button>
      </fieldset>
    </form>
  );
}
