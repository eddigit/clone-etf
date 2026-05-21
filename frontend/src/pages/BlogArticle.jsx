import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Eye,
  BookOpen,
  Heart,
  ChevronUp,
  Link2,
  Check,
  List,
  Sparkles
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://etf-backend-t3j5.onrender.com';

// ---------------------------------------------------------------------------
//  SANITIZE QUILL — version 2 (mai 2026)
//  Lecture côté navigateur uniquement (DOMParser).
//  Étapes :
//   1. Décode &nbsp; / &#39; / &quot; et collapse les espaces
//   2. Pré-clean texte : convertit les "·" en début de <p> en bullets si toute
//      une suite de <p> commence par "·" (pseudo-liste Word)
//   3. Idem pour "N - texte" dans <p class="ql-indent-3"> → vraie <ol>
//   4. Parse DOM, nettoie les styles inline pourris (couleurs Word, bg blanc, font-family)
//   5. Aplatit les <li> vides en cascade (ul>li>ul>li>ul>li=réel)
//   6. Vire les <span> inutiles, les <p> vides, les images base64 cassées
// ---------------------------------------------------------------------------
const sanitizeQuillContent = (raw) => {
  if (!raw) return '';
  let html = String(raw);

  // --- 1. Décodage entités ---
  html = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/ /g, ' ')
    .replace(/&#39;/g, '’')
    .replace(/&apos;/g, '’')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"');

  // Apostrophe droite → courbe FR
  html = html.replace(/\b([ldnjcstmLDNJCSTM]|[Qq]u)'([aeiouhAEIOUH])/g, '$1’$2');

  // Collapse espaces multiples
  html = html.replace(/[ \t]{2,}/g, ' ');
  html = html
    .replace(/>\s+</g, '><')
    .replace(/(<(?:p|li|h[1-6]|strong|em|u|span|a|div)[^>]*>) +/gi, '$1')
    .replace(/ +(<\/(?:p|li|h[1-6]|strong|em|u|span|a|div)>)/gi, '$1');

  // --- 2. Pseudo-bullets « · » dans des <p> → vraie <ul> ---
  // Match : suite de <p> (avec ou sans attributs) commençant par · ou • ou ‧
  // Le HTML est déjà décodé (NBSP devenus espaces normaux)
  const bulletParaRx = /(?:<p[^>]*>\s*[·•‧]\s*[^<][\s\S]*?<\/p>\s*)+/gi;
  html = html.replace(bulletParaRx, (block) => {
    // Extraire chaque <p>...</p>
    const paras = block.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
    const items = paras
      .map(p => p.replace(/<p[^>]*>\s*[·•‧]\s*/i, '').replace(/<\/p>\s*$/i, '').trim())
      .filter(Boolean);
    if (items.length === 0) return block;
    return `<ul class="etf-pseudo-bullets">${items.map(it => `<li>${it}</li>`).join('')}</ul>`;
  });

  // --- 3. Pseudo-numérotation « 1 - … » dans <p class="ql-indent-*"> → <ol> ---
  // Pattern : 1 - texte, 2 - texte, ...  (préfixés par espace optionnel)
  // On ne traite que les blocs consécutifs (au moins 2 items, commençant par 1)
  const numParaRx = /(?:<p[^>]*class="[^"]*ql-indent-\d+[^"]*"[^>]*>\s*\d+\s*[-–]\s*[\s\S]*?<\/p>\s*){2,}/gi;
  html = html.replace(numParaRx, (block) => {
    const paras = block.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
    const items = paras
      .map(p => p.replace(/<p[^>]*>\s*\d+\s*[-–]\s*/i, '').replace(/<\/p>\s*$/i, '').trim())
      .filter(Boolean);
    if (items.length < 2) return block;
    return `<ol class="etf-pseudo-numbered">${items.map(it => `<li>${it}</li>`).join('')}</ol>`;
  });

  // --- 4. DOMParser (browser only) ---
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return html;
  }

  const parser = new window.DOMParser();
  const doc = parser.parseFromString(`<div id="__etf_root">${html}</div>`, 'text/html');
  const root = doc.getElementById('__etf_root');
  if (!root) return html;

  // --- 5. Strip styles inline imposés par Word (couleurs/bg/font-family) ---
  const BAD_COLORS = [
    /color\s*:\s*black\b/i,
    /color\s*:\s*#000(?:000)?\b/i,
    /color\s*:\s*rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)/i,
    /color\s*:\s*rgb\(\s*0\s*,\s*71\s*,\s*178\s*\)/i,
    /color\s*:\s*#0047b2\b/i,
    /color\s*:\s*blue\b/i,
  ];
  const BAD_BG = [
    /background-color\s*:\s*white\b/i,
    /background-color\s*:\s*#fff(?:fff)?\b/i,
    /background\s*:\s*white\b/i,
    /background-color\s*:\s*rgb\(\s*255\s*,\s*255\s*,\s*255\s*\)/i,
  ];
  const cleanStyle = (styleStr) => {
    if (!styleStr) return '';
    const decls = styleStr.split(';').map(s => s.trim()).filter(Boolean);
    const kept = decls.filter(decl => {
      if (/^font-family\s*:/i.test(decl)) return false;
      if (/^font-size\s*:/i.test(decl) && /\d/.test(decl)) return false;
      if (BAD_COLORS.some(rx => rx.test(decl))) return false;
      if (BAD_BG.some(rx => rx.test(decl))) return false;
      return true;
    });
    return kept.join('; ');
  };

  Array.from(root.querySelectorAll('*')).forEach(el => {
    if (el.hasAttribute && el.hasAttribute('style')) {
      const cleaned = cleanStyle(el.getAttribute('style'));
      if (cleaned) el.setAttribute('style', cleaned);
      else el.removeAttribute('style');
    }
  });

  // --- 6. Strip base64 inline images (data:image/...;base64,...) ---
  // Ces images viennent de copier-coller Word et explosent la taille du DOM.
  Array.from(root.querySelectorAll('img')).forEach(img => {
    const src = img.getAttribute('src') || '';
    if (src.startsWith('data:image/') && src.length > 1500) {
      // Image base64 énorme → remplacée par un placeholder discret
      const placeholder = doc.createElement('div');
      placeholder.className = 'etf-image-placeholder';
      placeholder.textContent = '(Image)';
      img.parentNode && img.parentNode.replaceChild(placeholder, img);
    }
  });

  // --- 7. Aplatissement des listes imbriquées vides ---
  const flattenEmptyListItems = (listRoot) => {
    let changed = true;
    let safety = 0;
    while (changed && safety < 10) {
      changed = false;
      safety++;
      const lists = listRoot.querySelectorAll('ul, ol');
      lists.forEach(list => {
        const lis = Array.from(list.children).filter(c => c.tagName === 'LI');
        lis.forEach(li => {
          const directText = Array.from(li.childNodes)
            .filter(n => !(n.nodeType === 1 && /^(UL|OL)$/.test(n.tagName)))
            .map(n => (n.textContent || '').trim())
            .join('');
          const sublists = Array.from(li.children).filter(c => /^(UL|OL)$/.test(c.tagName));
          if (!directText && sublists.length > 0) {
            sublists.forEach(sub => {
              Array.from(sub.children)
                .filter(c => c.tagName === 'LI')
                .forEach(innerLi => list.insertBefore(innerLi, li));
            });
            li.remove();
            changed = true;
          }
        });
      });
    }
  };
  flattenEmptyListItems(root);

  // --- 8. Listes vides ou items vides → suppression ---
  Array.from(root.querySelectorAll('ul, ol')).forEach(list => {
    const lis = Array.from(list.children).filter(c => c.tagName === 'LI');
    if (lis.length === 0) list.remove();
  });
  Array.from(root.querySelectorAll('li')).forEach(li => {
    if (!li.textContent || !li.textContent.trim()) li.remove();
  });

  // --- 9. Span vide / inutile → unwrap ---
  Array.from(root.querySelectorAll('span')).forEach(span => {
    const hasUsefulAttr =
      (span.hasAttribute('style') && span.getAttribute('style').trim()) ||
      (span.hasAttribute('class') && span.getAttribute('class').trim()) ||
      span.hasAttribute('id');
    if (!hasUsefulAttr) {
      const parent = span.parentNode;
      if (parent) {
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
      }
    }
  });

  // --- 10. Paragraphes vides ---
  Array.from(root.querySelectorAll('p')).forEach(p => {
    const text = (p.textContent || '').replace(/\s| /g, '');
    const hasMedia = p.querySelector('img, iframe, video, br + *');
    if (!text && !hasMedia) {
      p.remove();
    }
  });

  // --- 11. Re-sérialisation ---
  let cleaned = root.innerHTML;
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
  return cleaned;
};

