# 📱 Intégration Réseaux Sociaux - En Toute Franchise

Ce guide explique comment configurer l'intégration des réseaux sociaux pour publier automatiquement les articles du site sur Facebook, LinkedIn et X (Twitter).

## 🎯 Fonctionnalités

- ✅ **Publication automatique** des articles lors de leur publication
- ✅ **Partage manuel** d'articles déjà publiés
- ✅ **Multi-plateformes** : Facebook, LinkedIn, X (Twitter), Instagram
- ✅ **Interface admin** pour sélectionner les plateformes

---

## 📋 Informations de Connexion

| Plateforme | Email/Username | Mot de passe |
|------------|----------------|--------------|
| **Facebook** | en.toutefranchise@wanadoo.fr | ClauMarMic13700!! |
| **LinkedIn** | en.toutefranchise@wanadoo.fr | ClauMarMic13700??? |
| **X (Twitter)** | ClauMarMic13 | 694287 |

---

## 🔧 Configuration Facebook

### Étape 1 : Créer une Application Facebook

1. Aller sur [Facebook Developers](https://developers.facebook.com/)
2. Se connecter avec le compte : `en.toutefranchise@wanadoo.fr`
3. Cliquer sur "Mes applications" → "Créer une application"
4. Choisir "Business" comme type d'application
5. Nommer l'application : "ETF Site Integration"

### Étape 2 : Récupérer le Page ID

1. Aller sur la Page Facebook "En Toute Franchise"
2. Cliquer sur "Paramètres" → "Transparence de la Page"
3. Le **Page ID** est affiché (numéro à 15-16 chiffres)
4. L'ajouter dans `.env` : `FACEBOOK_PAGE_ID=votre_page_id`

### Étape 3 : Générer un Access Token Permanent

#### Option A : Via Graph API Explorer (Recommandé pour tests)

1. Aller sur [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Sélectionner votre application
3. Cliquer sur "Obtenir un token d'accès utilisateur"
4. Cocher les permissions :
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
5. Cliquer sur "Générer le token d'accès"
6. Convertir en token de page :
   - Dans le Graph Explorer, faire la requête : `me/accounts`
   - Copier le `access_token` de votre page

#### Option B : Token Longue Durée (Production)

1. D'abord, obtenir un token court terme via Graph Explorer
2. Aller sur : `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}`
3. Ensuite, obtenir le token de page permanent :
   `https://graph.facebook.com/v18.0/{PAGE_ID}?fields=access_token&access_token={LONG_LIVED_USER_TOKEN}`

4. Ajouter dans `.env` : `FACEBOOK_ACCESS_TOKEN=votre_token`

### ⚠️ Important pour Facebook

- Les tokens utilisateur expirent après ~60 jours
- Les tokens de page n'expirent PAS si générés depuis un token longue durée
- Tester avec : `curl "https://graph.facebook.com/v18.0/{PAGE_ID}?access_token={TOKEN}"`

---

## 💼 Configuration LinkedIn

### Étape 1 : Créer une Application LinkedIn

1. Aller sur [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Se connecter avec : `en.toutefranchise@wanadoo.fr`
3. Cliquer sur "Create app"
4. Remplir :
   - **App name** : ETF Integration
   - **LinkedIn Page** : Sélectionner "En Toute Franchise"
   - **App logo** : Uploader le logo ETF
   - **Legal agreement** : Cocher la case
5. Cliquer sur "Create app"

### Étape 2 : Demander les Produits API

Dans l'onglet "Products" :

1. Demander **"Share on LinkedIn"** (pour poster)
2. Demander **"Sign In with LinkedIn using OpenID Connect"** (optionnel)
3. Attendre l'approbation (peut prendre quelques heures)

### Étape 3 : Récupérer l'Organization ID

1. Aller sur la page LinkedIn de l'entreprise
2. L'URL est du type : `https://www.linkedin.com/company/12345678/`
3. Le numéro après `/company/` est l'**Organization ID**
4. Ajouter dans `.env` : `LINKEDIN_ORGANIZATION_ID=12345678`

### Étape 4 : Générer un Access Token

#### Méthode OAuth 2.0 (Recommandée)

1. Dans votre app LinkedIn, aller dans "Auth"
2. Noter :
   - **Client ID** : `xxxxxxxxxxxxxx`
   - **Client Secret** : `xxxxxxxxxxxxxxxx`
3. Ajouter un **Redirect URL** : `https://www.entoutefranchise.org/auth/linkedin/callback`

4. Générer le lien d'autorisation :
```
https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope=w_member_social%20w_organization_social%20r_organization_social
```

5. Après autorisation, échanger le code contre un token :
```bash
curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
  -d "grant_type=authorization_code" \
  -d "code={AUTH_CODE}" \
  -d "client_id={CLIENT_ID}" \
  -d "client_secret={CLIENT_SECRET}" \
  -d "redirect_uri={REDIRECT_URI}"
```

6. Ajouter dans `.env` : `LINKEDIN_ACCESS_TOKEN=votre_token`

### ⚠️ Important pour LinkedIn

- Les tokens expirent après **60 jours**
- Implémenter un système de refresh token pour la production
- Scopes nécessaires : `w_organization_social` (poster en tant qu'organisation)

---

## 🐦 Configuration X (Twitter)

### Étape 1 : Créer un Compte Développeur

1. Aller sur [Twitter Developer Portal](https://developer.twitter.com/)
2. Se connecter avec le compte : **ClauMarMic13**
3. S'inscrire au "Developer Portal"
4. Choisir le plan **Free** (suffisant pour les publications)

### Étape 2 : Créer un Projet et une Application

1. Créer un nouveau projet : "ETF Website"
2. Créer une application dans ce projet : "ETF Posts"
3. Noter les clés générées

### Étape 3 : Générer les Tokens

Dans "Keys and tokens" :

1. **API Key** → `TWITTER_API_KEY`
2. **API Key Secret** → `TWITTER_API_SECRET`
3. Générer **Access Token and Secret** :
   - `TWITTER_ACCESS_TOKEN`
   - `TWITTER_ACCESS_TOKEN_SECRET`
4. Générer **Bearer Token** → `TWITTER_BEARER_TOKEN`

### Étape 4 : Configurer les Permissions

1. Aller dans "User authentication settings"
2. Activer "Read and Write" permissions
3. Type : "Web App"
4. Callback URL : `https://www.entoutefranchise.org/auth/twitter/callback`

---

## 📸 Configuration Instagram (Optionnel)

Instagram nécessite un **compte Business** ou **Creator** lié à une Page Facebook.

### Prérequis

1. Avoir un compte Instagram Business
2. Le lier à la Page Facebook "En Toute Franchise"

### Étape 1 : Récupérer l'Account ID

Via Graph API :
```
GET /{page-id}?fields=instagram_business_account&access_token={PAGE_TOKEN}
```

### Étape 2 : Configurer

```env
INSTAGRAM_ACCOUNT_ID=votre_instagram_id
INSTAGRAM_ACCESS_TOKEN=même_token_que_facebook
```

### ⚠️ Limitations Instagram

- Nécessite **toujours** une image
- Les liens ne sont **PAS cliquables** dans les posts
- Recommandé de mentionner "Lien dans la bio"

---

## 🧪 Tester la Configuration

### Vérifier les plateformes configurées

Dans l'admin, aller sur **Gestion du Blog**. Les plateformes configurées apparaissent avec une coche verte.

### Test via API

```bash
# Vérifier les plateformes configurées
curl -H "Authorization: Bearer {ADMIN_TOKEN}" \
  https://clone-etf.onrender.com/api/admin/social-media/platforms
```

### Test de publication

1. Créer un article de test
2. Le publier
3. Cocher "Partager sur les réseaux sociaux"
4. Sélectionner les plateformes
5. Sauvegarder

---

## 🔄 Workflow de Publication

### Publication Automatique

1. Admin crée/édite un article
2. Coche "Partager sur les réseaux sociaux"
3. Sélectionne les plateformes (Facebook, LinkedIn, X)
4. Met le statut à "Publié"
5. Sauvegarde → Publication automatique sur les réseaux

### Publication Manuelle (article existant)

1. Sur un article publié, cliquer sur l'icône **Partager** (📤)
2. Sélectionner les plateformes
3. Cliquer sur "Publier maintenant"

---

## 📊 Format des Publications

### Facebook
```
📰 [Titre de l'article]

[Résumé de l'article]

👉 Lire l'article : https://www.entoutefranchise.org/blog/[slug]
```
+ Image si disponible

### LinkedIn
```
📰 [Titre de l'article]

[Résumé de l'article]

👉 Lire l'article complet

[Carte de prévisualisation avec lien]
```

### X (Twitter)
```
📰 [Titre de l'article]

[Résumé (tronqué à 280 caractères)]

👉 [URL]
```

---

## 🛠️ Résolution de Problèmes

### Erreur "Facebook non configuré"
- Vérifier que `FACEBOOK_PAGE_ID` et `FACEBOOK_ACCESS_TOKEN` sont définis
- Tester le token avec Graph API Explorer

### Erreur "LinkedIn non configuré"
- Vérifier que `LINKEDIN_ORGANIZATION_ID` et `LINKEDIN_ACCESS_TOKEN` sont définis
- Le token a peut-être expiré (60 jours)

### Erreur "Token expiré"
- Regénérer un nouveau token avec les étapes ci-dessus
- Pour Facebook : utiliser un token de page permanent

### Les posts ne s'affichent pas
- Vérifier que l'app a les permissions nécessaires
- Pour LinkedIn : vérifier que le compte est bien admin de la page

---

## 📅 Maintenance

### Tokens à renouveler

| Plateforme | Durée de vie | Action |
|------------|--------------|--------|
| Facebook (Page Token) | Permanent* | Aucune si bien configuré |
| LinkedIn | 60 jours | Refresh token ou re-générer |
| X (Twitter) | Permanent | Aucune |

*Token de page permanent si généré depuis un token longue durée

### Checklist mensuelle

- [ ] Vérifier que les posts sont bien publiés
- [ ] Tester le endpoint `/api/admin/social-media/platforms`
- [ ] Renouveler le token LinkedIn si nécessaire

---

## 📞 Support

En cas de problème :
1. Vérifier les logs serveur pour les erreurs détaillées
2. Tester les APIs individuellement avec curl
3. Contacter l'équipe technique : coachdigitalparis@gmail.com
