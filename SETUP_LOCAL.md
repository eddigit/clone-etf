# 🚀 Guide de Configuration Locale - En Toute Franchise

Ce guide vous permet de faire tourner le projet en local sur Windows.

## 📋 Prérequis

### Logiciels Requis

1. **Python 3.11+**
   - Télécharger: https://www.python.org/downloads/
   - Vérifier: `python --version`

2. **Node.js 18+**
   - Télécharger: https://nodejs.org/
   - Vérifier: `node --version` et `npm --version`

3. **MongoDB Community Edition**
   - Télécharger: https://www.mongodb.com/try/download/community
   - Vérifier: `mongod --version`

4. **Git**
   - Télécharger: https://git-scm.com/downloads
   - Vérifier: `git --version`

---

## 🔧 Installation

### 1. Cloner le Projet

```powershell
git clone https://github.com/eddigit/clone-etf.git
cd clone-etf
```

### 2. Configuration MongoDB

#### Option A: Installation Locale de MongoDB

1. Installer MongoDB Community Edition
2. Créer un dossier pour les données:
   ```powershell
   mkdir C:\data\db
   ```

3. Démarrer MongoDB:
   ```powershell
   mongod --dbpath=C:\data\db
   ```

4. Dans un autre terminal, initialiser la base avec les données de test:
   ```powershell
   cd backend
   python seed_data.py
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Créer un compte gratuit sur https://www.mongodb.com/atlas
2. Créer un cluster gratuit
3. Obtenir la chaîne de connexion
4. Modifier `backend/.env`:
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
   DB_NAME=test_database
   ```

### 3. Configuration Backend (Python/FastAPI)

```powershell
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
.\venv\Scripts\Activate.ps1

# Si erreur de politique d'exécution, exécuter:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Installer les dépendances
pip install -r requirements.txt

# Vérifier que le fichier .env existe
# Il doit contenir:
# MONGO_URL=mongodb://localhost:27017
# DB_NAME=test_database
# JWT_SECRET=dev_secret_key_change_in_production_1234567890
# etc.
```

### 4. Configuration Frontend (React)

```powershell
cd ..\frontend

# Installer les dépendances
npm install

# Vérifier que le fichier .env existe
# Il doit contenir:
# REACT_APP_API_URL=http://localhost:8001
```

---

## 🎯 Démarrage Rapide

### Méthode 1: Script Automatique (Recommandé)

```powershell
# À la racine du projet
.\start-local.ps1
```

Ce script va:
- Vérifier que MongoDB est actif
- Démarrer le backend sur le port 8001
- Démarrer le frontend sur le port 3000

### Méthode 2: Démarrage Manuel

#### Terminal 1 - MongoDB
```powershell
mongod --dbpath=C:\data\db
```

#### Terminal 2 - Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

#### Terminal 3 - Frontend
```powershell
cd frontend
npm start
```

### Méthode 3: Scripts Individuels

```powershell
# Backend uniquement
.\start-backend.ps1

# Frontend uniquement
.\start-frontend.ps1
```

---

## 🌐 Accès à l'Application

Une fois démarrée:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **Documentation API**: http://localhost:8001/docs
- **MongoDB**: mongodb://localhost:27017

---

## 👥 Comptes de Test

### Utilisateur Standard
- **Email**: test@example.fr
- **Mot de passe**: password123
- **Rôle**: user

### Administrateur
- **Email**: admin@example.fr
- **Mot de passe**: admin123
- **Rôle**: admin

---

## 🗄️ Base de Données

### Collections MongoDB

La base `test_database` contient 8 collections:

1. **users** - Utilisateurs et profils
2. **ai_conversations** - Conversations IA
3. **ai_messages** - Messages IA
4. **documents** - Documents uploadés
5. **resources** - Ressources disponibles
6. **invoices** - Factures
7. **articles** - Articles de blog
8. **contact_messages** - Messages de contact

### Connexion MongoDB Compass

```
Connection String: mongodb://localhost:27017/test_database
```

### Commandes MongoDB utiles

```javascript
// Lister les collections
use test_database
show collections

// Voir les utilisateurs
db.users.find().pretty()

// Compter les documents
db.users.countDocuments()
```

---

## 🔧 Dépannage

### Erreur: MongoDB non trouvé

```powershell
# Vérifier si MongoDB est installé
mongod --version

# Démarrer MongoDB
mongod --dbpath=C:\data\db
```

### Erreur: Port 3000 déjà utilisé

```powershell
# Trouver le processus
Get-Process -Name node | Stop-Process -Force

# Ou utiliser un autre port
$env:PORT=3001
npm start
```

### Erreur: Port 8001 déjà utilisé

```powershell
# Trouver et arrêter le processus
netstat -ano | findstr :8001
taskkill /PID <PID> /F
```

### Erreur: Python venv ne s'active pas

```powershell
# Changer la politique d'exécution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erreur: Modules Python manquants

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Erreur: Modules npm manquants

```powershell
cd frontend
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 📦 Structure du Projet

```
clone-etf/
├── backend/                 # API FastAPI
│   ├── server.py           # Routes principales
│   ├── models.py           # Modèles Pydantic
│   ├── auth_utils.py       # Authentification JWT
│   ├── seed_data.py        # Script de seed
│   ├── requirements.txt    # Dépendances Python
│   └── .env               # Variables d'environnement
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages de l'application
│   │   └── App.js         # Composant racine
│   ├── package.json       # Dépendances npm
│   └── .env              # Variables d'environnement
├── DATABASE_INFO.md       # Documentation BDD
├── SETUP_LOCAL.md         # Ce fichier
├── start-local.ps1        # Script de démarrage
└── vercel.json           # Config Vercel
```

---

## 🚀 Prochaines Étapes

1. ✅ Configuration locale terminée
2. 📝 Tester toutes les fonctionnalités
3. 🔐 Changer les secrets en production
4. 🌐 Déployer sur Vercel (voir DEPLOY_VERCEL.md)

---

## 📞 Support

Pour plus d'informations, consultez:
- [DATABASE_INFO.md](DATABASE_INFO.md) - Schéma de la base de données
- [contracts.md](contracts.md) - Contrats API
- Documentation API: http://localhost:8001/docs
