# Module Cohésion - Guide d'utilisation

## Description

Le module **Cohésion** permet de gérer une base de contacts et d'envoyer des campagnes d'emails via **Resend API** (compatible avec les hébergeurs cloud comme Render). Ce module est accessible uniquement aux administrateurs.

## Fonctionnalités

### 1. Gestion des contacts

- **Import CSV** : Importez vos contacts depuis un fichier CSV
- **Ajout manuel** : Créez des contacts un par un
- **Tags** : Organisez vos contacts avec des tags personnalisés
- **Statuts** : Gérez les statuts (actif, désabonné, bounced, invalide)

### 2. Validation des emails

Le système valide automatiquement les emails :
- ✅ Vérification du format syntaxique
- ✅ Détection des domaines jetables (yopmail, mailinator, etc.)
- ✅ Détection des patterns invalides (test@, @example.com, etc.)
- ✅ Vérification optionnelle des domaines via DNS-over-HTTPS

### 3. Gestion des doublons

- Détection automatique des doublons lors de l'import
- Outil de suppression des doublons existants
- Comparaison avec la base existante lors de nouveaux imports

### 4. Campagnes d'emails

- Création de campagnes avec sujet et contenu HTML
- Ciblage par tags
- Prévisualisation avec personnalisation
- Envoi de test avant envoi massif
- Suivi des envois (succès/échecs)

## Configuration Resend API

### Pourquoi Resend ?

Les hébergeurs cloud comme **Render bloquent les ports SMTP** (25, 465, 587) pour éviter les abus. Resend utilise une API HTTP qui fonctionne partout.

### Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` du backend :

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
MAIL_FROM=En Toute Franchise <noreply@votre-domaine.com>
```

### Obtenir une clé API Resend

1. Créez un compte sur https://resend.com
2. Allez dans **API Keys**
3. Cliquez sur **Create API Key**
4. Copiez la clé générée
5. Utilisez cette clé dans `RESEND_API_KEY`

### Configuration du domaine d'envoi

Pour envoyer depuis votre propre domaine :

1. Dans Resend, allez dans **Domains**
2. Ajoutez votre domaine (ex: en-toutefranchise.com)
3. Configurez les enregistrements DNS demandés
4. Une fois vérifié, mettez à jour `MAIL_FROM`

⚠️ **Sans domaine vérifié**, vous pouvez uniquement envoyer depuis `onboarding@resend.dev`

## Format du fichier CSV

Le fichier CSV doit contenir au minimum une colonne `email`. Les colonnes reconnues :

| Colonne | Alias acceptés |
|---------|----------------|
| email | email, mail |
| Prénom | prenom, firstname, first_name |
| Nom | nom, name, lastname, last_name |
| Téléphone | telephone, phone, tel |
| Entreprise | entreprise, company, societe |

### Exemple de CSV

```csv
email,prenom,nom,entreprise
jean.dupont@example.com,Jean,Dupont,Boulangerie Dupont
marie.martin@example.com,Marie,Martin,Restaurant Le Bon Goût
```

## Variables de personnalisation

Dans les campagnes, utilisez ces variables pour personnaliser le contenu :

- `{email}` - Email du contact
- `{firstName}` - Prénom
- `{lastName}` - Nom
- `{company}` - Entreprise

### Exemple de template

```html
<h1>Bonjour {firstName} !</h1>
<p>Nous avons le plaisir de vous informer des nouveautés de notre association.</p>
<p>Cordialement,<br>L'équipe En Toute Franchise</p>
```

## API Endpoints

### Contacts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/cohesion/contacts` | Liste des contacts (paginé) |
| POST | `/api/cohesion/contacts` | Créer un contact |
| PUT | `/api/cohesion/contacts/{id}` | Modifier un contact |
| DELETE | `/api/cohesion/contacts/{id}` | Supprimer un contact |
| POST | `/api/cohesion/import` | Importer un CSV |

### Outils

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/cohesion/find-duplicates` | Trouver les doublons |
| POST | `/api/cohesion/remove-duplicates` | Supprimer les doublons |
| POST | `/api/cohesion/clean-invalid` | Marquer les emails invalides |
| POST | `/api/cohesion/validate-emails` | Valider une liste d'emails |

### Campagnes

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/cohesion/campaigns` | Liste des campagnes |
| POST | `/api/cohesion/campaigns` | Créer une campagne |
| PUT | `/api/cohesion/campaigns/{id}` | Modifier une campagne |
| DELETE | `/api/cohesion/campaigns/{id}` | Supprimer une campagne |
| POST | `/api/cohesion/campaigns/{id}/preview` | Prévisualiser |
| POST | `/api/cohesion/campaigns/{id}/test` | Envoyer un test |
| POST | `/api/cohesion/campaigns/{id}/send` | Lancer l'envoi |

### Tags & Statistiques

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/cohesion/tags` | Liste des tags |
| POST | `/api/cohesion/contacts/{id}/tags` | Ajouter des tags |
| POST | `/api/cohesion/contacts/bulk-tags` | Tags en masse |
| GET | `/api/cohesion/stats` | Statistiques générales |
| GET | `/api/cohesion/email-status` | État Resend API |

## Bonnes pratiques

1. **Testez toujours avant d'envoyer** : Utilisez la fonction "Envoyer un test"
2. **Nettoyez régulièrement** : Supprimez les doublons et emails invalides
3. **Utilisez les tags** : Pour cibler vos campagnes
4. **Respectez le RGPD** : Assurez-vous d'avoir le consentement
5. **Évitez le spam** : Espacez vos campagnes (0.5s entre chaque email)

## Limites Resend

Resend impose des limites selon votre plan :

| Plan | Emails/mois | Emails/jour |
|------|-------------|-------------|
| **Gratuit** | 3 000 | 100 |
| **Pro** | 50 000+ | Illimité |

Pour plus de détails : https://resend.com/pricing
