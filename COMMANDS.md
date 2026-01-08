# ⚡ Commandes Rapides - En Toute Franchise

## 🚀 Démarrage

```powershell
# Vérifier l'environnement
.\check-env.ps1

# Lancer tout (automatique)
.\start-local.ps1

# Backend uniquement
.\start-backend.ps1

# Frontend uniquement
.\start-frontend.ps1
```

## 📦 Installation

```powershell
# Backend - Créer venv et installer
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend - Installer dépendances
cd frontend
npm install

# Initialiser la base de données
cd backend
python seed_data.py
```

## 🗄️ MongoDB

```powershell
# Démarrer MongoDB local
mongod --dbpath=C:\data\db

# Accéder au shell MongoDB
mongosh mongodb://localhost:27017/test_database

# Commandes MongoDB utiles
use test_database
show collections
db.users.find().pretty()
db.users.countDocuments()
```

## 🔄 Développement

```powershell
# Backend avec rechargement auto
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn server:app --reload --port 8001

# Frontend avec rechargement auto
cd frontend
npm start

# Tester l'API
# Ouvrir: http://localhost:8001/docs
```

## 🧪 Tests

```powershell
# Tester backend
cd backend
python backend_test.py

# Build frontend (test de production)
cd frontend
npm run build
```

## 🌐 Déploiement Vercel

```powershell
# Installer CLI Vercel
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Déployer en production
vercel --prod

# Voir les logs
vercel logs
vercel logs --follow

# Variables d'environnement
vercel env add MONGO_URL
vercel env add JWT_SECRET
vercel env ls
```

## 🔧 Dépannage

```powershell
# Arrêter processus sur port
# Port 3000 (Frontend)
Get-Process -Name node | Stop-Process -Force

# Port 8001 (Backend)
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Réinstaller dépendances
cd frontend
rm -rf node_modules
rm package-lock.json
npm install

# Recréer venv Python
cd backend
rm -rf venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Politique d'exécution PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📊 Monitoring

```powershell
# Voir tous les processus Python
Get-Process python

# Voir tous les processus Node
Get-Process node

# Voir MongoDB
Get-Process mongod

# Ports en écoute
netstat -ano | findstr LISTENING
```

## 🔐 Git

```powershell
# Status
git status

# Commit
git add .
git commit -m "Description"
git push origin main

# Voir les branches
git branch

# Créer une branche
git checkout -b feature/nom-feature

# Revenir à main
git checkout main
```

## 📝 Logs

```powershell
# Logs backend (dans le terminal où il tourne)
# Ou ajouter dans server.py:
# import logging
# logging.info("Mon message")

# Logs Vercel
vercel logs --follow

# Logs MongoDB
# Voir le terminal où mongod tourne
```

## 🎯 URLs Utiles

### Local
- Frontend: http://localhost:3000
- Backend: http://localhost:8001
- API Docs: http://localhost:8001/docs
- MongoDB: mongodb://localhost:27017

### Production (après déploiement)
- App: https://votre-app.vercel.app
- API: https://votre-app.vercel.app/api/
- Docs: https://votre-app.vercel.app/docs

## 👤 Comptes Test

```
User: test@example.fr / password123
Admin: admin@example.fr / admin123
```

## 📚 Documentation

```powershell
# Ouvrir la doc locale
start QUICKSTART.md
start SETUP_LOCAL.md
start DEPLOY_VERCEL.md
start PROJECT_SUMMARY.md
```

## 🔍 Recherche dans le Code

```powershell
# Trouver un texte dans tous les fichiers
Get-ChildItem -Recurse -Include *.py,*.js,*.jsx | Select-String "texte_recherché"

# Trouver un fichier
Get-ChildItem -Recurse -Filter "nom_fichier*"

# Compter les lignes de code
(Get-ChildItem -Recurse -Include *.py,*.js,*.jsx | Get-Content | Measure-Object -Line).Lines
```

## 💡 Astuces

```powershell
# Ouvrir VS Code
code .

# Ouvrir dans le navigateur
start http://localhost:3000

# Voir l'utilisation du disque
Get-ChildItem | Sort-Object Length -Descending | Select-Object Name, Length -First 10

# Nettoyer les fichiers temporaires
cd frontend
rm -rf node_modules, build, .cache
cd ..\backend
rm -rf __pycache__, .pytest_cache
```

---

**Raccourcis Keyboard dans VS Code:**
- `Ctrl+` ` - Ouvrir terminal
- `Ctrl+Shift+P` - Command Palette
- `Ctrl+P` - Recherche rapide fichier
- `Ctrl+F` - Recherche dans fichier
- `Ctrl+Shift+F` - Recherche dans projet

---

*Mise à jour: 4 janvier 2026*
