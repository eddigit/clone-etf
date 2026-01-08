# ✅ Checklist de Déploiement - En Toute Franchise

## 📋 Avant le Déploiement

### Configuration Locale
- [ ] MongoDB local fonctionne
- [ ] Backend démarre sans erreur (port 8001)
- [ ] Frontend démarre sans erreur (port 3000)
- [ ] Connexion réussie avec les comptes test
- [ ] Dashboard accessible et fonctionnel
- [ ] Toutes les pages chargent correctement

### Base de Données MongoDB Atlas
- [ ] Compte MongoDB Atlas créé
- [ ] Cluster gratuit (M0) créé
- [ ] Utilisateur de base de données créé
- [ ] IP 0.0.0.0/0 autorisée (ou IP de Vercel)
- [ ] Chaîne de connexion copiée
- [ ] Base de données initialisée avec `seed_data.py`
- [ ] Collections visibles dans Atlas (8 collections)

### Configuration GitHub
- [ ] Repository GitHub créé (eddigit/clone-etf)
- [ ] Code local poussé sur GitHub
- [ ] Branch `main` configurée comme défaut
- [ ] `.gitignore` configuré (pas de .env committé)
- [ ] README.md à jour

### Variables d'Environnement Préparées
- [ ] `MONGO_URL` (Atlas) noté
- [ ] `JWT_SECRET` unique et sécurisé généré
- [ ] `DB_NAME` défini (test_database)
- [ ] `FRONTEND_URL` sera configuré après déploiement

---

## 🚀 Déploiement Vercel

### Compte et Connexion
- [ ] Compte Vercel créé
- [ ] GitHub connecté à Vercel
- [ ] Organisation/Team configuré (si besoin)

### Import du Projet
- [ ] Repository `eddigit/clone-etf` importé
- [ ] Framework détecté: Create React App
- [ ] Root Directory: `.` (défaut)

### Configuration Build
- [ ] Build Command: `cd frontend && npm install && npm run build`
- [ ] Output Directory: `frontend/build`
- [ ] Install Command: `npm install`

### Variables d'Environnement Vercel
- [ ] `MONGO_URL` ajouté (Production)
- [ ] `DB_NAME` ajouté (Production)
- [ ] `JWT_SECRET` ajouté (Production)
- [ ] `JWT_ALGORITHM` = HS256
- [ ] `JWT_EXPIRATION_MINUTES` = 10080
- [ ] `ENVIRONMENT` = production
- [ ] `REACT_APP_BACKEND_URL` = URL Vercel
- [ ] `REACT_APP_API_URL` = URL Vercel

### Déploiement Initial
- [ ] Cliquer sur "Deploy"
- [ ] Attendre la fin du build (2-5 min)
- [ ] Noter l'URL de déploiement (ex: clone-etf.vercel.app)
- [ ] Mettre à jour `FRONTEND_URL` avec l'URL Vercel
- [ ] Re-déployer

---

## 🧪 Tests Post-Déploiement

### Frontend
- [ ] Site accessible via l'URL Vercel
- [ ] Page d'accueil charge correctement
- [ ] Navigation fonctionne
- [ ] Images et styles chargent
- [ ] Responsive fonctionne (mobile, tablette, desktop)

### Backend API
- [ ] API accessible: `https://votre-app.vercel.app/api/`
- [ ] Documentation: `https://votre-app.vercel.app/docs`
- [ ] Health check fonctionne

### Authentification
- [ ] Page de login accessible
- [ ] Login avec test@example.fr fonctionne
- [ ] Token JWT généré
- [ ] Redirection vers dashboard
- [ ] Déconnexion fonctionne

### Dashboard
- [ ] Dashboard accessible après login
- [ ] Statistiques affichées
- [ ] Navigation entre sections fonctionne
- [ ] Toutes les pages du dashboard chargent

### Base de Données
- [ ] Connexion MongoDB Atlas stable
- [ ] Données de test présentes
- [ ] Requêtes fonctionnent sans erreur
- [ ] Pas de timeout

### CORS et Sécurité
- [ ] Pas d'erreur CORS dans console
- [ ] Headers sécurité présents
- [ ] HTTPS actif
- [ ] Certificat SSL valide

---

## 🔍 Vérifications de Sécurité

### Secrets et Clés
- [ ] JWT_SECRET différent du développement
- [ ] JWT_SECRET assez long (32+ caractères)
- [ ] Pas de secrets dans le code source
- [ ] `.env` dans `.gitignore`

### Base de Données
- [ ] Utilisateur MongoDB avec mot de passe fort
- [ ] Pas de credentials dans le code
- [ ] Accès IP configuré correctement
- [ ] Backup MongoDB activé (optionnel)

### API
- [ ] CORS configuré pour URL production uniquement
- [ ] Rate limiting considéré (optionnel)
- [ ] Validation des entrées active
- [ ] Erreurs ne révèlent pas d'infos sensibles

---

## 📊 Monitoring Post-Déploiement

### Première Heure
- [ ] Vérifier logs Vercel (pas d'erreurs)
- [ ] Tester toutes les fonctionnalités principales
- [ ] Vérifier temps de chargement
- [ ] Tester depuis différents navigateurs

### Premier Jour
- [ ] Monitorer usage MongoDB Atlas
- [ ] Vérifier Analytics Vercel
- [ ] Tester avec plusieurs comptes
- [ ] Vérifier emails de notification (si configuré)

### Première Semaine
- [ ] Analyser performances
- [ ] Vérifier croissance base de données
- [ ] Optimiser si nécessaire
- [ ] Recueillir premiers retours utilisateurs

---

## 🐛 Dépannage Rapide

### Site ne charge pas
1. Vérifier logs Vercel: `vercel logs`
2. Vérifier variables d'environnement
3. Vérifier build réussi
4. Vérifier DNS (si domaine custom)

### Erreur API
1. Vérifier `vercel.json` routes
2. Vérifier backend/server.py
3. Tester endpoints dans /docs
4. Vérifier MongoDB connexion

### Erreur MongoDB
1. Vérifier chaîne connexion
2. Vérifier IP autorisées
3. Vérifier credentials
4. Vérifier quota Atlas

### Erreur CORS
1. Vérifier `FRONTEND_URL` dans variables
2. Vérifier CORS middleware dans server.py
3. Vérifier ENVIRONMENT=production
4. Redéployer

---

## 📝 Notes Importantes

### URLs à Mettre à Jour
Après déploiement, remplacer dans tous les documents:
- `http://localhost:3000` → `https://votre-app.vercel.app`
- `http://localhost:8001` → `https://votre-app.vercel.app`

### Commandes Utiles
```powershell
# Logs en temps réel
vercel logs --follow

# Re-déployer
vercel --prod

# Voir variables
vercel env ls

# Rollback (si problème)
vercel rollback
```

### Support
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- FastAPI: https://fastapi.tiangolo.com

---

## ✅ Déploiement Réussi !

Félicitations ! Votre application est en ligne sur:
- **Production**: https://votre-app.vercel.app
- **API**: https://votre-app.vercel.app/api/
- **Docs**: https://votre-app.vercel.app/docs

**Prochaines étapes:**
1. Configurer domaine personnalisé (optionnel)
2. Activer Analytics Vercel
3. Configurer OpenAI pour l'assistant IA
4. Configurer Stripe pour paiements
5. Ajouter monitoring avancé

---

*Dernière mise à jour: 4 janvier 2026*
