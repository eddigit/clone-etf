# Plateforme Associative En Toute Franchise

Plateforme web complète pour l'association En Toute Franchise, offrant des services d'accompagnement juridique, administratif et numérique à ses membres.

## 🎯 Fonctionnalités Principales

### Site Public
- ✅ Page d'accueil avec présentation de l'association
- ✅ Section services détaillés
- ✅ Blog avec articles juridiques
- ✅ Page contact avec formulaire
- ✅ Plans d'adhésion (Particuliers, Commerçants, Associations)
- ✅ Plans d'assistance IA optionnels

### Authentification
- ✅ Inscription utilisateur avec validation
- ✅ Connexion sécurisée (JWT)
- ✅ Gestion des rôles (user/admin)

### Espace Membre (Dashboard)
- ✅ Tableau de bord avec statistiques
- ✅ **Assistant IA Juridique 24/7** (réponses mockées, intégration OpenAI à venir)
- ✅ Gestion de documents (upload, liste, suppression)
- ✅ Bibliothèque de ressources (guides, modèles juridiques)
- ✅ Gestion d'abonnement et facturation
- ✅ Paramètres du profil

## 🏗️ Architecture Technique

### Stack
- **Frontend**: React 18 + React Router + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Python)
- **Base de données**: MongoDB
- **Authentification**: JWT avec bcrypt

### Structure des Dossiers
```
/app
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages publiques
│   │   ├── pages/dashboard/  # Pages du dashboard
│   │   └── mockData.js    # Données mockées
│   └── package.json
├── backend/               # API FastAPI
│   ├── server.py          # Routes principales
│   ├── models.py          # Modèles Pydantic
│   ├── auth_utils.py      # Utilitaires d'authentification
│   ├── seed_data.py       # Script de seed
│   └── requirements.txt
└── contracts.md          # Documentation API
```

## 🚀 Démarrage Rapide

### Prérequis
- Python 3.11+
- Node.js 18+
- MongoDB

### Installation et Lancement

Les services sont gérés par Supervisor et démarrent automatiquement.

#### Vérifier le statut
```bash
sudo supervisorctl status
```

#### Redémarrer les services
```bash
# Redémarrer le frontend
sudo supervisorctl restart frontend

# Redémarrer le backend
sudo supervisorctl restart backend

# Redémarrer tout
sudo supervisorctl restart all
```

### Accès à l'application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **Documentation API**: http://localhost:8001/docs

## 🔑 Comptes de Test

### Utilisateur Standard
- **Email**: test@example.fr
- **Mot de passe**: password123

### Administrateur
- **Email**: admin@example.fr
- **Mot de passe**: admin123

## 📊 Collections MongoDB

### Principales Collections
- `users` - Utilisateurs et profils
- `ai_conversations` - Conversations IA
- `ai_messages` - Messages IA
- `documents` - Documents uploadés
- `resources` - Ressources téléchargeables
- `subscriptions` - Abonnements
- `invoices` - Factures
- `articles` - Articles du blog
- `contact_messages` - Messages de contact

## 🔐 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Utilisateur (Protégé)
- `GET /api/users/profile` - Profil
- `PUT /api/users/profile` - Mise à jour profil

### Assistant IA (Protégé)
- `POST /api/ai/conversations` - Créer conversation
- `GET /api/ai/conversations` - Liste conversations
- `POST /api/ai/conversations/{id}/messages` - Envoyer message
- `GET /api/ai/conversations/{id}/messages` - Historique messages

### Documents (Protégé)
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Liste documents
- `DELETE /api/documents/{id}` - Supprimer document

### Ressources (Protégé)
- `GET /api/resources` - Liste ressources

### Abonnement (Protégé)
- `GET /api/subscriptions/current` - Abonnement actuel
- `GET /api/subscriptions/invoices` - Historique factures

### Public
- `POST /api/contact` - Envoyer message contact
- `GET /api/articles` - Liste articles blog

Voir `contracts.md` pour la documentation complète.

## 📦 Données Mockées

Les données suivantes sont actuellement mockées (frontend/src/mockData.js):

- Statistiques de l'association
- Liste des services
- Plans d'adhésion
- Témoignages clients
- Vidéos YouTube
- Articles de blog
- Ressources téléchargeables

### Assistant IA
⚠️ **Note importante**: L'assistant IA retourne actuellement des réponses mockées. L'intégration complète avec OpenAI nécessite:
1. Configuration de la clé API OpenAI
2. Mise à jour de la route `/api/ai/conversations/{id}/messages` dans `server.py`

## 🔄 Intégrations Futures

### À Configurer
1. **OpenAI API** - Assistant juridique IA
   - Nécessite: Clé API OpenAI
   - Fichier: `backend/server.py` (ligne ~220)

2. **Stripe** - Paiements services digitaux
   - Nécessite: Clés API Stripe (public & secret)

3. **HelloAsso API** - Synchronisation adhésions
   - Nécessite: Token API HelloAsso

4. **WordPress API** - Articles blog
   - Nécessite: URL API WordPress

5. **Service Email** - Notifications
   - Recommandé: SendGrid, AWS SES, ou Mailgun

6. **Stockage Fichiers** - Documents (optionnel)
   - Recommandé: AWS S3, Google Cloud Storage
   - Actuellement: Stockage local `/app/backend/uploads/`

## 🧪 Tests

### Backend
```bash
# Tests complets de l'API effectués
# Résultats: 15/15 tests passés ✅
# Voir: test_result.md
```

### Frontend
- Navigation: ✅ Fonctionnelle
- Authentification: ✅ Fonctionnelle
- Dashboard: ✅ Accessible
- Toutes les pages: ✅ Chargement correct

## 📝 Variables d'Environnement

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017/
DB_NAME=etf_platform
JWT_SECRET_KEY=your-secret-key-change-in-production
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

⚠️ **Important**: Ne modifiez pas ces URLs, elles sont préconfigurées pour l'environnement de développement.

## 🎨 Design & UI

- **Composants**: shadcn/ui (Radix UI)
- **Styles**: Tailwind CSS
- **Thème**: Design professionnel avec palette bleue
- **Responsive**: Optimisé mobile, tablette, desktop
- **Icônes**: Lucide React

## 🔒 Sécurité

- Mots de passe hashés (bcrypt)
- Tokens JWT avec expiration (7 jours)
- Routes protégées avec authentification
- CORS configuré
- Validation des données (Pydantic)

## 📈 État du Projet

### ✅ Complété
- Architecture complète frontend/backend
- Authentification & autorisation
- CRUD utilisateurs
- Système de conversations IA (structure)
- Gestion de documents
- Système de ressources
- Gestion abonnements & facturation
- Interface utilisateur complète
- Tests backend (100% réussite)

### 🚧 À Finaliser (avec APIs)
- Intégration OpenAI pour l'assistant IA
- Paiements Stripe
- Synchronisation HelloAsso
- Articles WordPress
- Notifications email

## 🤝 Support

Pour toute question ou problème:
- Email: assistance@entoutefranchise.fr
- Téléphone: 07 56 97 44 19

## 📄 Licence

© 2025 En Toute Franchise - Tous droits réservés
Association apolitique, libre et indépendante depuis 1994