// ---------------------------------------------------------------------------
// extractToc — extrait les h2/h3 du contenu nettoyé pour la table des matières
// ---------------------------------------------------------------------------
const extractToc = (html) => {
  if (!html || typeof window === 'undefined') return [];
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const headings = Array.from(doc.querySelectorAll('h2, h3'));
  const slugify = (s) =>
    s.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';
  const seen = new Set();
  return headings.map((h, i) => {
    const text = (h.textContent || '').trim();
    let id = slugify(text) || `section-${i}`;
    let candidate = id, n = 2;
    while (seen.has(candidate)) candidate = `${id}-${n++}`;
    seen.add(candidate);
    return { id: candidate, text, level: h.tagName === 'H2' ? 2 : 3 };
  }).filter(h => h.text.length > 0);
};

// ---------------------------------------------------------------------------
// injectTocAnchors — ajoute des id sur les h2/h3 du HTML rendu
// (le slug est calculé identiquement à extractToc pour matcher)
// ---------------------------------------------------------------------------
const injectTocAnchors = (html) => {
  if (!html || typeof window === 'undefined') return html;
  const parser = new window.DOMParser();
  const doc = parser.parseFromString(`<div id="__anchor_root">${html}</div>`, 'text/html');
  const root = doc.getElementById('__anchor_root');
  const slugify = (s) =>
    s.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';
  const seen = new Set();
  Array.from(root.querySelectorAll('h2, h3')).forEach((h, i) => {
    const text = (h.textContent || '').trim();
    let id = slugify(text) || `section-${i}`;
    let candidate = id, n = 2;
    while (seen.has(candidate)) candidate = `${id}-${n++}`;
    seen.add(candidate);
    h.setAttribute('id', candidate);
  });
  return root.innerHTML;
};

