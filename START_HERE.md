# ⚡ DÉMARRAGE RAPIDE - 3 ÉTAPES

## 📋 Étape 1: Créer MongoDB Atlas (5 min)

1. **Aller sur**: https://www.mongodb.com/cloud/atlas/register
2. **S'inscrire** (gratuit, ou avec Google)
3. **Créer un cluster M0** (gratuit)
4. **Créer un utilisateur**:
   - Username: `etf_admin`
   - Password: (générer et noter)
5. **Autoriser IPs**: 0.0.0.0/0 (Allow from Anywhere)
6. **Copier l'URL**: 
   ```
   mongodb+srv://etf_admin:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## 📋 Étape 2: Configurer backend/.env

Modifiez le fichier `backend/.env`:

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

## 📋 Étape 3: Initialiser le Projet

```powershell
cd backend
python init_project.py
```

✅ **C'est tout !** Votre base est prête avec:
- 2 utilisateurs (test + admin)
- 3 ressources
- 2 articles
- 8 collections configurées

---

## 🚀 Lancer l'Application

```powershell
# À la racine du projet
.\start-local.ps1
```

Ou manuellement:

```powershell
# Backend
cd backend
python -m uvicorn server:app --reload --port 8001

# Frontend (nouveau terminal)
cd frontend
npm start
```

---

## 📤 Exporter la Base (Backup)

**Double-cliquez sur**: `EXPORT_DB.ps1` ou `EXPORT_DB.bat`

Ou en ligne de commande:
```powershell
cd backend
python export_db.py
```

Les données seront dans `backend/db_export/`

---

## 🎯 Accès

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

**Comptes**:
- User: test@example.fr / password123
- Admin: admin@example.fr / admin123

---

## ✅ Scripts Disponibles

| Script | Description |
|--------|-------------|
| `init_project.py` | Initialise la base (à faire 1 fois) |
| `test_connection.py` | Teste la connexion |
| `export_db.py` | Exporte la base |
| `import_db.py` | Importe une base exportée |
| `seed_data.py` | Ajoute des données de test |

---

**C'est prêt ! 🎉**
