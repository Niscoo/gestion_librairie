// Configuration de l'API backend
export const API_BASE_URL = 'http://localhost:5000';

export const API_ENDPOINTS = {
  books: `${API_BASE_URL}/api/ouvrages`,
  authors: `${API_BASE_URL}/api/auteurs`,
  orders: `${API_BASE_URL}/api/commandes`,
  users: `${API_BASE_URL}/api/utilisateurs`,
  avis: `${API_BASE_URL}/api/avis`,
  avisStats: `${API_BASE_URL}/api/avis/stats`,
};
