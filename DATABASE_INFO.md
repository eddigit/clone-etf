# 🗄️ Informations Base de Données - En Toute Franchise

## Connexion MongoDB

### Environnement de Développement
```
URL: mongodb://localhost:27017
Base de données: test_database
Port: 27017
Type: MongoDB (local)
```

### Connexion depuis Python (Backend)
```python
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = "mongodb://localhost:27017"
client = AsyncIOMotorClient(mongo_url)
db = client["test_database"]
```

### Connexion avec MongoDB Compass
```
Connection String: mongodb://localhost:27017/test_database
```

### Connexion en ligne de commande
```bash
mongosh mongodb://localhost:27017/test_database
```

---

## 📊 Schéma de Base de Données

### Collection: `users`
**Description**: Utilisateurs de la plateforme

```javascript
{
  _id: ObjectId,
  id: String (UUID),              // ID unique utilisateur
  email: String (unique, indexed), // Email de connexion
  password: String,                // Mot de passe hashé (bcrypt)
  firstName: String,               // Prénom
  lastName: String,                // Nom
  phone: String,                   // Téléphone (optionnel)
  businessName: String,            // Nom entreprise (optionnel)
  businessType: String,            // Type d'activité (optionnel)
  membershipType: String,          // "individual" | "professional" | "professional_plus" | "association"
  membershipStatus: String,        // "active" | "expired"
  membershipStartDate: Date,       // Date début adhésion
  membershipEndDate: Date,         // Date fin adhésion
  role: String,                    // "user" | "admin"
  createdAt: Date,                 // Date création compte
  updatedAt: Date                  // Date dernière modification
}
```

**Index:**
- `email` (unique)
- `id` (unique)

---

### Collection: `ai_conversations`
**Description**: Conversations avec l'assistant IA

```javascript
{
  _id: ObjectId,
  id: String (UUID),              // ID unique conversation
  userId: String,                  // Référence vers users.id
  title: String,                   // Titre de la conversation
  messagesCount: Number,           // Nombre de messages
  createdAt: Date,                 // Date création
  updatedAt: Date                  // Date dernière activité
}
```

**Index:**
- `userId`
- `id` (unique)

---

### Collection: `ai_messages`
**Description**: Messages dans les conversations IA

```javascript
{
  _id: ObjectId,
  id: String (UUID),              // ID unique message
  conversationId: String,          // Référence vers ai_conversations.id
  userId: String,                  // Référence vers users.id
  role: String,                    // "user" | "assistant"
  content: String,                 // Contenu du message
  timestamp: Date                  // Date/heure du message
}
```

**Index:**
- `conversationId`
- `userId`

---

### Collection: `documents`
**Description**: Documents uploadés par les membres

```javascript
{
  _id: ObjectId,
  id: String (UUID),              // ID unique document
  userId: String,                  // Référence vers users.id
  name: String,                    // Nom du fichier
  originalName: String,            // Nom original du fichier
  size: String,                    // Taille (ex: "2.4 MB")
  type: String,                    // "Contrat" | "Légal" | "Administratif" | "Assurance"
  status: String,                  // "en cours" | "validé"
  uploadDate: Date,                // Date d'upload
  filePath: String                 // Chemin du fichier sur le serveur
}
```

**Index:**
- `userId`
- `id` (unique)

**Stockage physique:** `/app/backend/uploads/`

---

### Collection: `resources`
**Description**: Ressources (guides, modèles) disponibles pour les membres

```javascript
{
  _id: ObjectId,
  id: String (UUID),              // ID unique ressource
  title: String,                   // Titre de la ressource
  type: String,                    // "document" | "guide" | "checklist"
  category: String,                // "Modèles juridiques" | "Guides pratiques" | "Aide administrative"
  format: String,                  // "PDF" | "DOCX"
  size: String,                    // Taille (ex: "2.3 MB")
  downloads: Number,               // Nombre de téléchargements
  filePath: String,                // Chemin du fichier
  createdAt: Date                  // Date d'ajout
}
```

**Index:**
- `category`
- `id` (unique)

---

### Collection: `subscriptions`
**Description**: Abonnements aux plans IA

```javascript
{
  _id: ObjectId,
  id: String (UUID),              // ID unique abonnement
  userId: String,                  // Référence vers users.id
  planType: String,                // "essential" | "complete"
  status: String,                  // "active" | "expired" | "cancelled"
  startDate: Date,                 // Date début
  endDate: Date,                   // Date fin
  aiPlan: {
    name: String,                  // Nom du plan
    tokensUsed: Number,            // Tokens consommés
    tokensLimit: Number,           // Limite de tokens
    minutesUsed: Number,           // Minutes utilisées
    minutesLimit: Number           // Limite de minutes
  }
}
```

**Index:**
- `userId`
- `id` (unique)

---

