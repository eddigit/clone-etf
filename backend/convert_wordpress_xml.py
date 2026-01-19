"""
Script de conversion WordPress XML vers JSON pour le système RAG
ETF - En Toute Franchise

Ce script parse le fichier d'export WordPress et génère un fichier JSON 
optimisé pour le système RAG (Retrieval-Augmented Generation).

Ces articles constituent la MÉMOIRE INSTITUTIONNELLE de l'association depuis 1994.
"""

import xml.etree.ElementTree as ET
import json
import re
import html
from datetime import datetime
from pathlib import Path
import sys

# Namespaces WordPress
NAMESPACES = {
    'content': 'http://purl.org/rss/1.0/modules/content/',
    'excerpt': 'http://wordpress.org/export/1.2/excerpt/',
    'wp': 'http://wordpress.org/export/1.2/',
    'dc': 'http://purl.org/dc/elements/1.1/'
}


def clean_html(raw_html: str) -> str:
    """Nettoie le HTML et extrait le texte brut."""
    if not raw_html:
        return ""
    
    text = html.unescape(raw_html)
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</p>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</li>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'</h[1-6]>', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()


def extract_key_topics(content: str, title: str) -> list:
    """Extrait les thèmes clés pour améliorer la recherche RAG."""
    topics = []
    text = (title + " " + content).lower()
    
    # Thèmes juridiques
    if 'directive' in text and ('2006' in text or 'services' in text or 'européenne' in text):
        topics.append('Directive Services 2006')
    if 'cdac' in text:
        topics.append('CDAC')
    if 'cnac' in text:
        topics.append('CNAC')
    if 'permis de construire' in text:
        topics.append('Permis de construire')
    if 'plu' in text or 'plan local' in text:
        topics.append('PLU Urbanisme')
    if 'tribunal' in text or 'jugement' in text:
        topics.append('Jurisprudence')
    if 'recours' in text:
        topics.append('Recours juridique')
    
    # Thèmes commerciaux
    if 'grande surface' in text or 'hypermarché' in text:
        topics.append('Grande distribution')
    if 'illicite' in text or 'illégal' in text:
        topics.append('Surfaces illicites')
    if 'franchise' in text or 'franchisé' in text:
        topics.append('Franchise')
    if 'commerçant' in text or 'artisan' in text:
        topics.append('Commerce de proximité')
    if 'centre-ville' in text:
        topics.append('Centres-villes')
    
    # Thèmes politiques
    if 'élection' in text or 'candidat' in text:
        topics.append('Actions politiques')
    if 'moratoire' in text:
        topics.append('Moratoire')
    if 'pétition' in text:
        topics.append('Pétitions')
    if 'transposition' in text:
        topics.append('Transposition directive')
    
    return list(set(topics))


