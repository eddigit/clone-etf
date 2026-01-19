# 🧠 Système RAG - En Toute Franchise

## Vue d'ensemble

Le système RAG (Retrieval-Augmented Generation) constitue la **mémoire institutionnelle** de l'association ETF, permettant au chatbot IA de répondre avec précision aux questions des utilisateurs en s'appuyant sur 30 ans d'articles et de documentation.

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   WordPress XML     │────▶│   convert_wordpress │────▶│   articles_etf_     │
│   (11924 lignes)    │     │   _xml.py           │     │   memory.json       │
└─────────────────────┘     └─────────────────────┘     └──────────┬──────────┘
                                                                    │
                                                                    ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Groq API          │◀────│   ai_routes.py      │◀────│   knowledge_base.py │
│   (llama-3.3-70b)   │     │   /rag/chat         │     │   TF-IDF Search     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

## Technologies utilisées

| Composant | Technologie | Coût |
|-----------|-------------|------|
| Recherche sémantique | TF-IDF (scikit-learn) | **Gratuit** |
| Génération de texte | Groq API (llama-3.3-70b) | **Gratuit** (limite généreuse) |
| Base de données | JSON (fichier local) | **Gratuit** |

## Installation

### 1. Installer les dépendances

```bash
cd backend
pip install scikit-learn>=1.3.0
```

### 2. Convertir le fichier WordPress XML

Placez le fichier `entoutefranchise.WordPress.2026-01-19.xml` dans le dossier approprié, puis exécutez :

```bash
# Option 1: Depuis le dossier Downloads (par défaut)
python convert_wordpress_xml.py

# Option 2: Spécifier les chemins
python convert_wordpress_xml.py "chemin/vers/fichier.xml" "backend/data/articles_etf_memory.json"
```

### 3. Vérifier la conversion

Le fichier `backend/data/articles_etf_memory.json` doit contenir :
- Les métadonnées (source, catégories, thèmes clés)
- Les articles avec leur contenu nettoyé
- Les pages statiques

## Endpoints API

### Chat RAG
```http
POST /api/ai/rag/chat
Content-Type: application/json

{
  "message": "Qu'est-ce que la Directive 2006 ?",
  "use_rag": true
}
```

**Réponse :**
```json
{
  "success": true,
  "response": "La Directive 2006/123/CE...",
  "sources": [
    {"title": "Article sur la Directive", "date": "2020-01-15", "score": 0.85}
  ]
}
```

### Recherche simple
```http
POST /api/ai/rag/search
Content-Type: application/json

{
  "query": "CDAC recours",
  "top_k": 5
}
```

### Statistiques
```http
GET /api/ai/rag/stats
```

### Questions suggérées
```http
GET /api/ai/rag/suggestions
```

### Recharger la base
```http
POST /api/ai/rag/reload
```

## Structure des fichiers

```
backend/
├── data/
│   └── articles_etf_memory.json    # Base de connaissances (généré)
├── convert_wordpress_xml.py        # Script de conversion XML→JSON
├── knowledge_base.py               # Service TF-IDF
├── ai_routes.py                    # Endpoints RAG
├── groq_ai_service.py              # Service Groq
└── server.py                       # Initialisation au démarrage
```

## Thèmes clés détectés automatiquement

Le système identifie automatiquement les thèmes suivants dans les articles :

- **Juridiques** : Directive Services 2006, CDAC, CNAC, PLU, Jurisprudence
- **Commerciaux** : Grande distribution, Surfaces illicites, Franchise
- **Politiques** : Actions politiques, Moratoire, Elections
- **ETF** : Adhésion, Victoires, Assemblée générale

## Configuration

### Variables d'environnement

```env
GROQ_API_KEY=votre_cle_api_groq
```

### Paramètres TF-IDF

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| max_features | 5000 | Nombre max de termes dans le vocabulaire |
| ngram_range | (1, 2) | Unigrammes et bigrammes |
| min_df | 1 | Fréquence minimale d'un terme |
| max_df | 0.95 | Fréquence maximale (évite les termes trop communs) |

## Utilisation dans le frontend

```javascript
// Chat avec RAG
const response = await fetch('/api/ai/rag/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Comment contester un permis de construire ?",
    use_rag: true
  })
});

const data = await response.json();
console.log(data.response);  // Réponse générée par l'IA
console.log(data.sources);   // Articles utilisés comme contexte
```

## Maintenance

### Ajouter de nouveaux articles

1. Exporter à nouveau le site WordPress en XML
2. Relancer `convert_wordpress_xml.py`
3. Appeler `POST /api/ai/rag/reload` ou redémarrer le serveur

### Améliorer la qualité des réponses

1. Modifier les thèmes clés dans `extract_key_topics()` 
2. Ajuster les stop words français dans `knowledge_base.py`
3. Modifier le prompt RAG dans `ai_routes.py`

## Logs

Le système loggue les informations importantes :

```
INFO: ✅ Base de connaissances chargée: 234 articles, 15 pages
INFO: Index TF-IDF construit: (249, 5000)
INFO: RAG chat request: "Qu'est-ce que la CDAC ?"
```

## Dépannage

### "Base de connaissances non chargée"

- Vérifiez que `backend/data/articles_etf_memory.json` existe
- Relancez le serveur ou appelez `/api/ai/rag/reload`

### "scikit-learn non installé"

```bash
pip install scikit-learn>=1.3.0
```

### Réponses peu pertinentes

- Vérifiez les thèmes clés dans les articles
- Augmentez `top_k` pour plus de contexte
- Ajustez le prompt RAG
