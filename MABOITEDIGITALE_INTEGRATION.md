# Configuration MaBoiteDigitale.com - Intégration ETF

## Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` du backend:

```bash
# ===================== MABOITEDIGITALE.COM =====================
# URL de l'API MaBoiteDigitale (production)
MABOITEDIGITALE_API_URL=https://maboitedigitale.com/api

# Clé API partenaire (fournie par MaBoiteDigitale)
MABOITEDIGITALE_API_KEY=votre_cle_api_ici

# Secret pour signature HMAC (fourni par MaBoiteDigitale)
MABOITEDIGITALE_SECRET=votre_secret_ici

# Identifiant partenaire ETF
MABOITEDIGITALE_PARTNER_ID=etf
```

## Endpoints disponibles

### Admin (authentification admin requise)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/admin/maboitedigitale/status` | Vérifier le statut de connexion |
| GET | `/api/admin/maboitedigitale/stats` | Statistiques du partenariat |
| GET | `/api/admin/maboitedigitale/config` | Configuration actuelle |
| PUT | `/api/admin/maboitedigitale/config` | Modifier la configuration |
| POST | `/api/admin/maboitedigitale/sync-member` | Synchroniser un membre |
| POST | `/api/admin/maboitedigitale/sync-all` | Synchroniser tous les membres |

### Utilisateur (authentification membre requise)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/maboitedigitale/sso` | Générer un token SSO pour connexion |
| GET | `/api/maboitedigitale/subscription` | Vérifier le statut d'abonnement IA |

## Fonctionnalités

### 1. SSO (Single Sign-On)
Permet aux adhérents ETF de se connecter directement à MaBoiteDigitale.com sans re-saisir leurs identifiants.

```javascript
// Frontend: Appel pour obtenir le lien SSO
const response = await API.post('/api/maboitedigitale/sso');
if (response.data.success) {
  window.open(response.data.redirect_url, '_blank');
}
```

### 2. Vérification d'abonnement
Vérifie si un adhérent a un abonnement IA actif sur MaBoiteDigitale.com.

```javascript
// Frontend: Vérifier le statut d'abonnement
const response = await API.get('/api/maboitedigitale/subscription');
console.log(response.data.has_subscription); // true/false
console.log(response.data.plan_name); // "Pro", "Premium", etc.
```

### 3. Synchronisation des membres
Enregistre les adhérents ETF sur MaBoiteDigitale.com pour qu'ils bénéficient de la réduction partenaire (20% par défaut).

### 4. Statistiques partenariat
Dashboard admin pour suivre:
- Nombre de membres enregistrés
- Abonnements actifs
- Revenus partagés
- Utilisation des réductions

## Mode développement

Sans les credentials API (`MABOITEDIGITALE_API_KEY` et `MABOITEDIGITALE_SECRET`), le service fonctionne en mode développement:
- Génère des tokens locaux fictifs
- Retourne des données de test
- Permet de tester l'intégration frontend

## Sécurité

- Toutes les requêtes API sont signées avec HMAC-SHA256
- Les tokens SSO expirent après 10 minutes
- Les credentials sont stockés uniquement côté backend
- Les adhérents doivent avoir une adhésion ETF active pour accéder au SSO

## Contact MaBoiteDigitale

Pour obtenir vos credentials API partenaire:
- Site: https://maboitedigitale.com
- Contact partenariats: partenaires@maboitedigitale.com