def parse_wordpress_xml(xml_path: str) -> dict:
    """Parse le fichier XML WordPress et extrait les articles."""
    print(f"📖 Lecture du fichier: {xml_path}")
    
    tree = ET.parse(xml_path)
    root = tree.getroot()
    channel = root.find('channel')
    
    site_title = channel.find('title').text if channel.find('title') is not None else "En Toute Franchise"
    site_description = channel.find('description').text if channel.find('description') is not None else ""
    
    articles = []
    pages = []
    skipped = 0
    
    for item in channel.findall('item'):
        post_type_elem = item.find('wp:post_type', NAMESPACES)
        post_type = post_type_elem.text if post_type_elem is not None else "post"
        
        status_elem = item.find('wp:status', NAMESPACES)
        status = status_elem.text if status_elem is not None else "draft"
        
        if status != 'publish' or post_type not in ['post', 'page']:
            skipped += 1
            continue
        
        title_elem = item.find('title')
        title = title_elem.text if title_elem is not None and title_elem.text else ""
        if not title or title.lower() in ["hello world!", "sample page"]:
            skipped += 1
            continue
        
        pub_date_elem = item.find('wp:post_date', NAMESPACES)
        pub_date = pub_date_elem.text if pub_date_elem is not None else ""
        
        content_elem = item.find('content:encoded', NAMESPACES)
        raw_content = content_elem.text if content_elem is not None else ""
        clean_content = clean_html(raw_content)
        
        if len(clean_content) < 50:
            skipped += 1
            continue
        
        excerpt_elem = item.find('excerpt:encoded', NAMESPACES)
        excerpt = clean_html(excerpt_elem.text) if excerpt_elem is not None and excerpt_elem.text else ""
        
        categories = []
        tags = []
        for category in item.findall('category'):
            domain = category.get('domain', '')
            cat_text = category.text if category.text else ""
            if cat_text.lower() in ["uncategorized", "non classé"]:
                continue
            if domain == 'category':
                categories.append(cat_text)
            elif domain == 'post_tag':
                tags.append(cat_text)
        
        slug_elem = item.find('wp:post_name', NAMESPACES)
        slug = slug_elem.text if slug_elem is not None else ""
        
        post_id_elem = item.find('wp:post_id', NAMESPACES)
        post_id = post_id_elem.text if post_id_elem is not None else ""
        
        key_topics = extract_key_topics(clean_content, title)
        
        article = {
            "id": post_id,
            "title": title,
            "slug": slug,
            "date": pub_date[:10] if pub_date else "",
            "year": pub_date[:4] if pub_date else "",
            "type": post_type,
            "categories": categories,
            "tags": tags,
            "key_topics": key_topics,
            "excerpt": excerpt[:500] if excerpt else clean_content[:500],
            "content": clean_content,
            "word_count": len(clean_content.split())
        }
        
        if post_type == 'page':
            pages.append(article)
        else:
            articles.append(article)
    
    print(f"✅ {len(articles)} articles et {len(pages)} pages extraits ({skipped} ignorés)")
    
    articles.sort(key=lambda x: x['date'], reverse=True)
    pages.sort(key=lambda x: x['title'])
    
    all_categories = set()
    all_tags = set()
    all_topics = set()
    total_words = 0
    
    for article in articles + pages:
        all_categories.update(article['categories'])
        all_tags.update(article['tags'])
        all_topics.update(article['key_topics'])
        total_words += article['word_count']
    
    return {
        "metadata": {
            "source": site_title,
            "description": clean_html(site_description),
            "export_date": datetime.now().isoformat(),
            "purpose": "Base de connaissances RAG - Mémoire ETF depuis 1994",
            "total_articles": len(articles),
            "total_pages": len(pages),
            "total_words": total_words,
            "categories": sorted(list(all_categories)),
            "tags": sorted(list(all_tags)),
            "key_topics": sorted(list(all_topics)),
            "date_range": {
                "oldest": articles[-1]['date'] if articles else None,
                "newest": articles[0]['date'] if articles else None
            }
        },
        "articles": articles,
        "pages": pages
    }


def main():
    """Point d'entrée principal."""
    script_dir = Path(__file__).parent
    default_xml = Path.home() / "Downloads" / "entoutefranchise.WordPress.2026-01-19.xml"
    default_output = script_dir / "data" / "articles_etf_memory.json"
    
    xml_path = sys.argv[1] if len(sys.argv) > 1 else str(default_xml)
    output_path = sys.argv[2] if len(sys.argv) > 2 else str(default_output)
    
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    print("\n🚀 CONVERSION WORDPRESS XML → JSON POUR RAG ETF")
    print("=" * 60)
    
    try:
        data = parse_wordpress_xml(xml_path)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Fichier sauvegardé: {output_path}")
        print(f"📊 Stats: {data['metadata']['total_articles']} articles, {data['metadata']['total_words']:,} mots")
        print(f"🎯 Thèmes: {', '.join(data['metadata']['key_topics'][:5])}...")
        print("\n✅ Conversion terminée!")
        
    except Exception as e:
        print(f"\n❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
