import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Composant qui scroll automatiquement en haut de la page
 * à chaque changement de route
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // 'instant' pour un scroll immédiat, 'smooth' pour animé
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
