# Contrats API - Plateforme Associative En Toute Franchise

## Architecture Générale

### Stack Technique
- **Frontend**: React 18 avec React Router
- **Backend**: FastAPI (Python)
- **Base de données**: MongoDB
- **Authentification**: JWT

## 1. Authentification

### POST /api/auth/register
**Inscription d'un nouvel utilisateur**

Request:
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "businessName": "string",
  "businessType": "string",
  "membershipType": "individual|professional|professional_plus|association"
}
```

Response:
```json
{
  "message": "Inscription réussie",
  "userId": "string"
}
```

### POST /api/auth/login
**Connexion utilisateur**

Request:
```json
{
  "email": "string",
  "password": "string"
}
```

Response:
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "user|admin"
  }
}
```

## 2. Profil Utilisateur

### GET /api/users/profile
**Récupérer le profil de l'utilisateur connecté**

Headers: `Authorization: Bearer {token}`

Response:
```json
{
  "id": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "businessName": "string",
  "businessType": "string",
  "membershipType": "string",
  "membershipStatus": "active|expired",
  "membershipStartDate": "date",
  "membershipEndDate": "date"
}
```

### PUT /api/users/profile
**Mettre à jour le profil**

Request: (même structure que GET avec champs modifiables)

## 3. Assistant IA

### POST /api/ai/conversations
**Créer une nouvelle conversation**

Headers: `Authorization: Bearer {token}`

Response:
```json
{
  "conversationId": "string",
  "title": "Nouvelle conversation",
  "createdAt": "date"
}
```

### GET /api/ai/conversations
**Récupérer toutes les conversations de l'utilisateur**

Response:
```json
[
  {
    "id": "string",
    "title": "string",
    "messagesCount": number,
    "lastMessage": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
]
```

### POST /api/ai/conversations/{conversationId}/messages
**Envoyer un message à l'IA**

Request:
```json
{
  "content": "string"
}
```

Response:
```json
{
  "userMessage": {
    "id": "string",
    "role": "user",
    "content": "string",
    "timestamp": "date"
  },
  "aiMessage": {
    "id": "string",
    "role": "assistant",
    "content": "string",
    "timestamp": "date"
  }
}
```

### GET /api/ai/conversations/{conversationId}/messages
**Récupérer l'historique des messages**

Response:
```json
[
  {
    "id": "string",
    "role": "user|assistant",
    "content": "string",
    "timestamp": "date"
  }
]
```

## 4. Documents

### POST /api/documents/upload
**Upload un document**

Headers: `Authorization: Bearer {token}`
Content-Type: `multipart/form-data`

Request:
```
file: File
type: string (Contrat|Légal|Administratif|Assurance)
```

Response:
```json
{
  "id": "string",
  "name": "string",
  "size": "string",
  "type": "string",
  "uploadDate": "date",
  "status": "en cours"
}
```

### GET /api/documents
**Récupérer tous les documents de l'utilisateur**

Response:
```json
[
  {
    "id": "string",
    "name": "string",
    "size": "string",
    "type": "string",
    "uploadDate": "date",
    "status": "validé|en cours"
  }
]
```

### GET /api/documents/{documentId}
**Télécharger un document**

Response: File stream

### DELETE /api/documents/{documentId}
**Supprimer un document**

Response:
```json
{
  "message": "Document supprimé avec succès"
}
```

## 5. Ressources

### GET /api/resources
**Récupérer toutes les ressources disponibles**

Query params:
- `category`: string (optional)
- `search`: string (optional)

Response:
```json
[
  {
    "id": "string",
    "title": "string",
    "type": "document|guide|checklist",
    "category": "string",
    "format": "PDF|DOCX",
    "size": "string",
    "downloads": number
  }
]
```

### GET /api/resources/{resourceId}/download
**Télécharger une ressource**

Response: File stream

## 6. Abonnement & Paiements

### GET /api/subscriptions/current
**Récupérer l'abonnement actuel**

Response:
```json
{
  "membership": {
    "type": "string",
    "price": "string",
    "status": "active|expired",
    "startDate": "date",
    "endDate": "date"
  },
  "aiPlan": {
    "name": "string",
    "price": "string",
    "tokensUsed": number,
    "tokensLimit": number,
    "minutesUsed": number,
    "minutesLimit": number
  }
}
```

