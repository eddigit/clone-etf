# 🌐 Configuration Production - Clone ETF

## URLs de Production

### Frontend (Vercel)
- **Domaine principal** : https://www.en-toutefranchise.com/
- **Domaine Vercel** : https://etf-enfrance-association.vercel.app/

### Backend (Render)
- **API Backend** : https://clone-etf.onrender.com/

## ✅ Configuration Vercel (Frontend)

### Variables d'environnement à ajouter sur Vercel :
```
REACT_APP_API_URL=https://clone-etf.onrender.com
REACT_APP_BACKEND_URL=https://clone-etf.onrender.com
```

### Domaine personnalisé
1. Dans Vercel → Settings → Domains
2. Ajouter : `www.en-toutefranchise.com`
3. Configurer le DNS chez votre registrar :
   - Type: CNAME
   - Name: www
   - Value: cname.vercel-dns.com

## ✅ Configuration Render (Backend)

### Variables d'environnement à ajouter sur Render :

#### MongoDB
```
MONGO_URL=mongodb+srv://associationentoutefranchise_db_user:yCXkIQQUA0GPYd2F@clone-etf.cqbuiow.mongodb.net/test_database?retryWrites=true&w=majority&appName=Clone-ETF
DB_NAME=test_database
```

#### JWT
```
JWT_SECRET=prod_secret_key_CHANGE_THIS_TO_RANDOM_STRING
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080
```

#### CORS
```
FRONTEND_URL=https://www.en-toutefranchise.com
ENVIRONMENT=production
```

#### HelloAsso
```
HELLOASSO_CLIENT_ID=2da3102cc98d4d94b03bc89d8942f404
HELLOASSO_CLIENT_SECRET=pAQCRxGxIrGwoAIdSFB8wLqvSEPG/HxO
HELLOASSO_ORGANIZATION_SLUG=en-toute-franchise
HELLOASSO_WEBHOOK_SECRET=[votre_secret_webhook]
```

#### Cloudinary (IMPORTANT pour les images !)
```
CLOUDINARY_CLOUD_NAME=dx4fqegqb
CLOUDINARY_API_KEY=959332161139447
CLOUDINARY_API_SECRET=1RviAo_nA0i04bUcmliiZ4u6ZHg
```

#### Resend (Emails)
```
RESEND_API_KEY=re_XmyWWoYX_5JmYRGc5Fekon3Qb3WCT7sWt
MAIL_FROM=En Toute Franchise <noreply@en-toutefranchise.com>
```

#### API Key externe
```
EXTERNAL_API_KEY=[votre_clé_api_générée]
```

## 🔍 Vérifications Production

### Frontend
- ✅ Vérifier que le build Vercel réussit
- ✅ Tester : https://www.en-toutefranchise.com/
- ✅ Tester les articles : https://www.en-toutefranchise.com/blog

### Backend
- ✅ Vérifier que Render est déployé
- ✅ Tester : https://clone-etf.onrender.com/api/health
- ✅ Vérifier les logs Render pour les erreurs

### Cloudinary
- ✅ Uploader une image dans l'admin
- ✅ Vérifier que l'URL commence par `https://res.cloudinary.com/`
- ✅ Vérifier que l'image s'affiche dans l'article

## 🐛 Dépannage Production

### Les articles ne chargent pas
1. Ouvrir la console du navigateur (F12)
2. Vérifier les erreurs réseau
3. Vérifier que l'API backend répond : https://clone-etf.onrender.com/api/articles

### Les images ne s'affichent pas
1. Vérifier que Cloudinary est configuré sur Render
2. Vérifier les logs Render pour voir si Cloudinary est initialisé
3. Uploader une nouvelle image pour tester

### CORS Errors
1. Vérifier que `FRONTEND_URL=https://www.en-toutefranchise.com` est sur Render
2. Redéployer le backend après modification

## 📝 Notes importantes

- **Render** : Le backend peut prendre ~1 minute à démarrer s'il était en veille
- **Vercel** : Le déploiement est automatique à chaque push sur la branche main
- **Cloudinary** : Offre gratuite = 25 crédits/mois (suffisant pour ~1000 images)
