import { API_URL } from '../config/api';

// Génère un ID visiteur unique ou récupère l'existant
const getVisitorId = () => {
  let visitorId = localStorage.getItem('etf_visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('etf_visitor_id', visitorId);
  }
  return visitorId;
};

// Extrait le référent
const getReferrer = () => {
  const ref = document.referrer;
  if (!ref) return null;
  
  // Ne pas compter les navigations internes comme référent
  try {
    const refUrl = new URL(ref);
    if (refUrl.hostname === window.location.hostname) {
      return null;
    }
  } catch (e) {
    return null;
  }
  
  return ref;
};

// Suit une visite de page
export const trackPageView = async (pathname) => {
  try {
    const visitorId = getVisitorId();
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    const payload = {
      visitor_id: visitorId,
      page_url: pathname,
      page_title: document.title,
      referrer: getReferrer(),
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language
    };
    
    // Ajouter l'user ID si l'utilisateur est connecté
    if (userId) {
      payload.user_id = userId;
    }
    
    await fetch(`${API_URL}/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    // Silencieusement ignorer les erreurs de tracking
    console.debug('Analytics tracking error:', error);
  }
};

// Tracking de la durée de session
let sessionStartTime = Date.now();

export const getSessionDuration = () => {
  return Math.floor((Date.now() - sessionStartTime) / 1000);
};

// Reset le compteur de session
export const resetSession = () => {
  sessionStartTime = Date.now();
};

export default {
  trackPageView,
  getSessionDuration,
  resetSession,
  getVisitorId
};
