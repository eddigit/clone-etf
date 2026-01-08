# 🗄️ Migration de Base de Données - Instructions

## 📍 Situation Actuelle

- ❌ **MongoDB local**: Non installé sur votre machine
- ❓ **Base distante**: Était hébergée sur Emergent.sh
- ✅ **Scripts créés**: Prêts pour export/import

## 🎯 Votre Mission

Vous devez créer un compte MongoDB Atlas pour votre client et obtenir l'URL de connexion.

---

## ✅ CE QUE J'AI PRÉPARÉ POUR VOUS

### Scripts Python Créés

1. **`backend/test_connection.py`**
   - Teste la connexion à MongoDB
   - Affiche les collections et le nombre de documents
   - Utilise: `python test_connection.py`

2. **`backend/export_db.py`**
   - Exporte TOUTES les données de la base actuelle
   - Crée des fichiers JSON dans `db_export/`
   - Utilise: `python export_db.py`

3. **`backend/import_db.py`**
   - Importe les données exportées vers une nouvelle base
   - Recrée les index automatiquement
   - Utilise: `python import_db.py`

### Documentation Créée

- **`MIGRATION_GUIDE.md`**: Guide complet étape par étape

---

## 🚀 PROCESSUS DE MIGRATION (3 ÉTAPES)

### ÉTAPE 1: Obtenir l'URL de l'Ancienne Base

**Option A: Si vous avez encore accès à Emergent.sh**

1. Connectez-vous à Emergent.sh
2. Trouvez l'URL MongoDB de connexion
3. Copiez-la

**Option B: Si vous n'avez plus accès**

→ Passez directement à l'Étape 2 et utilisez `seed_data.py` pour créer des données de test

---

### ÉTAPE 2: Créer MongoDB Atlas (5 minutes)

1. **Aller sur**: https://www.mongodb.com/cloud/atlas/register

2. **Créer un compte gratuit** (ou Google/GitHub login)

3. **Créer un cluster gratuit (M0)**
   - Plan: FREE (0€)
   - Région: Europe (Paris ou Frankfurt)
   - Nom: `etf-production`

4. **Créer un utilisateur DB**
   - Security → Database Access → Add New User
   - Username: `etf_admin`
   - Password: Générer un mot de passe fort (NOTEZ-LE!)
   - Permissions: "Read and write to any database"

5. **Autoriser toutes les IPs (pour le dev)**
   - Security → Network Access → Add IP Address
   - Choisir: "Allow Access from Anywhere" (0.0.0.0/0)

6. **Obtenir l'URL de connexion**
   - Database → Connect → Connect your application
   - Driver: Python
   - Copier l'URL:
   ```
   mongodb+srv://etf_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Remplacer `<password>` par le vrai mot de passe

---

### ÉTAPE 3: Migration des Données

#### A. SI VOUS AVEZ L'ANCIENNE BASE:

```powershell
# 1. Exporter depuis l'ancienne base
#    Modifiez backend/.env avec l'URL Emergent.sh
cd backend
python export_db.py

# 2. Importer vers MongoDB Atlas
#    Modifiez backend/.env avec l'URL MongoDB Atlas
python import_db.py

# 3. Vérifier
python test_connection.py
```

#### B. SI VOUS N'AVEZ PAS L'ANCIENNE BASE:

```powershell
# 1. Configurer backend/.env avec l'URL MongoDB Atlas
cd backend

# 2. Créer des données de test
python seed_data.py

# 3. Vérifier
python test_connection.py
```

---

## 📝 MODIFICATION DU FICHIER .env

### Pour Exporter (Ancienne base)

Modifiez `backend/.env`:
```env
MONGO_URL=<URL_EMERGENT_SH_OU_ANCIENNE_BASE>
DB_NAME=test_database
```

### Pour Importer (Nouvelle base)

Modifiez `backend/.env`:
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

## 🎯 COMMANDES UTILES

```powershell
# Tester la connexion
cd backend
python test_connection.py

# Exporter la base
python export_db.py

# Importer la base
python import_db.py

# Créer des données de test
python seed_data.py

# Démarrer le backend
python -m uvicorn server:app --reload --port 8001
```

---

## 📊 VÉRIFICATION FINALE

Une fois la migration terminée, vérifiez:

1. ✅ Connexion réussie: `python test_connection.py`
2. ✅ 8 collections présentes
3. ✅ Backend démarre: `python -m uvicorn server:app --reload --port 8001`
4. ✅ API accessible: http://localhost:8001/docs
5. ✅ Login fonctionne avec: test@example.fr / password123

---

## 🎉 APRÈS LA MIGRATION

### Pour le Développement Local

Le fichier `backend/.env` doit contenir l'URL MongoDB Atlas:
```env
MONGO_URL=mongodb+srv://etf_admin:PASSWORD@cluster0.xxxxx.mongodb.net/...
DB_NAME=test_database
```

### Pour Vercel (Production)

Dans les variables d'environnement Vercel, ajoutez:
- `MONGO_URL`: Votre URL MongoDB Atlas
- `DB_NAME`: test_database
- `JWT_SECRET`: Un secret différent et sécurisé
- etc.

---

## 📞 BESOIN D'AIDE?

### Si la connexion échoue:

1. Vérifiez l'URL dans `backend/.env`
2. Vérifiez que vous avez remplacé `<password>` par le vrai mot de passe
3. Vérifiez que les IPs sont autorisées (0.0.0.0/0)
4. Testez: `python test_connection.py`

### Si l'export échoue:

1. Vérifiez que vous avez encore accès à l'ancienne base
2. Sinon, utilisez `seed_data.py` pour créer des données de test

### Si l'import échoue:

1. Vérifiez que le dossier `db_export/` contient des fichiers
2. Vérifiez la connexion à la nouvelle base
3. Relancez: `python import_db.py`

---

## 📚 DOCUMENTATION COMPLÈTE

- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Guide détaillé
- **[DATABASE_INFO.md](DATABASE_INFO.md)** - Schéma de la base
- **[SETUP_LOCAL.md](SETUP_LOCAL.md)** - Configuration locale

---

## ✨ RÉSUMÉ RAPIDE

```powershell
# 1. Créez MongoDB Atlas (gratuit)
# 2. Obtenez l'URL: mongodb+srv://...
# 3. Modifiez backend/.env avec cette URL
# 4. Lancez:
cd backend
python seed_data.py       # Ou export_db.py puis import_db.py
python test_connection.py # Vérifier
python -m uvicorn server:app --reload --port 8001 # Démarrer
```

**C'est prêt! 🚀**
