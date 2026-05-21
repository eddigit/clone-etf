#!/usr/bin/env python3
"""
Sanitize Quill-polluted articles directly in the source (Mongo via API admin).

Reproduit la logique du sanitizeQuillContent côté front (BlogArticle.jsx) :
- décode &nbsp; / U+00A0 / &#39; / &quot;
- normalise les apostrophes typographiques françaises
- supprime styles inline imposés par Word (color:black, rgb(0,71,178), bg blanc, font-family)
- supprime les <span> vides
- APLATIT les listes Quill imbriquées (<ul><li><ul>... → <ul><li>...)

USAGE
    # Dry-run (par défaut) : montre les diffs sans rien écrire
    python3 sanitize-articles.py --base-url https://etf-api.mybotia.com \
        --token "$ETF_ADMIN_TOKEN"

    # Vrai run, sur tous les articles
    python3 sanitize-articles.py --base-url https://etf-api.mybotia.com \
        --token "$ETF_ADMIN_TOKEN" --apply

    # Un seul article
    python3 sanitize-articles.py --base-url https://etf-api.mybotia.com \
        --token "$ETF_ADMIN_TOKEN" --slug nos-droits-fondamentaux --apply

Dépendances : pip install requests beautifulsoup4 lxml
"""

import argparse
import json
import re
import sys
from typing import Optional

try:
    import requests
    from bs4 import BeautifulSoup, NavigableString
except ImportError:
    print("ERROR: pip install requests beautifulsoup4 lxml", file=sys.stderr)
    sys.exit(1)


BAD_COLORS = [
    re.compile(r"color\s*:\s*black\b", re.I),
    re.compile(r"color\s*:\s*#000(?:000)?\b", re.I),
    re.compile(r"color\s*:\s*rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)", re.I),
    re.compile(r"color\s*:\s*rgb\(\s*0\s*,\s*71\s*,\s*178\s*\)", re.I),
    re.compile(r"color\s*:\s*#0047b2\b", re.I),
]
BAD_BG = [
    re.compile(r"background-color\s*:\s*white\b", re.I),
    re.compile(r"background-color\s*:\s*#fff(?:fff)?\b", re.I),
    re.compile(r"background\s*:\s*white\b", re.I),
    re.compile(r"background-color\s*:\s*rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)", re.I),
]


def clean_style(style: str) -> str:
    if not style:
        return ""
    decls = [d.strip() for d in style.split(";") if d.strip()]
    kept = []
    for d in decls:
        if re.match(r"^font-family\s*:", d, re.I):
            continue
        if any(rx.search(d) for rx in BAD_COLORS):
            continue
        if any(rx.search(d) for rx in BAD_BG):
            continue
        kept.append(d)
    return "; ".join(kept)


def flatten_empty_list_items(soup: BeautifulSoup) -> None:
    """Aplatit les <li> qui ne contiennent QUE des sous-listes (pas de texte direct)."""
    changed = True
    safety = 0
    while changed and safety < 10:
        changed = False
        safety += 1
        for lst in soup.find_all(["ul", "ol"]):
            for li in list(lst.find_all("li", recursive=False)):
                # Texte direct (hors <ul>/<ol> enfants)
                direct_text = "".join(
                    (c.string if isinstance(c, NavigableString) else c.get_text())
                    for c in li.children
                    if not (getattr(c, "name", None) in ("ul", "ol"))
                ).strip()
                sublists = [c for c in li.children if getattr(c, "name", None) in ("ul", "ol")]
                if not direct_text and sublists:
                    # Remonter les <li> des sous-listes au niveau du parent
                    for sub in sublists:
                        for inner_li in list(sub.find_all("li", recursive=False)):
                            li.insert_before(inner_li)
                    li.decompose()
                    changed = True
                    break  # ré-itérer proprement


