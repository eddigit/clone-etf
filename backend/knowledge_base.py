"""
Service de base de connaissances avec TF-IDF pour le RAG
ETF - En Toute Franchise

Ce service gère la mémoire institutionnelle de l'association :
- Chargement des articles depuis JSON
- Indexation TF-IDF pour recherche sémantique
- Génération de contexte pour le LLM
"""

import json
import logging
import os
from pathlib import Path
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

# Stop words français pour TF-IDF
FRENCH_STOP_WORDS = [
    'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'à', 'au', 'aux',
    'ce', 'ces', 'cette', 'qui', 'que', 'quoi', 'dont', 'où', 'par', 'pour', 'sur',
    'avec', 'sans', 'sous', 'dans', 'entre', 'vers', 'chez', 'mais', 'ou', 'donc',
    'or', 'ni', 'car', 'ne', 'pas', 'plus', 'moins', 'très', 'tout', 'tous', 'toute',
    'toutes', 'autre', 'autres', 'même', 'mêmes', 'son', 'sa', 'ses', 'leur', 'leurs',
    'notre', 'nos', 'votre', 'vos', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'il', 'elle',
    'ils', 'elles', 'nous', 'vous', 'on', 'je', 'tu', 'se', 'si', 'y', 'a', 'est', 'sont',
    'été', 'être', 'avoir', 'fait', 'faire', 'dit', 'comme', 'aussi', 'bien', 'peut',
    'peuvent', 'doit', 'doivent', 'après', 'avant', 'encore', 'alors', 'ainsi', 'cela',
    'celui', 'celle', 'ceux', 'celles', 'quel', 'quelle', 'quels', 'quelles', 'chaque',
    'http', 'https', 'www', 'com', 'fr', 'org', 'html', 'pdf'
]


