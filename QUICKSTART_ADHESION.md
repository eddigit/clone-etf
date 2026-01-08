# Guide de démarrage rapide - Système d'adhésion

## 🚀 Démarrage

### Backend

```powershell
# Option 1: Script automatique
.\start-backend-adhesion.ps1

# Option 2: Manuel
.\.venv\Scripts\Activate.ps1
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

```powershell
cd frontend
npm start
```

## ✅ Fonctionnalités implémentées

### 1. Types d'adhésion
- ✅ Particuliers (10-50€)
- ✅ Commerçants - Artisans (50€)
- ✅ Commerçants +100m² (152.32€)
- ✅ Associations (152.32€)

### 2. Backend
- ✅ Modèles MongoDB (Membership, MemberData)
- ✅ Service génération PDF (reportlab)
- ✅ API endpoints complets
- ✅ Webhook HelloAsso mis à jour
- ✅ Tests automatisés

### 3. Frontend
- ✅ Page formulaire d'adhésion (/adhesion)
  - Sélection du type
  - Formulaire conditionnel
  - Validation complète
- ✅ Dashboard adhésions (/dashboard/adhesions)
  - Liste des adhésions
  - Téléchargement PDF
  - Gestion des statuts
- ✅ Navigation mise à jour
  - Lien "Adhérer" dans la navbar
  - Menu "Mes Adhésions" dans le dashboard

### 4. PDF
- ✅ Génération automatique 2 pages
- ✅ Design professionnel
- ✅ Données personnalisées
- ✅ Signatures et tampons

## 🧪 Tests

### Test génération PDF
```powershell
cd backend
..\\.venv\Scripts\python.exe test_adhesion.py
```

### Test API
```powershell
# Créer une adhésion
curl -X POST http://localhost:8001/api/memberships \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @test_membership.json

# Liste mes adhésions
curl http://localhost:8001/api/memberships/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Télécharger PDF
curl http://localhost:8001/api/memberships/{id}/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o adhesion.pdf
```

## 📋 Checklist de déploiement

### Backend
- [x] reportlab installé
- [x] Dossier pdf_memberships créé
- [x] Variables d'environnement HelloAsso configurées
- [ ] Webhook HelloAsso configuré en production

### Frontend
- [x] Routes configurées
- [x] Navigation mise à jour
- [x] Composants créés
- [ ] Tests utilisateur

### HelloAsso
- [ ] Créer 4 formulaires de paiement
  - adhesion-2026-particuliers
  - adhesion-2026-commercants-artisans
  - adhesion-2026-entreprises
  - adhesion-2026-associations
- [ ] Configurer webhook: https://votre-domaine.com/api/webhooks/helloasso
- [ ] Tester les paiements

## 🔑 Endpoints API

### Adhésions
- `POST /api/memberships` - Créer adhésion
- `GET /api/memberships/me` - Mes adhésions
- `GET /api/memberships/{id}` - Détails adhésion
- `GET /api/memberships/{id}/pdf` - Télécharger PDF

### Webhook
- `POST /api/webhooks/helloasso` - Notification paiement

## 📁 Structure des fichiers

```
backend/
├── models.py (MemberData, Membership, MembershipCreate, MembershipResponse)
├── pdf_service.py (MembershipPDFGenerator)
├── server.py (endpoints + webhook)
├── test_adhesion.py (tests)
└── pdf_memberships/ (PDF générés)

frontend/src/
├── pages/
│   ├── Adhesion.jsx (formulaire)
│   └── dashboard/
│       └── Adhesions.jsx (gestion)
├── components/
│   ├── Navbar.jsx (+ lien Adhérer)
│   └── dashboard/
│       └── DashboardLayout.jsx (+ menu Adhésions)
└── App.js (routes)
```

## 🎯 Prochaines étapes

1. **Intégration HelloAsso complète**
   - Créer les formulaires
   - Intégrer les liens de paiement
   - Tester webhook

2. **Notifications email**
   - Email confirmation adhésion
   - Email mot de passe temporaire
   - Rappels de renouvellement

3. **Administration**
   - Liste des adhésions admin
   - Validation manuelle
   - Statistiques

4. **Améliorations**
   - Renouvellement automatique
   - Historique des paiements
   - Export comptable

## 📞 Support

- Email: en.toutefranchise@wanadoo.fr
- Tel: 06 09 78 09 53

## 📚 Documentation

- [ADHESION_SYSTEM.md](ADHESION_SYSTEM.md) - Documentation complète
- API Docs: http://localhost:8001/docs
- Tests: backend/test_adhesion.py
