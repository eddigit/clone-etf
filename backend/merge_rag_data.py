"""
Script de fusion des fichiers de mémoire RAG
Fusionne articles + pages en un seul fichier
"""

import json
from pathlib import Path

def merge_rag_files():
    data_dir = Path(__file__).parent / "data"
    
    # Charger les articles
    articles_path = data_dir / "articles_etf_memory.json"
    with open(articles_path, 'r', encoding='utf-8') as f:
        articles_data = json.load(f)
    
    # Charger les pages
    pages_path = data_dir / "pages_etf_memory.json"
    with open(pages_path, 'r', encoding='utf-8') as f:
        pages_data = json.load(f)
    
    # Récupérer les pages (peuvent être sous 'pages' ou 'articles' selon le type de fichier)
    pages_list = pages_data.get('pages', []) or pages_data.get('articles', [])
    
    # Fusionner les métadonnées
    merged = {
        'metadata': {
            'source': articles_data['metadata']['source'],
            'description': articles_data['metadata']['description'],
            'export_date': articles_data['metadata']['export_date'],
            'purpose': 'Base de connaissances RAG complète - Mémoire ETF depuis 1994',
            'total_articles': len(articles_data['articles']),
            'total_pages': len(pages_list),
            'total_words': articles_data['metadata']['total_words'] + pages_data['metadata']['total_words'],
            'categories': sorted(list(set(articles_data['metadata'].get('categories', []) + pages_data['metadata'].get('categories', [])))),
            'tags': sorted(list(set(articles_data['metadata'].get('tags', []) + pages_data['metadata'].get('tags', [])))),
            'key_topics': sorted(list(set(articles_data['metadata'].get('key_topics', []) + pages_data['metadata'].get('key_topics', [])))),
            'date_range': articles_data['metadata'].get('date_range', {})
        },
        'articles': articles_data['articles'],
        'pages': pages_list
    }
    
    # Sauvegarder le fichier fusionné
    output_path = data_dir / "articles_etf_memory.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    
    print("\n🔄 FUSION DES FICHIERS RAG")
    print("=" * 50)
    print(f"📄 Articles: {merged['metadata']['total_articles']}")
    print(f"📃 Pages: {merged['metadata']['total_pages']}")
    print(f"📊 Total mots: {merged['metadata']['total_words']:,}")
    print(f"🎯 Thèmes clés: {len(merged['metadata']['key_topics'])}")
    print(f"\n💾 Fichier sauvegardé: {output_path}")
    print("✅ Fusion terminée!")
    
    return merged

if __name__ == "__main__":
    merge_rag_files()
