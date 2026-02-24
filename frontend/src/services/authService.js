import { API_BASE_URL } from '../config/api';

const authService = {
  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, mdp: password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data.error || 'Connexion échouée');
      err.requires_verification = data.requires_verification || false;
      err.email = data.email;
      throw err;
    }
    return data;
  },

  async register({ nom, prenom, email, password }) {
    const res = await fetch(`${API_BASE_URL}/api/utilisateurs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, prenom, email, mdp: password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Inscription échouée');
    return data;
  },

  async verifyEmail(email, code) {
    const res = await fetch(`${API_BASE_URL}/api/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Vérification échouée');
    return data;
  },

  async resendVerification(email) {
    const res = await fetch(`${API_BASE_URL}/api/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur lors du renvoi');
    return data;
  },
};

export default authService;
