# 🌐 URLs de Production - En Toute Franchise

**Date de mise à jour :** 10 janvier 2026

---

## 📍 URLs de Production

### Frontend (Vercel)
- **URL principale :** https://clone-etf.vercel.app
- **Status :** À vérifier
- **Configuration :** `.env.production`

### Backend (Render)
- **URL API :** https://etf-backend-t3j5.onrender.com
- **Health Check :** https://etf-backend-t3j5.onrender.com/api/health
- **Documentation API :** https://etf-backend-t3j5.onrender.com/docs
- **Status :** ✅ En ligne (vérifié le 10/01/2026)

### Base de données (MongoDB Atlas)
- **Cluster :** Clone-ETF
- **Région :** Paris (eu-west-3)
- **Database :** test_database
- **Status :** ✅ Connectée

---

## 🔑 Compte Admin

| Champ | Valeur |
|-------|--------|
| **Email** | admin@example.fr |
| **Mot de passe** | admin123 |
| **Rôle** | admin |

**Test de connexion (Render) :** ✅ Fonctionnel (10/01/2026)

---

## 🔌 Intégrations

### HelloAsso
- **Organization :** en-toute-franchise
- **Client ID :** 2da3102cc98d4d94b03bc89d8942f404
- **Status Render :** ⚠️ À configurer (variables d'environnement manquantes)
- **Status Local :** ✅ Configuré

**Variables à ajouter sur Render :**
```bash
HELLOASSO_CLIENT_ID=2da3102cc98d4d94b03bc89d8942f404
HELLOASSO_CLIENT_SECRET=pAQCRxGxIrGwoAIdSFB8wLqvSEPG/HxO
HELLOASSO_ORGANIZATION_SLUG=en-toute-franchise
```

---

## 📋 Checklist de Déploiement

### Backend (Render) - ✅ Complété
- [x] Backend déployé et en ligne
- [x] MongoDB Atlas connectée
- [x] Endpoints API fonctionnels
- [x] Authentification admin testée
- [ ] Variables HelloAsso configurées

### Frontend (Vercel) - ⏳ À vérifier
- [x] Frontend déployé
- [x] Configuration `.env.production`
- [ ] Routes fonctionnelles
- [ ] Connexion au backend Render
- [ ] Pages admin accessibles

---

## 🔧 Actions Requises

### 1. Configurer HelloAsso sur Render
```bash
# Se connecter à Render.com
# Aller dans le service etf-backend-t3j5
# Environment > Add Environment Variable
# Ajouter les 3 variables HelloAsso ci-dessus
# Redéployer le service
```

### 2. Vérifier Vercel
- Ouvrir https://clone-etf.vercel.app
- Tester la navigation
- Tester la connexion admin
- Vérifier que le backend Render est utilisé

### 3. Tester l'Admin HelloAsso
- Se connecter avec admin@example.fr
- Aller sur `/admin/helloasso`
- Tester la synchronisation
- Vérifier les membres importés

---

## 📊 État Actuel (10/01/2026)

| Service | Status | URL | Notes |
|---------|--------|-----|-------|
| **Backend Render** | ✅ En ligne | https://etf-backend-t3j5.onrender.com | Fonctionnel |
| **Frontend Vercel** | ⏳ À vérifier | https://clone-etf.vercel.app | À tester |
| **MongoDB Atlas** | ✅ Connecté | Paris (eu-west-3) | Base: test_database |
| **HelloAsso API** | ⚠️ Partiel | - | Config Render manquante |
| **Backend Local** | ✅ Running | http://localhost:8001 | Dev |
| **Frontend Local** | ⏳ À démarrer | http://localhost:3000 | Dev |

---

## 🚀 Commandes Rapides

### Démarrer en local
```powershell
# Backend
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Frontend (nouveau terminal)
cd frontend
npm start
```

### Tester les APIs
```powershell
# Health check Render
curl https://etf-backend-t3j5.onrender.com/api/health

# Login admin Render
$body = @{email="admin@example.fr"; password="admin123"} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://etf-backend-t3j5.onrender.com/api/auth/login" -Body $body -ContentType "application/json"
```

### Git
```bash
# Voir les changements
git status

# Commit et push
git add .
git commit -m "feat: description"
git push
```

---

## 📞 Support

**Documentation complète :**
- [START_HERE.md](START_HERE.md) - Point de départ
- [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md) - Guide Vercel
- [DATABASE_INFO.md](DATABASE_INFO.md) - MongoDB Atlas

**Logs :**
- Render : https://dashboard.render.com/
- Vercel : https://vercel.com/dashboard
