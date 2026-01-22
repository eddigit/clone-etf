// Ce fichier est généré automatiquement par le script de build
// Dernière mise à jour: 22/01/2026 18:42

export const BUILD_INFO = {
  commitHash: process.env.REACT_APP_COMMIT_HASH || 'dd912eddbc3409933a14b35515748f49779dc8a5',
  commitShort: process.env.REACT_APP_COMMIT_SHORT || 'dd912ed',
  buildDate: process.env.REACT_APP_BUILD_DATE || '2026-01-22T18:42:14+01:00',
  buildTime: process.env.REACT_APP_BUILD_TIME || '18:42',
  environment: process.env.NODE_ENV || 'development'
};

export const getVersionString = () => {
  const date = new Date(BUILD_INFO.buildDate);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `v${BUILD_INFO.commitShort} • ${formattedDate} ${formattedTime}`;
};