def sanitize(raw: str) -> str:
    if not raw:
        return ""

    html = raw
    # 1. Décodage des entités d'espace + apostrophes / guillemets
    html = (html
            .replace("&nbsp;", " ")
            .replace("&#160;", " ")
            .replace(" ", " ")
            .replace("&#39;", "’")
            .replace("&apos;", "’")
            .replace("&quot;", '"')
            .replace("&#34;", '"'))

    # Apostrophes typographiques françaises
    html = re.sub(r"\b([ldnjcstmLDNJCSTM]|[Qq]u)'([aeiouhAEIOUH])", r"\1’\2", html)

    # Collapse espaces multiples
    html = re.sub(r"[ \t]{2,}", " ", html)
    html = re.sub(r">\s+<", "><", html)

    # 2. Parse + nettoyage DOM
    soup = BeautifulSoup(html, "lxml")
    # BS4 + lxml wrap dans <html><body> ; on bossera sur body.contents
    body = soup.body or soup

    # 3. Styles inline
    for el in body.find_all(style=True):
        cleaned = clean_style(el["style"])
        if cleaned:
            el["style"] = cleaned
        else:
            del el["style"]

    # 4. Listes imbriquées vides
    flatten_empty_list_items(body)

    # 5. <span> sans attribut utile
    for span in list(body.find_all("span")):
        useful = (span.get("style", "").strip()
                  or span.get("class")
                  or span.get("id"))
        if not useful:
            span.unwrap()

    # 6. Re-sérialisation (innerHTML du body)
    out = "".join(str(c) for c in body.contents)
    out = re.sub(r"[ \t]{2,}", " ", out)
    return out


def fetch_articles(base_url: str, token: Optional[str]):
    """Liste tous les slugs. Fallback : tente plusieurs endpoints courants."""
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    candidates = [
        f"{base_url}/api/admin/articles",
        f"{base_url}/api/articles?limit=1000",
        f"{base_url}/api/articles",
    ]
    for url in candidates:
        try:
            r = requests.get(url, headers=headers, timeout=15)
            if r.ok:
                data = r.json()
                if isinstance(data, dict):
                    data = data.get("articles") or data.get("data") or data.get("items") or []
                if isinstance(data, list):
                    return data
        except requests.RequestException:
            continue
    return []


def fetch_one(base_url: str, slug: str):
    r = requests.get(f"{base_url}/api/articles/{slug}", timeout=15)
    r.raise_for_status()
    return r.json()


def update_article(base_url: str, token: str, slug: str, new_content: str) -> bool:
    """PATCH /api/admin/articles/:slug — adapter si l'API expose un autre endpoint."""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    for method in ("PATCH", "PUT"):
        for path in (f"/api/admin/articles/{slug}", f"/api/articles/{slug}"):
            try:
                r = requests.request(method, f"{base_url}{path}",
                                     headers=headers,
                                     json={"content": new_content},
                                     timeout=20)
                if r.ok:
                    return True
            except requests.RequestException:
                continue
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", required=True)
    ap.add_argument("--token", help="Bearer token admin (requis pour --apply)")
    ap.add_argument("--slug", help="Limiter à un seul slug")
    ap.add_argument("--apply", action="store_true", help="Vraie écriture (sinon dry-run)")
    args = ap.parse_args()

    if args.slug:
        articles = [fetch_one(args.base_url, args.slug)]
    else:
        articles = fetch_articles(args.base_url, args.token)
        if not articles:
            print("Aucun article récupéré — vérifie --token et l'endpoint admin.")
            sys.exit(1)

    total = len(articles)
    print(f"=> {total} article(s) à analyser ({'APPLY' if args.apply else 'DRY-RUN'})")

    changed_count = 0
    for art in articles:
        slug = art.get("slug") or art.get("_id") or "?"
        original = art.get("content") or ""
        cleaned = sanitize(original)
        if cleaned == original:
            print(f"  [skip] {slug} (déjà propre)")
            continue
        delta = len(original) - len(cleaned)
        print(f"  [diff] {slug} : -{delta} octets")
        if args.apply:
            if not args.token:
                print("    --apply nécessite --token", file=sys.stderr)
                sys.exit(2)
            ok = update_article(args.base_url, args.token, slug, cleaned)
            print(f"    {'OK' if ok else 'FAIL'}")
            if ok:
                changed_count += 1
        else:
            changed_count += 1

    print(f"\n=> {changed_count}/{total} article(s) {'modifié(s)' if args.apply else 'à modifier'}")


if __name__ == "__main__":
    main()
