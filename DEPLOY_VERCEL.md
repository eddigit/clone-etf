# 🚀 Guide de Déploiement Vercel - En Toute Franchise

Ce guide explique comment déployer l'application sur Vercel.

## 📋 Prérequis

1. **Compte Vercel**
   - Créer un compte sur https://vercel.com
   - Connecter votre compte GitHub

2. **MongoDB Atlas** (Requis pour production)
   - Créer un compte sur https://www.mongodb.com/atlas
   - Créer un cluster gratuit (M0)
   - Noter la chaîne de connexion

3. **Repository GitHub**
   - Le code doit être sur GitHub
   - Repository: https://github.com/eddigit/clone-etf

---

## 🔧 Configuration MongoDB Atlas

### 1. Créer un Cluster

1. Aller sur https://cloud.mongodb.com
2. Créer un nouveau projet "ETF Production"
3. Créer un cluster gratuit (M0)
4. Choisir une région proche de vos utilisateurs

### 2. Configurer l'Accès

1. **Database Access** (Utilisateur):
   - Créer un utilisateur avec mot de passe
   - Noter: `username` et `password`
   - Permissions: "Read and write to any database"

2. **Network Access** (IP):
   - Cliquer sur "Add IP Address"
   - Sélectionner "Allow Access from Anywhere" (0.0.0.0/0)
   - Confirmer

### 3. Obtenir la Chaîne de Connexion

1. Cliquer sur "Connect" sur votre cluster
2. Choisir "Connect your application"
3. Copier la chaîne de connexion:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 4. Initialiser les Données

```powershell
# Modifier backend/.env temporairement avec l'URL Atlas
MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/

# Exécuter le seed
cd backend
python seed_data.py

# Remettre l'URL locale
MONGO_URL=mongodb://localhost:27017
```

---

## 🌐 Déploiement sur Vercel

### Option 1: Via le Dashboard Vercel (Recommandé)

1. **Connecter le Repository**
   - Aller sur https://vercel.com/new
   - Sélectionner "Import Git Repository"
   - Choisir `eddigit/clone-etf`
   - Cliquer sur "Import"

2. **Configuration du Projet**
   - **Framework Preset**: Create React App
   - **Root Directory**: `./` (laisser vide)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`

3. **Variables d'Environnement**
   
   Ajouter ces variables dans "Environment Variables":
   
   ```
   MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
   DB_NAME=test_database
   JWT_SECRET=votre_secret_jwt_production_super_securise_1234567890
   JWT_ALGORITHM=HS256
   JWT_EXPIRATION_MINUTES=10080
   FRONTEND_URL=https://votre-app.vercel.app
   ENVIRONMENT=production
   REACT_APP_API_URL=https://votre-app.vercel.app
   ```

4. **Déployer**
   - Cliquer sur "Deploy"
   - Attendre la fin du déploiement (2-5 minutes)
   - Votre app sera disponible sur: `https://clone-etf.vercel.app`

### Option 2: Via CLI Vercel

```powershell
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# À la racine du projet
vercel

# Suivre les instructions
# ? Set up and deploy "clone-etf"? [Y/n] y
# ? Which scope? Votre compte
# ? Link to existing project? [y/N] n
# ? What's your project's name? clone-etf
# ? In which directory is your code located? ./

# Configurer les variables d'environnement
vercel env add MONGO_URL
# Coller: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/

vercel env add DB_NAME
# Entrer: test_database

vercel env add JWT_SECRET
# Entrer: votre_secret_jwt_production_super_securise

# Répéter pour toutes les variables...

# Déployer en production
vercel --prod
```

---

## ⚙️ Configuration Backend API

Le backend FastAPI doit être configuré pour Vercel Serverless.

### 1. Créer vercel.json à la racine

Fichier `vercel.json` est déjà créé avec la configuration appropriée.

### 2. Modifier server.py si nécessaire

Le fichier `backend/server.py` doit exporter l'application:

