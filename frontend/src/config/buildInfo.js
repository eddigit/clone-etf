// Ce fichier est généré automatiquement par le script de build
// Ne pas modifier manuellement

export const BUILD_INFO = {
  commitHash: process.env.REACT_APP_COMMIT_HASH || 'dev',
  commitShort: process.env.REACT_APP_COMMIT_SHORT || 'dev',
  buildDate: process.env.REACT_APP_BUILD_DATE || new Date().toISOString(),
  buildTime: process.env.REACT_APP_BUILD_TIME || new Date().toLocaleTimeString('fr-FR'),
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
