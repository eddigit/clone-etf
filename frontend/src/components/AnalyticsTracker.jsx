import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../services/analyticsService';

/**
 * Composant qui track automatiquement les changements de page
 * pour les analytics
 */
const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Tracker la page vue à chaque changement de route
    trackPageView(location.pathname);
  }, [location.pathname]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default AnalyticsTracker;
