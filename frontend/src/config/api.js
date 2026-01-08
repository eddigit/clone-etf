// Configuration de l'API
// En production, utiliser une URL relative pour le même domaine, sinon localhost
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8001' : '');

export const API_URL = `${API_BASE_URL}/api`;

// Helper pour les headers avec token
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper pour les headers avec fichiers
export const getAuthHeadersMultipart = () => {
  const token = localStorage.getItem('token');
  return {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export default API_URL;