```python
app = FastAPI(title="En Toute Franchise API", version="1.0.0")

# À la fin du fichier
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

---

## 🔐 Variables d'Environnement Vercel

### Via Dashboard

1. Aller dans votre projet sur Vercel
2. Settings → Environment Variables
3. Ajouter chaque variable:

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| MONGO_URL | mongodb+srv://... | Production |
| DB_NAME | test_database | Production |
| JWT_SECRET | secret_fort_et_unique | Production |
| JWT_ALGORITHM | HS256 | Production |
| JWT_EXPIRATION_MINUTES | 10080 | Production |
| FRONTEND_URL | https://votre-app.vercel.app | Production |
| ENVIRONMENT | production | Production |
| REACT_APP_API_URL | https://votre-app.vercel.app | Production |

### Via CLI

```powershell
vercel env add MONGO_URL production
vercel env add DB_NAME production
vercel env add JWT_SECRET production
# etc...
```

---

## 🔄 Déploiement Automatique

Vercel déploie automatiquement à chaque push sur GitHub:

- **Push sur `main`**: Déploiement en production
- **Push sur autres branches**: Déploiement de preview

Pour désactiver:
1. Settings → Git
2. Décocher "Automatic Deployments"

---

## 🧪 Tester le Déploiement

### 1. Vérifier le Frontend

```
https://votre-app.vercel.app
```

### 2. Vérifier l'API

```
https://votre-app.vercel.app/api/health
https://votre-app.vercel.app/docs
```

### 3. Tester la Connexion

- Aller sur la page de login
- Se connecter avec: test@example.fr / password123
- Vérifier l'accès au dashboard

---

## 🐛 Dépannage

### Erreur: Build Failed

```powershell
# Vérifier les logs Vercel
vercel logs

# Tester le build localement
cd frontend
npm run build
```

### Erreur: API ne répond pas

1. Vérifier que `vercel.json` est correct
2. Vérifier les variables d'environnement
3. Vérifier les logs:
   ```powershell
   vercel logs --follow
   ```

### Erreur: MongoDB Connection Failed

1. Vérifier la chaîne de connexion
2. Vérifier que l'IP 0.0.0.0/0 est autorisée dans Atlas
3. Vérifier que l'utilisateur MongoDB existe

### Erreur: CORS

Vérifier dans `backend/server.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://votre-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📊 Monitoring

### Vercel Analytics

1. Aller dans votre projet Vercel
2. Onglet "Analytics"
3. Voir les performances et erreurs

### Logs en Temps Réel

```powershell
vercel logs --follow
```

---

## 🔄 Mise à Jour

### Depuis Git

```powershell
# Faire vos modifications
git add .
git commit -m "Update: description"
git push origin main

# Vercel déploie automatiquement
```

### Déploiement Manuel

```powershell
vercel --prod
```

---

## 🎯 Checklist Avant Production

- [ ] MongoDB Atlas configuré avec les bonnes données
- [ ] Toutes les variables d'environnement ajoutées
- [ ] JWT_SECRET changé (différent du développement)
- [ ] Tests de connexion réussis
- [ ] CORS configuré correctement
- [ ] Les comptes de test fonctionnent
- [ ] Les URLs sont correctes (pas de localhost)
- [ ] Logs vérifiés sans erreurs
- [ ] Domaine personnalisé configuré (optionnel)

---

## 🌐 Domaine Personnalisé (Optionnel)

1. Acheter un domaine (ex: entoutefranchise.com)
2. Dans Vercel: Settings → Domains
3. Ajouter le domaine
4. Configurer les DNS selon les instructions Vercel

---

## 📞 Support Vercel

- Documentation: https://vercel.com/docs
- Support: https://vercel.com/support
- Discord: https://vercel.com/discord

---

## 🎉 C'est Déployé !

Votre application est maintenant en ligne sur:
- Production: https://clone-etf.vercel.app
- API: https://clone-etf.vercel.app/api/
- Docs: https://clone-etf.vercel.app/docs
