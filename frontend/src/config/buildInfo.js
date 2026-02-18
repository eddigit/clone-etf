// Ce fichier est généré automatiquement par le script de build
// Dernière mise à jour: 18/02/2026 11:16

export const BUILD_INFO = {
  commitHash: process.env.REACT_APP_COMMIT_HASH || '7f6b2142f80f8ffce562574f3ddb48bcac4a1d50',
  commitShort: process.env.REACT_APP_COMMIT_SHORT || '7f6b214',
  buildDate: process.env.REACT_APP_BUILD_DATE || '2026-02-18T11:16:41+01:00',
  buildTime: process.env.REACT_APP_BUILD_TIME || '11:16',
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
