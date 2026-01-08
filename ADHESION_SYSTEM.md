# Système d'Adhésion - En Toute Franchise

## Vue d'ensemble

Système complet de gestion des adhésions avec 4 types d'adhésion, génération de PDF et intégration HelloAsso pour les paiements.

## Types d'adhésion

### 1. Particuliers (individual)
- **Montant**: 10€ à 50€ (choix libre)
- **Cible**: Consommateurs et individus
- **Avantages**:
  - Accès aux ressources et retours d'expérience
  - Newsletter mensuelle
  - Participation aux assemblées
  - Soutien aux actions collectives

### 2. Commerçants - Artisans (professional)
- **Montant**: 50€
- **Cible**: Professionnels du commerce et de l'artisanat (moins de 100m²)
- **Avantages**:
  - Orientation et accompagnement personnalisé
  - Accès à l'assistant IA
  - Partage de retours d'expérience
  - Orientation vers avocats partenaires
  - Ressources documentaires

### 3. Commerçants +100m² (professional_plus)
- **Montant**: 152.32€
- **Cible**: Commerces de plus de 100m²
- **Avantages**:
  - Accompagnement renforcé
  - Mise en relation avec avocats
  - Veille réglementaire
  - Accès prioritaire au réseau
  - Formation et partage

### 4. Associations (association)
- **Montant**: 152.32€
- **Cible**: Associations partenaires
- **Avantages**:
  - Partenariat privilégié
  - Actions conjointes
  - Partage de ressources
  - Coordination des initiatives

## Architecture

### Backend

#### Modèles (backend/models.py)
```python
- MemberData: Données du membre
- MembershipCreate: Création d'adhésion
- Membership: Adhésion complète
- MembershipResponse: Réponse API
```

#### Service PDF (backend/pdf_service.py)
- Génération automatique de bordereau d'adhésion 2 pages
- Utilisation de reportlab
- Mise en forme professionnelle
- Signature et tampon

#### Endpoints API (backend/server.py)

**POST /api/memberships**
- Crée une nouvelle adhésion
- Génère le PDF automatiquement
- Status: "pending" par défaut
- Retourne l'ID de l'adhésion

**GET /api/memberships/me**
- Liste toutes les adhésions de l'utilisateur connecté
- Triées par année décroissante

**GET /api/memberships/{id}**
- Récupère une adhésion spécifique
- Vérification propriétaire

**GET /api/memberships/{id}/pdf**
- Télécharge le PDF du bordereau
- Format: application/pdf
- Vérification propriétaire

**POST /api/webhooks/helloasso**
- Reçoit les notifications HelloAsso
- Met à jour le status: pending → paid
- Enregistre payment_id et order_id

### Frontend

#### Page d'adhésion (/adhesion)
**Composant**: `frontend/src/pages/Adhesion.jsx`

**Étape 1**: Choix du type d'adhésion
- Affichage des 4 cartes
- Design inspiré de l'image fournie
- Badge "Le plus populaire" sur professional

**Étape 2**: Formulaire
- Champs conditionnels selon le type
- Validation côté client
- Envoi vers l'API

**Champs du formulaire**:

Communs à tous:
- Nom*, Prénom*
- Email*, Téléphone*, Fax
- Adresse*, Code postal*, Ville*

Pour professional et professional_plus:
- RCS*
- Type d'activité* (Commerçant/Artisan)
- Activité détaillée*
- Date création commerce*
- Franchise (checkbox)
  - Statut franchise* (Actif/Ex)
  - Enseigne*

Pour association:
- Nom de l'association*
- SIRET*

Pour individual:
- Montant personnalisé (10-50€)

#### Dashboard Adhésions (/dashboard/adhesions)
**Composant**: `frontend/src/pages/dashboard/Adhesions.jsx`

**Fonctionnalités**:
- Liste des adhésions
- Affichage du statut (pending/paid/cancelled)
- Téléchargement du PDF
- Bouton paiement si pending
- Création nouvelle adhésion

**Statuts**:
- 🕐 **Pending**: En attente de paiement
- ✅ **Paid**: Payée et active
- ❌ **Cancelled**: Annulée

## Flux utilisateur

### Création d'adhésion

1. **Utilisateur** accède à `/adhesion`
2. **Sélection** du type d'adhésion
3. **Remplissage** du formulaire
4. **Validation** et envoi
5. **Backend** crée l'adhésion (status: pending)
6. **Backend** génère le PDF
7. **Redirection** vers HelloAsso (à implémenter)
8. **Paiement** sur HelloAsso
9. **Webhook** met à jour le status → paid
10. **Utilisateur** accède au PDF dans le dashboard

### Téléchargement du bordereau

