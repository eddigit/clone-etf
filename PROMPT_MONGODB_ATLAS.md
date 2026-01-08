# 🤖 PROMPT POUR CRÉER LA BASE DE DONNÉES MONGODB ATLAS

## Contexte du Projet

Je travaille sur un projet **En Toute Franchise**, une plateforme web associative avec:
- **Frontend**: React 19 + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB

Le projet est prêt mais nécessite une base de données MongoDB Atlas.

---

## 🎯 Mission

Crée et configure une base de données MongoDB Atlas gratuite (M0) pour ce projet, avec:

1. **Cluster MongoDB Atlas** (Free Tier M0)
2. **Utilisateur de base de données** avec permissions complètes
3. **Accès réseau configuré** pour permettre les connexions
4. **Chaîne de connexion** prête à l'emploi

---

## 📋 Spécifications Requises

### Informations du Cluster
- **Nom du cluster**: `etf-production` (ou suggère un meilleur nom)
- **Type**: M0 (Free Tier - gratuit)
- **Région**: Europe (Paris, Frankfurt, ou Amsterdam recommandé)
- **Provider**: AWS, Google Cloud, ou Azure (au choix)

### Utilisateur de la Base de Données
- **Username**: `etf_admin`
- **Password**: Génère un mot de passe fort et sécurisé
- **Permissions**: Read and write to any database
- **Authentication**: SCRAM (par défaut)

### Configuration Réseau
- **Autoriser**: 0.0.0.0/0 (Access from Anywhere)
- **Raison**: Pour développement et déploiement Vercel
- **Note**: En production, on restreindra aux IPs Vercel

### Base de Données
- **Nom**: `test_database`
- **Collections à créer** (8 au total):
  1. `users` - Utilisateurs de la plateforme
  2. `ai_conversations` - Conversations avec l'IA
  3. `ai_messages` - Messages des conversations
  4. `documents` - Documents uploadés
  5. `resources` - Ressources téléchargeables
  6. `invoices` - Factures
  7. `articles` - Articles de blog
  8. `contact_messages` - Messages du formulaire de contact

---

## 📊 Structure des Collections (Index Requis)

### Collection: users
- Index unique sur `email`
- Index unique sur `id`

### Collection: ai_conversations
- Index sur `userId`
- Index unique sur `id`

### Collection: ai_messages
- Index sur `conversationId`
- Index sur `userId`
- Index unique sur `id`

### Collection: documents
- Index sur `userId`
- Index unique sur `id`

### Collection: resources
- Index sur `category`
- Index sur `accessLevel`

### Collection: articles
- Index sur `slug` (unique)
- Index sur `published`

---

## 🔐 Informations à Me Fournir

Une fois la configuration terminée, fournis-moi:

1. **URL de connexion complète**:
   ```
   mongodb+srv://etf_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

2. **Détails de connexion**:
   - Nom du cluster
   - Région sélectionnée
   - Username
   - Password

3. **Instructions pour**:
   - Comment accéder au cluster via MongoDB Atlas dashboard
   - Comment se connecter avec MongoDB Compass (si applicable)
   - Comment vérifier que tout fonctionne

---

## 📝 Format de la Réponse Attendue

Présente les informations dans ce format:

```
✅ CLUSTER MONGODB ATLAS CRÉÉ

📊 Informations du Cluster:
   Nom: etf-production
   Région: eu-west-1 (Ireland)
   Type: M0 (Free)
   Provider: AWS

🔐 Credentials:
   Username: etf_admin
   Password: [MOT_DE_PASSE_GÉNÉRÉ]

🌐 URL de Connexion:
   mongodb+srv://etf_admin:[PASSWORD]@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

📦 Base de Données:
   Nom: test_database
   Collections: 8 (créées avec index)

✅ Configuration:
   ✓ Réseau: 0.0.0.0/0 autorisé
   ✓ Utilisateur créé avec permissions R/W
   ✓ Collections créées
   ✓ Index configurés

🎯 Prochaines Étapes:
   1. Copier l'URL de connexion
   2. Remplacer [PASSWORD] par le mot de passe
   3. Modifier backend/.env avec cette URL
   4. Lancer: python backend/init_project.py
```

---

## 🔧 Fichier .env à Mettre à Jour

Une fois la base créée, je devrai modifier `backend/.env`:

```env
MONGO_URL=mongodb+srv://etf_admin:VOTRE_PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=test_database
JWT_SECRET=dev_secret_key_change_in_production_1234567890
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=10080
API_HOST=0.0.0.0
API_PORT=8001
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

---

## 📚 Informations Supplémentaires

### Le projet utilise Motor (MongoDB async driver pour Python)
```python
from motor.motor_asyncio import AsyncIOMotorClient
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]
```

### Exemples de requêtes qui seront exécutées:
- `db.users.find_one({"email": "test@example.fr"})`
- `db.users.create_index("email", unique=True)`
- `db.articles.find({"published": True})`

### Données de départ à insérer:
- 2 utilisateurs (test + admin)
- 3 ressources
- 2 articles de blog
- Collections vides pour le reste

---

## ⚠️ Points Importants

1. **N'oublie pas** de noter le mot de passe généré
2. **Assure-toi** que 0.0.0.0/0 est bien autorisé dans Network Access
3. **Vérifie** que l'utilisateur a les bonnes permissions
4. **Teste** la connexion si possible

---

## 🎯 Objectif Final

Après ta configuration, je dois pouvoir:
1. Copier l'URL dans `backend/.env`
2. Lancer `python backend/init_project.py`
3. Voir le message "✅ Initialisation terminée!"
4. Me connecter avec test@example.fr / password123

---

**Merci de ta coopération ! 🚀**