const BlogArticle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeTocId, setActiveTocId] = useState(null);
  const articleRef = useRef(null);

  // ---- Scroll progress + bouton retour en haut + section active TOC ----
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setReadProgress(progress);
      setShowScrollTop(scrollTop > 600);

      // TOC active section
      if (articleRef.current) {
        const headings = Array.from(articleRef.current.querySelectorAll('h2[id], h3[id]'));
        let current = null;
        for (const h of headings) {
          const top = h.getBoundingClientRect().top;
          if (top < 120) current = h.id;
          else break;
        }
        setActiveTocId(current);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article]);

  // ---- Fetch article ----
  useEffect(() => {
    if (!slug) return;
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/articles/${slug}`);
        if (!response.ok) {
          setError(response.status === 404 ? 'Article introuvable' : "Erreur lors du chargement");
          return;
        }
        const data = await response.json();
        setArticle(data);

        // Articles liés (même catégorie, 3 max)
        try {
          const params = new URLSearchParams({ status: 'published', limit: '4' });
          if (data.category) params.append('category', data.category);
          const r = await fetch(`${API_URL}/api/articles?${params.toString()}`);
          if (r.ok) {
            const rd = await r.json();
            const list = (rd.articles || []).filter(a => a.slug !== slug).slice(0, 3);
            setRelated(list);
          }
        } catch (_) { /* silencieux */ }
      } catch (err) {
        setError("Impossible de charger l'article");
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [slug]);

  // ---- Contenu HTML traité (sanitize + ancres TOC + URLs images) ----
  const articleHtml = useMemo(() => {
    if (!article?.content) return '';
    let html = sanitizeQuillContent(article.content);
    // Préfixer les URLs images relatives (uploads)
    html = html.replace(/src="(\/uploads\/[^"]+)"/g, `src="${API_URL}$1"`);
    // Convertir les iframes YouTube en wrapper responsive
    html = html.replace(
      /<iframe([^>]*src="[^"]*(?:youtube\.com|youtu\.be)[^"]*"[^>]*)><\/iframe>/gi,
      (m, attrs) => `<div class="etf-yt-wrap"><iframe${attrs} allowfullscreen loading="lazy"></iframe></div>`
    );
    // Liens YouTube seuls dans un <p> → embed
    html = html.replace(
      /<p[^>]*>\s*(?:<a[^>]*>)?\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{10,15})[^\s<]*)\s*(?:<\/a>)?\s*<\/p>/gi,
      (m, url, id) =>
        `<div class="etf-yt-wrap"><iframe src="https://www.youtube.com/embed/${id}?rel=0&modestbranding=1" title="Vidéo YouTube" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
    );
    // Ancres pour TOC
    html = injectTocAnchors(html);
    return html;
  }, [article]);

  const toc = useMemo(() => extractToc(articleHtml), [articleHtml]);

  // ---- Helpers ----
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
    return url;
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = article?.title || '';
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter:  `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
    };
    if (urls[platform]) window.open(urls[platform], '_blank', 'width=600,height=420');
  };

  const copyToClipboard = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const scrollToToc = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  // ---- Loading / Error ----
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-stone-500">
          <div className="h-5 w-5 rounded-full border-2 border-stone-200 border-t-emerald-500 animate-spin" />
          <span className="text-sm tracking-wide">Chargement…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto mb-5">
            <BookOpen className="h-6 w-6 text-stone-400" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-900 mb-2 etf-serif">{error}</h1>
          <p className="text-stone-500 mb-7">L'article que vous recherchez est introuvable ou a été déplacé.</p>
          <Button onClick={() => navigate('/blog')} className="bg-stone-900 hover:bg-stone-800 text-white rounded-full px-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour au blog
          </Button>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="etf-article bg-stone-50">
      {/* ============================================================
          Barre de progression de lecture — fine, élégante
          ============================================================ */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-stone-200/40 z-[60]">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
          style={{ width: `${readProgress}%`, transition: 'width 120ms linear' }}
        />
      </div>

      {/* ============================================================
          HERO — dark immersif, image full-bleed, titre serif énorme
          Cohérent avec le ton dark slate de la home
          ============================================================ */}
      <header className="relative bg-slate-950 text-white overflow-hidden">
        {/* Bouton retour flottant */}
        <button
          onClick={() => navigate('/blog')}
          className="absolute top-5 left-5 md:top-7 md:left-7 z-20 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white/90 hover:bg-white/20 hover:text-white transition-all text-xs font-medium tracking-wide uppercase"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Blog
        </button>

        {article.featuredImage ? (
          <>
            {/* Image full-bleed */}
            <div className="absolute inset-0">
              <img
                src={getFullImageUrl(article.featuredImage)}
                alt={article.title}
                className="w-full h-full object-cover opacity-55"
              />
              {/* Gradient lisibilité */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/55 to-slate-950" />
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-transparent to-slate-950/0" />
              {/* Grain léger (radial subtil) */}
              <div className="absolute inset-0 opacity-[0.06]" style={{
                backgroundImage: 'radial-gradient(circle at 25% 30%, rgba(16,185,129,0.5) 0%, transparent 40%)'
              }} />
            </div>
          </>
        ) : (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40" />
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage:
                'radial-gradient(800px 400px at 80% 0%, rgba(16,185,129,0.18) 0%, transparent 60%),' +
                'radial-gradient(600px 300px at 10% 100%, rgba(16,185,129,0.10) 0%, transparent 60%)'
            }} />
          </div>
        )}

        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 pt-28 md:pt-36 pb-20 md:pb-28">
          {/* Catégorie + badge meta */}
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
              <span className="h-px w-8 bg-emerald-400/60" />
              {article.category || 'Article'}
            </div>
          </div>

          {/* Titre — Source Serif premium */}
          <h1 className="etf-serif text-[2.1rem] leading-[1.12] sm:text-[2.6rem] md:text-[3.25rem] md:leading-[1.08] font-medium tracking-[-0.02em] text-white mb-7">
            {article.title}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-lg md:text-xl text-stone-300/90 leading-[1.55] font-light max-w-2xl mb-9">
              {article.excerpt}
            </p>
          )}

          {/* Métadonnées */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400/90 to-emerald-700 ring-2 ring-white/10 flex items-center justify-center text-white font-semibold text-sm">
                {(article.author || 'E').charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="text-white font-medium">{article.author || 'En Toute Franchise'}</div>
                <div className="text-stone-400 text-[11px] uppercase tracking-wider">Auteur</div>
              </div>
            </div>
            <span className="h-4 w-px bg-white/15" />
            <div className="flex items-center gap-1.5 text-stone-300">
              <Calendar className="h-3.5 w-3.5 text-emerald-400/80" />
              <span>{formatDate(article.publishedAt || article.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-300">
              <Clock className="h-3.5 w-3.5 text-emerald-400/80" />
              <span>{article.readTime || '5 min'}</span>
            </div>
            {article.views > 0 && (
              <div className="flex items-center gap-1.5 text-stone-300">
                <Eye className="h-3.5 w-3.5 text-emerald-400/80" />
                <span>{article.views.toLocaleString('fr-FR')} lectures</span>
              </div>
            )}
          </div>
        </div>

        {/* Liaison hero → corps : courbe subtile */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-stone-50" style={{
          clipPath: 'ellipse(75% 100% at 50% 100%)'
        }} />
      </header>

      {/* ============================================================
          CORPS — éditorial premium 3 colonnes desktop
          [TOC] [Article] [Share]
          ============================================================ */}
      <div className="relative">
        <div className="max-w-[1180px] mx-auto px-5 sm:px-8 lg:px-10 py-14 md:py-20">
          <div className="lg:grid lg:grid-cols-[180px_minmax(0,1fr)_72px] lg:gap-10 xl:grid-cols-[200px_minmax(0,1fr)_88px] xl:gap-14">

            {/* ---------- TOC desktop (gauche, sticky) ---------- */}
            <aside className="hidden lg:block">
              {toc.length > 1 && (
                <div className="sticky top-24">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400 mb-4 flex items-center gap-2">
                    <List className="h-3 w-3" />
                    Sommaire
                  </div>
                  <nav className="space-y-1">
                    {toc.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => scrollToToc(h.id)}
                        className={`block w-full text-left text-[13px] leading-snug py-1.5 pl-3 border-l transition-all ${
                          activeTocId === h.id
                            ? 'border-emerald-500 text-stone-900 font-medium'
                            : 'border-stone-200 text-stone-500 hover:text-stone-800 hover:border-stone-400'
                        } ${h.level === 3 ? 'pl-5 text-[12px]' : ''}`}
                      >
                        {h.text}
                      </button>
                    ))}
                  </nav>
                </div>
              )}
            </aside>

            {/* ---------- Colonne centrale : ARTICLE ---------- */}
            <article className="min-w-0">
              {/* Corps de l'article */}
              <div
                ref={articleRef}
                className="etf-article-body"
                dangerouslySetInnerHTML={{ __html: articleHtml }}
              />

              {/* CTA livre (opt-in) */}
              {article.showBookCta && (
                <div className="my-14 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 border border-emerald-200/70 p-6 md:p-7">
                  <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                    <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center text-2xl shadow-lg shadow-emerald-900/15">
                      <BookOpen className="h-7 w-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="etf-serif text-2xl font-medium text-stone-900 leading-tight">418 Milliards</div>
                      <div className="text-stone-600 text-sm mt-0.5">La fraude de la grande distribution — M. Donnette, C. Diot, P. Pasin</div>
                    </div>
                    <a
                      href="https://www.novimondi.com/fr/societe/47-418-milliards-la-fraude-de-la-grande-distribution-avec-la-complicite-des-elus-et-de-l-administration.html"
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all"
                    >
                      Commander
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Séparateur éditorial */}
              <div className="my-14 flex items-center justify-center gap-3 text-stone-300">
                <span className="h-px w-12 bg-stone-200" />
                <span className="text-stone-400 text-[10px] uppercase tracking-[0.4em] font-semibold">En Toute Franchise</span>
                <span className="h-px w-12 bg-stone-200" />
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="mb-14 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center text-[12px] text-stone-600 bg-white border border-stone-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/40 px-3 py-1 rounded-full transition-colors cursor-default"
                    >
                      <span className="text-stone-400 mr-1">#</span>{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Partage mobile/tablet (sous l'article) */}
              <div className="lg:hidden mb-14 rounded-2xl bg-white border border-stone-200 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-500 mb-4 flex items-center gap-2">
                  <Share2 className="h-3 w-3" /> Partager cet article
                </div>
                <div className="flex items-center gap-2">
                  <ShareBtn onClick={() => handleShare('facebook')} icon={<Facebook className="h-4 w-4" />} label="Facebook" />
                  <ShareBtn onClick={() => handleShare('twitter')} icon={<Twitter className="h-4 w-4" />} label="Twitter" />
                  <ShareBtn onClick={() => handleShare('linkedin')} icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" />
                  <ShareBtn onClick={copyToClipboard} icon={copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />} label={copied ? 'Copié' : 'Lien'} />
                </div>
              </div>

              {/* CTA fin d'article */}
              <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-8 md:p-12 mb-16 border border-slate-800">
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-emerald-400/10 blur-3xl" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-emerald-400 font-semibold mb-5">
                    <Sparkles className="h-3 w-3" /> Passons à l'action
                  </div>
                  <h3 className="etf-serif text-3xl md:text-[2.25rem] leading-[1.15] font-medium mb-4 max-w-lg">
                    Besoin d'un appui face à un litige commercial&nbsp;?
                  </h3>
                  <p className="text-stone-300 leading-relaxed max-w-xl mb-7">
                    En Toute Franchise accompagne les commerçants et artisans depuis plus de 30 ans. Une équipe, un réseau d'avocats partenaires et trois décennies de jurisprudence à votre service.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/adhesion" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-6 py-3 rounded-full transition-all">
                      Devenir adhérent
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                    <Link to="/contact" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium px-6 py-3 rounded-full transition-all backdrop-blur-sm">
                      Nous contacter
                    </Link>
                  </div>
                </div>
              </div>

              {/* Articles liés */}
              {related.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-end justify-between mb-7">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700 mb-2">À lire ensuite</div>
                      <h2 className="etf-serif text-2xl md:text-3xl font-medium text-stone-900 leading-tight">
                        Continuer la lecture
                      </h2>
                    </div>
                    <Link to="/blog" className="hidden sm:inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-emerald-700 transition-colors">
                      Voir tout <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                  <div className="grid md:grid-cols-3 gap-5">
                    {related.map((a) => (
                      <Link to={`/blog/${a.slug}`} key={a.slug} className="group block">
                        <div className="aspect-[16/10] rounded-xl overflow-hidden bg-stone-100 mb-3.5 ring-1 ring-stone-200/60">
                          {a.featuredImage ? (
                            <img src={getFullImageUrl(a.featuredImage)} alt={a.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-stone-100 to-stone-200" />
                          )}
                        </div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 mb-1.5">
                          {a.category || 'Article'}
                        </div>
                        <h3 className="etf-serif text-lg font-medium text-stone-900 leading-snug group-hover:text-emerald-800 transition-colors mb-2 line-clamp-2">
                          {a.title}
                        </h3>
                        <div className="text-xs text-stone-500 flex items-center gap-3">
                          <span>{formatDate(a.publishedAt || a.createdAt)}</span>
                          {a.readTime && <span>· {a.readTime}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* ---------- Share desktop (droite, sticky) ---------- */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 flex flex-col gap-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-400 mb-1 text-center">
                  Partager
                </div>
                <SideShare onClick={() => handleShare('facebook')} title="Facebook"><Facebook className="h-4 w-4" /></SideShare>
                <SideShare onClick={() => handleShare('twitter')} title="X / Twitter"><Twitter className="h-4 w-4" /></SideShare>
                <SideShare onClick={() => handleShare('linkedin')} title="LinkedIn"><Linkedin className="h-4 w-4" /></SideShare>
                <div className="my-1 h-px w-6 bg-stone-200 mx-auto" />
                <SideShare onClick={copyToClipboard} title={copied ? 'Lien copié' : 'Copier le lien'}>
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
                </SideShare>
              </div>
            </aside>

          </div>
        </div>
      </div>

      {/* Bouton retour en haut */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-slate-950 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-slate-900/20 hover:shadow-emerald-500/30 transition-all"
          title="Retour en haut"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

// ---------- Petits composants utilitaires ----------
const ShareBtn = ({ onClick, icon, label }) => (
  <button
    onClick={onClick}
    className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 border border-stone-200 hover:border-emerald-200 transition-all text-xs font-medium"
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const SideShare = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className="w-10 h-10 rounded-full bg-white border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 text-stone-500 hover:text-emerald-700 flex items-center justify-center mx-auto transition-all"
  >
    {children}
  </button>
);

export default BlogArticle;
