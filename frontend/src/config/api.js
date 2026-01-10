import axios from 'axios';

// Configuration de l'API
// En production, utiliser l'URL du backend Render
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8001' : 'https://etf-backend-t3j5.onrender.com');

export const API_URL = `${API_BASE_URL}/api`;

// Instance Axios configurée
const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token automatiquement
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export default API;