class KnowledgeBase:
    """Base de connaissances avec recherche TF-IDF pour le RAG."""
    
    def __init__(self):
        self.articles: List[Dict] = []
        self.pages: List[Dict] = []
        self.vectorizer = None
        self.tfidf_matrix = None
        self.is_loaded = False
        self.metadata: Dict = {}
        
    def load_articles(self, json_path: str) -> bool:
        """Charge les articles depuis un fichier JSON et construit l'index TF-IDF."""
        try:
            path = Path(json_path)
            if not path.exists():
                logger.warning(f"Fichier non trouvé: {json_path}")
                return False
            
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.metadata = data.get('metadata', {})
            self.articles = data.get('articles', [])
            self.pages = data.get('pages', [])
            
            all_docs = self.articles + self.pages
            
            if not all_docs:
                logger.warning("Aucun article trouvé dans le fichier")
                return False
            
            # Construire l'index TF-IDF
            self._build_tfidf_index(all_docs)
            self.is_loaded = True
            
            logger.info(f"✅ Base de connaissances chargée: {len(self.articles)} articles, {len(self.pages)} pages")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors du chargement: {e}")
            return False
    
    def _build_tfidf_index(self, documents: List[Dict]):
        """Construit l'index TF-IDF sur les articles."""
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            
            # Combiner titre + contenu + topics pour chaque article
            texts = []
            for doc in documents:
                text = f"{doc.get('title', '')} "
                text += f"{' '.join(doc.get('key_topics', []))} "
                text += f"{' '.join(doc.get('categories', []))} "
                text += f"{' '.join(doc.get('tags', []))} "
                text += doc.get('content', '')
                texts.append(text.lower())
            
            self.vectorizer = TfidfVectorizer(
                max_features=5000,
                stop_words=FRENCH_STOP_WORDS,
                ngram_range=(1, 2),
                min_df=1,
                max_df=0.95,
                sublinear_tf=True
            )
            
            self.tfidf_matrix = self.vectorizer.fit_transform(texts)
            logger.info(f"Index TF-IDF construit: {self.tfidf_matrix.shape}")
            
        except ImportError:
            logger.error("scikit-learn non installé. Exécutez: pip install scikit-learn")
            raise
    
    def search(self, query: str, top_k: int = 5) -> List[Dict]:
        """Recherche les articles les plus pertinents pour une requête."""
        if not self.is_loaded or self.vectorizer is None:
            return []
        
        try:
            from sklearn.metrics.pairwise import cosine_similarity
            import numpy as np
            
            # Vectoriser la requête
            query_vector = self.vectorizer.transform([query.lower()])
            
            # Calculer la similarité cosinus
            all_docs = self.articles + self.pages
            similarities = cosine_similarity(query_vector, self.tfidf_matrix).flatten()
            
            # Obtenir les indices des top_k articles
            top_indices = np.argsort(similarities)[-top_k:][::-1]
            
            results = []
            for idx in top_indices:
                if similarities[idx] > 0.01:  # Seuil minimal
                    doc = all_docs[idx].copy()
                    doc['relevance_score'] = float(similarities[idx])
                    results.append(doc)
            
            return results
            
        except Exception as e:
            logger.error(f"Erreur lors de la recherche: {e}")
            return []
    
    def get_context_for_llm(self, query: str, max_tokens: int = 3000) -> str:
        """Génère le contexte formaté pour le LLM Groq."""
        results = self.search(query, top_k=5)
        
        if not results:
            return ""
        
        context_parts = [
            "=== ARTICLES DE LA BASE DE CONNAISSANCES ETF ===\n",
            "(Utilise ces informations pour répondre de manière précise et sourcée)\n\n"
        ]
        
        total_chars = 0
        max_chars = max_tokens * 4  # Approximation tokens -> chars
        
        for i, article in enumerate(results, 1):
            title = article.get('title', 'Sans titre')
            date = article.get('date', '')
            topics = ', '.join(article.get('key_topics', [])[:3])
            content = article.get('content', '')[:2000]
            score = article.get('relevance_score', 0)
            
            article_text = f"\n--- Article {i} (pertinence: {score:.0%}) ---\n"
            article_text += f"Titre: {title}\n"
            if date:
                article_text += f"Date: {date}\n"
            if topics:
                article_text += f"Thèmes: {topics}\n"
            article_text += f"\n{content}\n"
            
            if total_chars + len(article_text) > max_chars:
                break
            
            context_parts.append(article_text)
            total_chars += len(article_text)
        
        context_parts.append("\n=== FIN DES ARTICLES ===\n")
        return "".join(context_parts)
    
    def get_stats(self) -> Dict:
        """Retourne les statistiques de la base de connaissances."""
        if not self.is_loaded:
            return {
                "loaded": False,
                "total_articles": 0,
                "message": "Base de connaissances non chargée"
            }
        
        return {
            "loaded": True,
            "source": self.metadata.get('source', 'Unknown'),
            "purpose": self.metadata.get('purpose', ''),
            "total_articles": len(self.articles),
            "total_pages": len(self.pages),
            "total_words": self.metadata.get('total_words', 0),
            "total_categories": len(self.metadata.get('categories', [])),
            "total_topics": len(self.metadata.get('key_topics', [])),
            "key_topics": self.metadata.get('key_topics', []),
            "date_range": self.metadata.get('date_range', {}),
            "export_date": self.metadata.get('export_date', '')
        }
    
    def get_suggested_questions(self) -> List[str]:
        """Retourne des questions suggérées basées sur le contenu."""
        return [
            "Qu'est-ce que la Directive Européenne Services 2006/123 ?",
            "Comment l'association ETF défend-elle les commerçants et artisans ?",
            "Quels sont mes droits face à une grande surface illicite ?",
            "Comment contester un permis de construire commercial ?",
            "Quel est le rôle de la CDAC et de la CNAC ?",
            "Pourquoi adhérer à En Toute Franchise ?",
            "Qu'est-ce que le moratoire sur les grandes surfaces ?",
            "Comment signaler une surface commerciale illégale ?",
            "Quelles sont les actions politiques menées par l'association ?",
            "Comment la Directive Services protège-t-elle les commerçants ?"
        ]


# Instance singleton
knowledge_base = KnowledgeBase()


def init_knowledge_base(json_path: str = None) -> KnowledgeBase:
    """Initialise la base de connaissances."""
    if json_path is None:
        # Chemin par défaut
        json_path = os.path.join(
            os.path.dirname(__file__), 
            'data', 
            'articles_etf_memory.json'
        )
    
    if knowledge_base.load_articles(json_path):
        logger.info("✅ Base de connaissances RAG initialisée")
    else:
        logger.warning("⚠️ Base de connaissances non chargée - RAG désactivé")
    
    return knowledge_base
