// Script pour générer les infos de build
// Exécuté avant chaque build

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Récupérer le hash du commit
let commitHash = 'dev';
let commitShort = 'dev';

try {
  commitHash = execSync('git rev-parse HEAD').toString().trim();
  commitShort = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  console.log('Git non disponible, utilisation de valeurs par défaut');
}

// Date et heure de build
const now = new Date();
const buildDate = now.toISOString();
const buildTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// Créer le fichier .env avec les variables
const envContent = `
REACT_APP_COMMIT_HASH=${commitHash}
REACT_APP_COMMIT_SHORT=${commitShort}
REACT_APP_BUILD_DATE=${buildDate}
REACT_APP_BUILD_TIME=${buildTime}
`;

// Écrire dans .env.local (sera lu par React)
const envPath = path.join(__dirname, '..', '.env.local');

// Lire l'env existant et ajouter nos variables
let existingEnv = '';
try {
  existingEnv = fs.readFileSync(envPath, 'utf8');
  // Supprimer les anciennes variables de build
  existingEnv = existingEnv
    .split('\n')
    .filter(line => !line.startsWith('REACT_APP_COMMIT') && !line.startsWith('REACT_APP_BUILD'))
    .join('\n');
} catch (e) {
  // Fichier n'existe pas, c'est OK
}

fs.writeFileSync(envPath, existingEnv + envContent);

console.log(`✅ Build info généré:`);
console.log(`   Commit: ${commitShort}`);
console.log(`   Date: ${buildDate}`);
console.log(`   Time: ${buildTime}`);