### Collection: `invoices`
**Description**: Historique de facturation

```javascript
{
  _id: ObjectId,
  id: String (UUID),              // ID unique facture
  userId: String,                  // Référence vers users.id
  description: String,             // Description de la facture
  amount: String,                  // Montant (ex: "50€")
  status: String,                  // "Payé" | "En attente" | "Annulé"
  date: Date                       // Date de la facture
}
```

**Index:**
- `userId`
- `date`

---

### Collection: `contact_messages`
**Description**: Messages envoyés via le formulaire de contact

```javascript
{
  _id: ObjectId,
  id: String (UUID),              // ID unique message
  name: String,                    // Nom complet
  email: String,                   // Email du contact
  phone: String,                   // Téléphone (optionnel)
  subject: String,                 // Sujet du message
  message: String,                 // Contenu du message
  status: String,                  // "new" | "processed"
  createdAt: Date                  // Date de réception
}
```

**Index:**
- `status`
- `createdAt`

---

### Collection: `articles`
**Description**: Articles du blog

```javascript
{
  _id: ObjectId,
  id: String (UUID),              // ID unique article
  title: String,                   // Titre de l'article
  excerpt: String,                 // Extrait / résumé
  content: String,                 // Contenu complet
  image: String,                   // URL de l'image
  author: String,                  // Nom de l'auteur
  category: String,                // "Juridique" | "Défense" | "Fiscalité" | "Actualités"
  readTime: String,                // Temps de lecture (ex: "8 min")
  createdAt: Date,                 // Date de publication
  updatedAt: Date                  // Date de modification
}
```

**Index:**
- `category`
- `createdAt`

---

## 📝 Données de Test Insérées

### Utilisateur Test
```
Email: test@example.fr
Mot de passe: password123
Rôle: user
Type: professional
```

### Administrateur
```
Email: admin@example.fr
Mot de passe: admin123
Rôle: admin
```

### Articles (2 articles de blog)
### Ressources (2 ressources)
### Factures (1 facture pour l'utilisateur test)

---

## 🔧 Commandes Utiles

### Lister toutes les collections
```bash
mongosh mongodb://localhost:27017/test_database --eval "db.getCollectionNames()"
```

### Compter les documents dans une collection
```bash
mongosh mongodb://localhost:27017/test_database --eval "db.users.countDocuments()"
```

### Voir tous les utilisateurs
```bash
mongosh mongodb://localhost:27017/test_database --eval "db.users.find().pretty()"
```

### Supprimer toutes les données (ATTENTION!)
```bash
mongosh mongodb://localhost:27017/test_database --eval "db.dropDatabase()"
```

### Réinitialiser avec données de test
```bash
cd /app/backend
python seed_data.py
```

---

## 🔐 Sécurité

### Mots de passe
- Hashés avec **bcrypt** (salt rounds: 12)
- Jamais stockés en clair
- Vérification via `bcrypt.checkpw()`

### Tokens JWT
- Algorithme: HS256
- Durée de vie: 7 jours
- Secret: JWT_SECRET_KEY (dans .env)
- Stocké côté client dans localStorage

### Protection des Routes
- Routes `/api/auth/*` : Publiques
- Routes `/api/users/*` : Authentification requise
- Routes `/api/ai/*` : Authentification requise
- Routes `/api/documents/*` : Authentification requise
- Routes `/api/resources/*` : Authentification requise
- Routes `/api/subscriptions/*` : Authentification requise

---

## 📊 Statistiques Actuelles

Pour voir les statistiques en temps réel:

```bash
mongosh mongodb://localhost:27017/test_database
```

Puis dans le shell MongoDB:
```javascript
// Nombre d'utilisateurs
db.users.countDocuments()

// Nombre de conversations IA
db.ai_conversations.countDocuments()

// Nombre de documents uploadés
db.documents.countDocuments()

// Nombre d'articles
db.articles.countDocuments()

// Nombre de ressources
db.resources.countDocuments()
```

---

## 🔄 Backup et Restauration

### Créer un backup
```bash
mongodump --uri="mongodb://localhost:27017/test_database" --out=/backup/etf-$(date +%Y%m%d)
```

### Restaurer un backup
```bash
mongorestore --uri="mongodb://localhost:27017/test_database" /backup/etf-20250122
```

---

## 📱 Accès via API

### Authentification
```bash
# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.fr","password":"password123"}'

# Retourne un token JWT
```

### Utiliser le token
```bash
# Récupérer le profil
curl -X GET http://localhost:8001/api/users/profile \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

---

## 🆘 Support

Pour toute question sur la base de données:
1. Vérifier les logs: `tail -f /var/log/supervisor/backend.err.log`
2. Consulter la documentation API: http://localhost:8001/docs
3. Voir le fichier contracts.md pour les détails des API

---

**Dernière mise à jour:** 22 décembre 2025
