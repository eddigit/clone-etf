// Ce fichier est généré automatiquement par le script de build
// Dernière mise à jour: 22/01/2026 18:55

export const BUILD_INFO = {
  commitHash: process.env.REACT_APP_COMMIT_HASH || '1224531d5352dc32498f7124c2e219c68b1784da',
  commitShort: process.env.REACT_APP_COMMIT_SHORT || '1224531',
  buildDate: process.env.REACT_APP_BUILD_DATE || '2026-01-22T18:55:00+01:00',
  buildTime: process.env.REACT_APP_BUILD_TIME || '18:55',
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
