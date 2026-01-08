# Instructions pour résoudre le problème de compatibilité Python 3.14

## Problème
Le backend utilise Python 3.14 beta qui n'est pas compatible avec Pydantic/FastAPI.

## Solution recommandée

### Option 1: Recréer l'environnement virtuel avec Python 3.12

```powershell
# Supprimer l'ancien environnement
Remove-Item -Recurse -Force .venv

# Installer Python 3.12 si pas déjà installé
# Télécharger depuis https://www.python.org/downloads/

# Créer un nouvel environnement avec Python 3.12
py -3.12 -m venv .venv

# Activer l'environnement
.\.venv\Scripts\Activate.ps1

# Installer les dépendances
pip install -r backend\requirements.txt
pip install uvicorn[standard]
```

### Option 2: Utiliser l'environnement Python système (si version stable)

```powershell
# Vérifier la version Python système
python --version

# Si c'est Python 3.11 ou 3.12, recréer le venv
Remove-Item -Recurse -Force .venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
pip install uvicorn[standard]
```

## Après résolution

Une fois l'environnement recrée avec une version stable de Python :

```powershell
# Lancer le backend
cd backend
..\.venv\Scripts\python.exe -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Le serveur devrait démarrer sur http://localhost:8001

## Test de la connexion HelloAsso

Le script de test a déjà réussi :
```powershell
..\.venv\Scripts\python.exe backend\test_helloasso.py
```

Résultats : ✓ 5/5 tests réussis

## Endpoints admin disponibles

Une fois le serveur lancé, vous pourrez accéder aux endpoints suivants :

- `GET /api/admin/helloasso/status` - Statut de connexion HelloAsso
- `GET /api/admin/helloasso/forms` - Liste des formulaires
- `GET /api/admin/helloasso/members` - Liste des adhérents
- `POST /api/admin/helloasso/sync` - Synchroniser les adhérents
- `GET /api/admin/stats` - Statistiques admin
- `GET /api/admin/members` - Liste des membres

Documentation API interactive : http://localhost:8001/docs