1. **Utilisateur** va dans `/dashboard/adhesions`
2. **Affichage** de ses adhésions
3. **Clic** sur "Télécharger le bordereau"
4. **API** vérifie les droits
5. **Téléchargement** du PDF

## Intégration HelloAsso

### Configuration
```
HELLOASSO_CLIENT_ID=2da3102cc98d4d94b03bc89d8942f404
HELLOASSO_CLIENT_SECRET=pAQCRxGxIrGwoAIdSFB8wLqvSEPG/HxO
API: https://api.helloasso.com/v5
Token: https://api.helloasso.com/oauth2/token
Webhook: https://en-toutefranchise.com/api/webhooks/helloasso
```

### Formulaires HelloAsso
Créer 4 formulaires:
- `adhesion-2026-particuliers`
- `adhesion-2026-commercants-artisans`
- `adhesion-2026-entreprises`
- `adhesion-2026-associations`

### Mapping webhook
Le webhook identifie le type via `formSlug` et met à jour:
- Status: pending → paid
- payment_id
- helloasso_order_id

## Base de données

### Collection: memberships

```javascript
{
  id: "uuid",
  user_id: "user_uuid",
  year: 2026,
  status: "pending|paid|cancelled",
  amount: 152.32,
  membership_type: "individual|professional|professional_plus|association",
  payment_id: "helloasso_payment_id",
  helloasso_order_id: "helloasso_order_id",
  member_data: {
    nom: "Dupont",
    prenom: "Jean",
    email: "jean@example.com",
    telephone: "0612345678",
    fax: null,
    adresse_commerciale: "1 rue Example",
    code_postal: "75001",
    ville: "Paris",
    // Champs professionnels (si applicable)
    rcs: "123456789",
    type_activite: "commercant",
    activite_detail: "Boulangerie",
    date_creation_commerce: "2020-01-15",
    is_franchise: true,
    franchise_status: "actif",
    enseigne: "Boulangerie Paul",
    // Champs association (si applicable)
    nom_association: "Association ABC",
    siret: "12345678900012"
  },
  pdf_path: "backend/pdf_memberships/adhesion_uuid_20260108.pdf",
  pdf_generated_at: "2026-01-08T10:00:00Z",
  created_at: "2026-01-08T09:30:00Z",
  updated_at: "2026-01-08T10:15:00Z"
}
```

## Installation

### Backend

1. Installer les dépendances:
```bash
cd backend
pip install -r requirements.txt
```

2. Vérifier que reportlab est installé:
```bash
pip list | grep reportlab
```

3. Créer le dossier PDF:
```bash
mkdir -p backend/pdf_memberships
```

### Frontend

Aucune dépendance supplémentaire nécessaire.

## Tests

### Tester la création d'adhésion

```bash
# Démarrer le backend
cd backend
uvicorn server:app --reload --port 8001

# Dans un autre terminal, tester l'API
curl -X POST http://localhost:8001/api/memberships \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "membership_type": "professional",
    "amount": 50,
    "member_data": {
      "nom": "Test",
      "prenom": "User",
      "email": "test@example.com",
      "telephone": "0612345678",
      "adresse_commerciale": "1 rue Test",
      "code_postal": "75001",
      "ville": "Paris",
      "rcs": "123456789",
      "type_activite": "commercant",
      "activite_detail": "Test",
      "date_creation_commerce": "2020-01-01"
    }
  }'
```

### Tester le webhook HelloAsso

```bash
curl -X POST http://localhost:8001/api/webhooks/helloasso \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "Payment",
    "data": {
      "id": "test_order_123",
      "paymentId": "test_payment_456",
      "formSlug": "adhesion-2026-commercants-artisans",
      "amount": 5000,
      "payer": {
        "email": "test@example.com",
        "firstName": "Jean",
        "lastName": "Dupont"
      }
    }
  }'
```

## Routes frontend à ajouter à la Navbar

Ajouter dans la navigation:
```jsx
<Link to="/adhesion">Adhérer</Link>
```

Dans le dashboard:
```jsx
<Link to="/dashboard/adhesions">Mes adhésions</Link>
```

## TODO

- [ ] Intégrer les liens de paiement HelloAsso réels
- [ ] Configurer les 4 formulaires HelloAsso
- [ ] Tester le webhook en production
- [ ] Ajouter l'envoi d'email de confirmation
- [ ] Ajouter l'envoi d'email avec mot de passe temporaire
- [ ] Configurer le logo dans le PDF
- [ ] Compléter SIRET et RNA de l'association dans le PDF
- [ ] Ajouter la gestion des paiements échoués
- [ ] Implémenter le renouvellement automatique

## Support

Pour toute question:
- Email: en.toutefranchise@wanadoo.fr
- Téléphone: 06 09 78 09 53
