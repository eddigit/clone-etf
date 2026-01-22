# Agent de Test du Parcours Adhésion 🤖

## Vue d'ensemble

L'agent de test du parcours adhésion est un outil automatisé qui simule le comportement d'un utilisateur réel souhaitant adhérer à l'association. Il effectue un audit complet du parcours et génère un rapport détaillé des problèmes rencontrés.

## Fonctionnalités

### Parcours testé

L'agent exécute les phases suivantes :

1. **Accès au site** - Vérifie que l'API est accessible
2. **Inscription** - Crée un compte utilisateur test
3. **Connexion** - S'authentifie avec le compte créé
4. **Navigation** - Accède au profil et vérifie l'état pré-adhésion
5. **Choix d'adhésion** - Sélectionne un type d'adhésion
6. **Formulaire** - Remplit les données d'adhésion
7. **Soumission** - Envoie le formulaire
8. **PDF** - Vérifie la génération du bordereau PDF
9. **Vérification** - Contrôle que l'adhésion apparaît dans le profil
10. **Nettoyage** - Supprime les données de test

### Types d'adhésion testables

- `individual` - Particuliers (10€ à 50€)
- `professional` - Commerçants/Artisans (50€)
- `professional_plus` - Commerces +100m² (152.32€)
- `association` - Associations (152.32€)

### Niveaux de sévérité des problèmes

- 🔴 **CRITICAL** - Bloquant, empêche la continuation du parcours
- 🟠 **ERROR** - Erreur mais contournable
- 🟡 **WARNING** - Problème potentiel à surveiller
- 🔵 **INFO** - Information

## Utilisation

### Via l'API (recommandé)

#### Lancer un test simple
```bash
POST /api/admin/test-adhesion/run?membership_type=individual&cleanup=true
Authorization: Bearer <admin_token>
```

#### Lancer un test complet (tous les types)
```bash
POST /api/admin/test-adhesion/run-all-types?cleanup=true
Authorization: Bearer <admin_token>
```

#### Récupérer les rapports
```bash
GET /api/admin/test-adhesion/reports?limit=20
Authorization: Bearer <admin_token>
```

#### Récupérer un rapport spécifique
```bash
GET /api/admin/test-adhesion/reports/{report_id}
Authorization: Bearer <admin_token>
```

#### Nettoyer les données de test
```bash
DELETE /api/admin/test-adhesion/cleanup
Authorization: Bearer <admin_token>
```

### Via le script PowerShell

```powershell
# Test sur localhost avec type individual (défaut)
.\run_adhesion_test.ps1

# Test avec un type spécifique
.\run_adhesion_test.ps1 professional

# Test sur la production
.\run_adhesion_test.ps1 individual https://etf-backend-t3j5.onrender.com
```

### Via Python directement

```bash
cd backend
python adhesion_test_agent.py http://localhost:8001 individual
```

## Format du rapport

```json
{
  "id": "uuid-du-rapport",
  "started_at": "2026-01-19T10:00:00Z",
  "completed_at": "2026-01-19T10:00:15Z",
  "environment": "development",
  "overall_success": true,
  
  "total_phases": 10,
  "passed_phases": 10,
  "failed_phases": 0,
  
  "test_user_email": "test_adhesion_xxx@test-etf.com",
  "test_membership_id": "mem_xxx",
  "test_membership_type": "individual",
  
  "phases": [
    {
      "phase": "site_access",
      "name": "Accès au site",
      "success": true,
      "duration_ms": 150,
      "details": { ... }
    }
  ],
  
  "all_issues": [
    {
      "severity": "warning",
      "phase": "form_submission",
      "title": "Temps de réponse lent",
      "description": "La création a pris 6500ms (> 5000ms)",
      "suggestion": "Optimiser la génération du PDF"
    }
  ],
  
  "critical_issues": 0,
  "errors": 0,
  "warnings": 1,
  
  "summary": "✅ Parcours adhésion réussi! 10/10 phases OK.",
  "recommendations": [
    "Optimiser la génération du PDF ou utiliser un traitement async"
  ]
}
```

## Intégration avec le Dashboard Admin

Les administrateurs peuvent accéder aux tests via le dashboard :

1. Aller dans **Administration > Tests**
2. Sélectionner **Test Parcours Adhésion**
3. Choisir le type d'adhésion à tester
4. Cliquer sur **Lancer le test**
5. Consulter le rapport généré

## Bonnes pratiques

### En développement

- Lancer les tests après chaque modification du parcours d'adhésion
- Tester tous les types d'adhésion régulièrement
- Garder `cleanup=true` pour éviter l'accumulation de données

### En production

- Planifier des tests automatiques quotidiens
- Surveiller les métriques de temps de réponse
- Réagir rapidement aux alertes critiques

## Exemple de sortie console

```
🤖 Agent de Test du Parcours Adhésion
==================================================
API: http://localhost:8001
Type: individual
==================================================

📊 RÉSULTAT: ✅ Parcours adhésion réussi! 10/10 phases OK. Type testé: individual. Durée: 8542ms

📋 Phases:
  ✅ Accès au site: Vérification de l'accessibilité de l'API (156ms)
  ✅ Inscription: Création d'un compte utilisateur (423ms)
  ✅ Connexion: Authentification de l'utilisateur (198ms)
  ✅ Navigation: Accès au profil et vérification pré-adhésion (312ms)
  ✅ Choix adhésion: Sélection du type: individual (2ms)
  ✅ Formulaire: Remplissage des données d'adhésion (1ms)
  ✅ Soumission: Envoi du formulaire d'adhésion (5234ms)
  ✅ PDF: Vérification du bordereau PDF (1876ms)
  ✅ Vérification: Contrôle de l'adhésion dans le profil (340ms)
  ✅ Nettoyage: Suppression des données de test (0ms)

⚠️ Problèmes détectés (1):
  🟡 [form_submission] Temps de réponse lent
     La création d'adhésion a pris 5234ms (> 5000ms)
     💡 Optimiser la génération du PDF ou utiliser un traitement async

💡 Recommandations:
  • Optimiser la génération du PDF ou utiliser un traitement async

📊 Statistiques:
  • Durée totale: 8542ms
  • Phases: 10/10 réussies
  • Critiques: 0, Erreurs: 0, Avertissements: 1
```

## Dépannage

### Le test échoue à l'inscription

- Vérifier que la route `/api/auth/register` fonctionne
- Vérifier les règles de validation des emails

### Le test échoue à la soumission d'adhésion

- Vérifier que l'utilisateur est bien authentifié
- Vérifier les champs obligatoires selon le type d'adhésion
- Consulter les logs du serveur

### Le PDF n'est pas généré

- Vérifier que `reportlab` est installé
- Vérifier que le dossier `pdf_memberships` existe
- Vérifier les permissions d'écriture

## Architecture technique

```
backend/
├── adhesion_test_agent.py     # Agent de test principal
├── test_agent.py              # Agent de test général (existant)
└── server.py                  # Routes API pour les tests

# Routes ajoutées:
# POST   /api/admin/test-adhesion/run
# POST   /api/admin/test-adhesion/run-all-types
# GET    /api/admin/test-adhesion/reports
# GET    /api/admin/test-adhesion/reports/{id}
# DELETE /api/admin/test-adhesion/cleanup
```

## Évolutions futures

- [ ] Intégration avec le frontend pour un dashboard de monitoring
- [ ] Tests de charge avec plusieurs utilisateurs simultanés
- [ ] Intégration avec des outils de CI/CD
- [ ] Alertes email automatiques en cas d'échec
- [ ] Tests de régression automatiques après déploiement