### GET /api/subscriptions/invoices
**Récupérer l'historique de facturation**

Response:
```json
[
  {
    "id": "string",
    "date": "date",
    "description": "string",
    "amount": "string",
    "status": "Payé|En attente"
  }
]
```

## 7. Contact

### POST /api/contact
**Envoyer un message de contact**

Request:
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "subject": "string",
  "message": "string"
}
```

Response:
```json
{
  "message": "Message envoyé avec succès"
}
```

## 8. Articles (Blog)

### GET /api/articles
**Récupérer les articles du blog**

Query params:
- `limit`: number (default: 10)
- `offset`: number (default: 0)
- `category`: string (optional)

Response:
```json
[
  {
    "id": "string",
    "title": "string",
    "excerpt": "string",
    "image": "string",
    "author": "string",
    "date": "date",
    "category": "string",
    "readTime": "string"
  }
]
```

## Collections MongoDB

### users
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique, indexed),
  password: String (hashed),
  phone: String,
  businessName: String,
  businessType: String,
  membershipType: String,
  membershipStatus: String,
  membershipStartDate: Date,
  membershipEndDate: Date,
  role: String (default: 'user'),
  createdAt: Date,
  updatedAt: Date
}
```

### ai_conversations
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref users),
  title: String,
  messagesCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### ai_messages
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId (ref ai_conversations),
  userId: ObjectId (ref users),
  role: String ('user' | 'assistant'),
  content: String,
  timestamp: Date
}
```

### documents
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref users),
  name: String,
  originalName: String,
  size: String,
  type: String,
  status: String,
  uploadDate: Date,
  filePath: String
}
```

### resources
```javascript
{
  _id: ObjectId,
  title: String,
  type: String,
  category: String,
  format: String,
  size: String,
  downloads: Number,
  filePath: String,
  createdAt: Date
}
```

### subscriptions
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref users),
  planType: String,
  status: String,
  startDate: Date,
  endDate: Date,
  aiPlan: {
    name: String,
    tokensUsed: Number,
    tokensLimit: Number,
    minutesUsed: Number,
    minutesLimit: Number
  }
}
```

### invoices
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref users),
  description: String,
  amount: String,
  status: String,
  date: Date
}
```

### contact_messages
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  subject: String,
  message: String,
  status: String ('new' | 'processed'),
  createdAt: Date
}
```

### articles
```javascript
{
  _id: ObjectId,
  title: String,
  excerpt: String,
  content: String,
  image: String,
  author: String,
  category: String,
  readTime: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Données Mockées à Remplacer

### Frontend (mockData.js)
- **stats**: Statistiques de la page d'accueil
- **services**: Liste des services
- **membershipPlans**: Plans d'adhésion (liens HelloAsso mockés)
- **aiPlans**: Plans d'assistance IA
- **digitalServices**: Services digitaux
- **testimonials**: Témoignages clients
- **videos**: Vidéos YouTube
- **articles**: Articles de blog
- **resources**: Ressources téléchargeables
- **contactInfo**: Informations de contact
- **mockConversations**: Conversations IA de démonstration
- **mockMessages**: Messages IA de démonstration

## Intégrations à Ajouter Plus Tard

1. **OpenAI API** - Pour l'assistant IA juridique
2. **Stripe** - Pour les paiements de services digitaux
3. **HelloAsso API** - Pour synchroniser les adhésions
4. **WordPress API** - Pour récupérer les articles du blog
5. **Service d'email** - Pour les notifications et confirmations
6. **Service de stockage** - AWS S3 ou équivalent pour les documents

## Notes d'Implémentation

1. Toutes les routes protégées nécessitent un token JWT valide
2. Les mots de passe sont hashés avec bcrypt
3. Les fichiers uploadés sont stockés localement dans `/app/backend/uploads/`
4. Les tokens expirent après 7 jours
5. La pagination est recommandée pour les listes (articles, documents, etc.)
6. Les erreurs sont retournées au format JSON standard:
```json
{
  "error": "string",
  "message": "string",
  "statusCode": number
}
```
