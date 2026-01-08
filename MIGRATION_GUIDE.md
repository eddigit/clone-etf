# 🔄 Guide Migration Base de Données MongoDB

## 📋 Étape 1: Obtenir l'URL de la Base Actuelle (Emergent.sh)

Si vous avez encore accès à la base sur Emergent.sh:

1. Connectez-vous à Emergent.sh
2. Allez dans les paramètres du projet
3. Cherchez les informations de connexion MongoDB
4. Copiez l'URL complète (format: `mongodb://...` ou `mongodb+srv://...`)

---

## 📋 Étape 2: Créer une Nouvelle Base MongoDB Atlas

### 2.1 Créer un Compte (Gratuit)

1. Allez sur: https://www.mongodb.com/cloud/atlas/register
2. Inscrivez-vous (ou connectez-vous avec Google/GitHub)
3. Sélectionnez le plan **FREE** (M0)

### 2.2 Créer un Cluster

1. Cliquez sur "Build a Database"
2. Sélectionnez **M0 FREE** (0€/mois)
3. Choisissez une région proche (ex: France - Paris ou EU-West)
4. Donnez un nom au cluster (ex: `etf-production`)
5. Cliquez sur "Create"
6. Attendez 2-3 minutes pendant la création

### 2.3 Configurer l'Accès

#### A. Créer un Utilisateur

1. Onglet "Database Access" (dans Security)
2. Cliquez "Add New Database User"
3. Méthode d'authentification: **Password**
4. Nom d'utilisateur: `etf_admin`
5. Mot de passe: Générez un mot de passe fort (notez-le!)
6. Database User Privileges: **Read and write to any database**
7. Cliquez "Add User"

#### B. Autoriser les IPs

1. Onglet "Network Access" (dans Security)
2. Cliquez "Add IP Address"
3. Pour le développement, sélectionnez: **Allow Access from Anywhere** (0.0.0.0/0)
4. Cliquez "Confirm"

⚠️ **Pour la production**, ajoutez uniquement les IPs de Vercel

### 2.4 Obtenir la Chaîne de Connexion

1. Retournez à "Database" (dans Deployment)
2. Cliquez sur "Connect" sur votre cluster
3. Sélectionnez "Connect your application"
4. Driver: **Python** / Version: **3.12 or later**
5. Copiez la chaîne de connexion:
   ```
   mongodb+srv://etf_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Remplacez `<password>` par le mot de passe créé

---

## 📋 Étape 3: Exporter depuis l'Ancienne Base

### 3.1 Configurer la Connexion à l'Ancienne Base

Modifiez `backend/.env`:

```env
# ANCIENNE base (Emergent.sh ou autre)
MONGO_URL=<URL_ANCIENNE_BASE>
DB_NAME=test_database
```

### 3.2 Exporter les Données

```powershell
cd backend
python export_db.py
```

✅ Un dossier `db_export/` sera créé avec tous vos données

---

## 📋 Étape 4: Importer dans la Nouvelle Base

### 4.1 Configurer la Connexion à la Nouvelle Base

Modifiez `backend/.env`:

```env
# NOUVELLE base (MongoDB Atlas)
MONGO_URL=mongodb+srv://etf_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=test_database
```

### 4.2 Importer les Données

```powershell
cd backend
python import_db.py
```

✅ Toutes vos données seront importées dans la nouvelle base!

---

## 📋 Étape 5: Vérifier l'Import

### 5.1 Via MongoDB Compass (Interface Graphique)

1. Téléchargez MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Connectez-vous avec votre URL MongoDB Atlas
3. Explorez les collections (8 collections attendues)
4. Vérifiez les données

### 5.2 Via Python

```powershell
cd backend
python -c "from motor.motor_asyncio import AsyncIOMotorClient; import asyncio; import os; from dotenv import load_dotenv; load_dotenv(); async def check(): client = AsyncIOMotorClient(os.environ['MONGO_URL']); db = client[os.environ['DB_NAME']]; collections = await db.list_collection_names(); print(f'Collections: {collections}'); for col in collections: count = await db[col].count_documents({}); print(f'{col}: {count} documents'); client.close(); asyncio.run(check())"
```

---

## 📋 Alternative: Si Vous N'avez Plus Accès à l'Ancienne Base

Si vous ne pouvez plus vous connecter à la base Emergent.sh, utilisez le script de seed:

```powershell
cd backend
python seed_data.py
```

⚠️ Cela créera des **données de test** (utilisateurs de démonstration, etc.)

---

## 🎯 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `export_db.py` | Exporte la base dans `db_export/` |
| `import_db.py` | Importe depuis le dernier export |
| `seed_data.py` | Crée des données de test |

---

## 📝 Exemple Complet de Migration

```powershell
# 1. Exporter depuis l'ancienne base
# Modifier backend/.env avec ancienne URL
cd backend
python export_db.py

# 2. Importer vers la nouvelle base
# Modifier backend/.env avec nouvelle URL MongoDB Atlas
python import_db.py

# 3. Vérifier
python -m uvicorn server:app --reload --port 8001
# Ouvrir http://localhost:8001/docs
# Tester GET /api/users/ etc.
```

---

## 🆘 Dépannage

### Erreur: "Connection refused"
- Vérifiez que l'URL dans `.env` est correcte
- Vérifiez que les IPs sont autorisées dans MongoDB Atlas
- Vérifiez votre connexion internet

### Erreur: "Authentication failed"
- Vérifiez le mot de passe dans l'URL
- Assurez-vous que l'utilisateur existe dans MongoDB Atlas
- Vérifiez les permissions de l'utilisateur

### Erreur: "Database not found"
- La base sera créée automatiquement lors de l'import
- Assurez-vous que `DB_NAME` est correct dans `.env`

---

## 📞 Prochaines Étapes

Une fois la migration réussie:

1. ✅ Tester l'application en local avec la nouvelle base
2. ✅ Mettre à jour les variables d'environnement Vercel
3. ✅ Déployer sur Vercel
4. ✅ Supprimer l'ancienne base (si désiré)

---

**Besoin d'aide?** Suivez ce guide étape par étape et partagez les messages d'erreur si vous rencontrez des problèmes.
