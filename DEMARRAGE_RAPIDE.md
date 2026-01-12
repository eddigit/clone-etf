# 🚀 Démarrage Rapide - Clone ETF

## Prérequis
- Python 3.11+
- Node.js 18+
- Variables d'environnement configurées

## 🔧 Configuration des variables d'environnement

### Backend
Le fichier `backend/.env` doit contenir toutes les variables nécessaires incluant Cloudinary.

### Frontend  
Le fichier `frontend/.env` configure l'URL de l'API backend.

Pour le **développement local** :
```env
REACT_APP_API_URL=http://localhost:8001
REACT_APP_BACKEND_URL=http://localhost:8001
```

Pour tester la **production** :
```env
REACT_APP_API_URL=https://clone-etf.onrender.com
REACT_APP_BACKEND_URL=https://clone-etf.onrender.com
```

## 🏃 Démarrage

### Backend (Terminal 1)
```powershell
cd backend
..\\.venv\Scripts\Activate.ps1
python server.py
```

Le backend démarre sur `http://localhost:8001`

### Frontend (Terminal 2)
```powershell
cd frontend
npm start
```

Le frontend démarre sur `http://localhost:3000`

## ✅ Vérifications

1. **Backend actif** : http://localhost:8001/api/health
2. **Frontend actif** : http://localhost:3000
3. **Articles** : http://localhost:3000/blog
4. **Article détail** : http://localhost:3000/blog/[slug-article]

## 📝 Cloudinary

Pour que les images fonctionnent :
- ✅ Variables ajoutées dans `backend/.env`
- ✅ Variables ajoutées sur Render (production)
- ✅ Le code utilise automatiquement Cloudinary si configuré

## 🐛 Dépannage

**Les images ne s'affichent pas** :
- Vérifier que Cloudinary est configuré dans `backend/.env`
- Relancer le backend après modification du `.env`

**La page d'article ne charge pas** :
- Vérifier que le backend est démarré
- Vérifier l'URL dans `frontend/.env`
- Ouvrir la console du navigateur pour voir les erreurs
