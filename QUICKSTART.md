# 🚀 Démarrage Rapide - En Toute Franchise

## ⚡ Installation Express (5 minutes)

### 1. Prérequis Installés ?
- ✅ Python 3.11+ → `python --version`
- ✅ Node.js 18+ → `node --version`
- ✅ MongoDB → `mongod --version`

### 2. Installation Backend

```powershell
cd backend

# Créer environnement virtuel
python -m venv venv

# Activer (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Installer dépendances
pip install -r requirements.txt
```

### 3. Installation Frontend

```powershell
cd frontend
npm install
```

### 4. Démarrer MongoDB

```powershell
# Dans un terminal séparé
mongod --dbpath=C:\data\db
```

### 5. Initialiser la Base de Données

```powershell
cd backend
python seed_data.py
```

### 6. Lancer l'Application

#### Option A: Script Automatique (Recommandé)
```powershell
.\start-local.ps1
```

#### Option B: Manuel
```powershell
# Terminal 1 - Backend
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn server:app --reload --port 8001

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🌐 Accès

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

## 👤 Comptes Test

**User**: test@example.fr / password123
**Admin**: admin@example.fr / admin123

## 📚 Documentation Complète

- [Setup Détaillé](SETUP_LOCAL.md)
- [Déploiement Vercel](DEPLOY_VERCEL.md)
- [Base de Données](DATABASE_INFO.md)

## 🆘 Problèmes ?

### MongoDB ne démarre pas
```powershell
# Créer le dossier data
mkdir C:\data\db

# Démarrer MongoDB
mongod --dbpath=C:\data\db
```

### Port déjà utilisé
```powershell
# Backend (port 8001)
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Frontend (port 3000)
Get-Process -Name node | Stop-Process -Force
```

### Erreur venv
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

**Besoin d'aide ?** → Consultez [SETUP_LOCAL.md](SETUP_LOCAL.md) pour plus de détails
