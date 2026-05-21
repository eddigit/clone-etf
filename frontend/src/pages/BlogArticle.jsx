import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Tag,
  Eye,
  BookOpen,
  Heart,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://etf-backend-t3j5.onrender.com';

const BlogArticle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [copied, setCopied] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  // Gestion du scroll pour la barre de progression et le bouton retour en haut
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setReadProgress(progress);
      setShowScrollTop(scrollTop > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fonction pour obtenir l'URL complète d'une image
  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/uploads/')) {
      return `${API_URL}${url}`;
    }
    return url;
  };

  // Fonction pour extraire l'ID YouTube de différents formats d'URL
  const extractYouTubeId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{10,15})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Créer une vignette YouTube cliquable (thumbnail + bouton play)
  const createYouTubeThumbnail = (videoId, youtubeUrl) => {
    const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const videoLink = youtubeUrl || `https://www.youtube.com/watch?v=${videoId}`;
    return `<a href="${videoLink}" target="_blank" rel="noopener noreferrer" style="display:block;position:relative;border-radius:8px;overflow:hidden;text-decoration:none;">` +
      `<img src="${thumbUrl}" alt="Vidéo YouTube" style="width:100%;height:180px;object-fit:cover;display:block;">` +
      `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.25);">` +
      `<div style="width:52px;height:52px;background:rgba(255,0,0,0.9);border-radius:50%;display:flex;align-items:center;justify-content:center;">` +
      `<div style="width:0;height:0;border-style:solid;border-width:10px 0 10px 20px;border-color:transparent transparent transparent white;margin-left:4px;"></div>` +
      `</div></div></a>`;
  };

  // Créer l'embed YouTube avec un design moderne
  const createYouTubeEmbed = (videoId) => {
    return `
      <div class="youtube-container my-8">
        <div class="youtube-wrapper">
          <iframe 
            src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1" 
            title="Vidéo YouTube" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>
      </div>
    `;
  };

  // ---------------------------------------------------------------------------
  // SANITIZATION QUILL : nettoie le HTML pollué par les copier-coller Word/GDocs
  // ---------------------------------------------------------------------------
  // Étapes (dans l'ordre) :
  //  1. Décode &nbsp; / U+00A0 / &#39; / &quot; / &#160; et collapse les espaces
  //  2. Parse avec DOMParser pour manipuler l'arbre proprement
  //  3. Nettoie les styles inline imposés par Word (couleurs, font-family, bg)
  //  4. Aplatit les listes Quill imbriquées vides (<ul><li><ul>...</ul></li></ul>)
  //  5. Supprime les <span> devenus inutiles (sans attribut utile)
  //  6. Re-sérialise et applique quelques règles typographiques françaises
  // ---------------------------------------------------------------------------
  const sanitizeQuillContent = (raw) => {
    if (!raw) return '';
    let html = String(raw);

    // 1. Décodage des entités d'espace + apostrophes / guillemets
    html = html
      .replace(/&nbsp;/g, ' ')
      .replace(/&#160;/g, ' ')
      .replace(/ /g, ' ')         // NBSP unicode
      .replace(/&#39;/g, '’')     // ' → ’ (apostrophe typographique)
      .replace(/&apos;/g, '’')
      .replace(/&quot;/g, '"')
      .replace(/&#34;/g, '"');

    // Apostrophe droite → courbe dans les contextes français usuels
    // (après l/d/n/qu/j/c/s/t/m + voyelle, ex: l'union → l’union)
    html = html.replace(/\b([ldnjcstmLDNJCSTM]|[Qq]u)'([aeiouhAEIOUH])/g, '$1’$2');

    // Collapse espaces multiples (pas dans les <pre>, qu'on n'a pas ici)
    html = html.replace(/[ \t]{2,}/g, ' ');
    // Trim espaces collés aux balises ouvrantes/fermantes courantes
    html = html
      .replace(/>\s+</g, '><')                 // entre deux balises
      .replace(/(<(?:p|li|h[1-6]|strong|em|u|span|a|div)[^>]*>) +/gi, '$1')
      .replace(/ +(<\/(?:p|li|h[1-6]|strong|em|u|span|a|div)>)/gi, '$1');

    // 2. Parse DOM (côté client uniquement — sinon on retourne le HTML déjà clean)
    if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
      return html;
    }

    const parser = new window.DOMParser();
    // wrapper pour éviter qu'un fragment soit promu <html>
    const doc = parser.parseFromString(`<div id="__quill_root">${html}</div>`, 'text/html');
    const root = doc.getElementById('__quill_root');
    if (!root) return html;

    // 3. Nettoyage styles inline + attributs problématiques
    const BAD_COLORS = [
      /color\s*:\s*black\b/i,
      /color\s*:\s*#000(?:000)?\b/i,
      /color\s*:\s*rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)/i,
      /color\s*:\s*rgb\(\s*0\s*,\s*71\s*,\s*178\s*\)/i,   // bleu Word
      /color\s*:\s*#0047b2\b/i,
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
        if (/^font-family\s*:/i.test(decl)) return false;        // imposé par Word
        if (BAD_COLORS.some(rx => rx.test(decl))) return false;
        if (BAD_BG.some(rx => rx.test(decl))) return false;
        return true;
      });
      return kept.join('; ');
    };

    const allElements = root.querySelectorAll('*');
    allElements.forEach(el => {
      if (el.hasAttribute('style')) {
        const cleaned = cleanStyle(el.getAttribute('style'));
        if (cleaned) {
          el.setAttribute('style', cleaned);
        } else {
          el.removeAttribute('style');
        }
      }
    });

    // 4. Aplatissement des listes Quill imbriquées vides
    // Pattern Quill : <ul><li>texte<ul><li><ul><li>réel</li></ul></li></ul></li></ul>
    // Règle : si un <li> ne contient QUE des sous-listes (pas de texte direct),
    // on remonte ses sous-<li> au niveau du <ul> parent du <li>.
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
            // Texte direct du <li> (hors sous-listes)
            const directText = Array.from(li.childNodes)
              .filter(n => !(n.nodeType === 1 && /^(UL|OL)$/.test(n.tagName)))
              .map(n => (n.textContent || '').trim())
              .join('');
            const sublists = Array.from(li.children).filter(c => /^(UL|OL)$/.test(c.tagName));
            if (!directText && sublists.length > 0) {
              // Remonter les <li> des sous-listes au parent direct
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

    // 5. Supprimer les <span> sans attribut utile (déballe le texte)
    const spans = Array.from(root.querySelectorAll('span'));
    spans.forEach(span => {
      const hasUsefulAttr =
        (span.hasAttribute('style') && span.getAttribute('style').trim()) ||
        span.hasAttribute('class') ||
        span.hasAttribute('id');
      if (!hasUsefulAttr) {
        const parent = span.parentNode;
        while (span.firstChild) parent.insertBefore(span.firstChild, span);
        parent.removeChild(span);
      }
    });

    // 6. Re-sérialisation : on récupère uniquement le innerHTML du wrapper
    let cleaned = root.innerHTML;
    // Petit cleanup final post-DOM (le browser peut ré-introduire des espaces)
    cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
    return cleaned;
  };

  // Fonction pour préfixer les URLs relatives d'images dans le contenu HTML
  // et convertir les liens YouTube en iframes
  const processContent = (htmlContent) => {
    if (!htmlContent) return '';
    // Sanitization Quill EN PREMIER (avant transformations YouTube/images)
    htmlContent = sanitizeQuillContent(htmlContent);

    // IMAGE + VIDÉO côte à côte : image et lien YouTube dans le même paragraphe
    htmlContent = htmlContent.replace(
      /<p>\s*(<img[^>]+>)\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\|youtube\.com\/embed\/)([a-zA-Z0-9_-]{10,15})[^\s<]*)\s*<\/p>/gi,
      (match, img, ytUrl, videoId) => {
        const thumb = createYouTubeThumbnail(videoId, ytUrl);
        return `<div style="display:flex;gap:8px;margin:1rem 0;">` +
          `<div style="flex:1;"><img ${img.replace(/^<img/,'').replace(/>$/,'')} style="width:100%;height:180px;object-fit:cover;border-radius:6px;display:block;"></div>` +
          `<div style="flex:1;">${thumb}</div></div>`;
      }
    );
    htmlContent = htmlContent.replace(
      /<p>\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\|youtube\.com\/embed\/)([a-zA-Z0-9_-]{10,15})[^\s<]*)\s*(<img[^>]+>)\s*<\/p>/gi,
      (match, ytUrl, videoId, img) => {
        const thumb = createYouTubeThumbnail(videoId, ytUrl);
        return `<div style="display:flex;gap:8px;margin:1rem 0;">` +
          `<div style="flex:1;">${thumb}</div>` +
          `<div style="flex:1;"><img ${img.replace(/^<img/,'').replace(/>$/,'')} style="width:100%;height:180px;object-fit:cover;border-radius:6px;display:block;"></div></div>`;
      }
    );

    // AUTO-GRILLE : plusieurs images dans le même paragraphe → affichage côte à côte
    // 2 images dans un <p> → grille 2 colonnes
    htmlContent = htmlContent.replace(
      /<p>\s*(<img[^>]+>)\s*(<img[^>]+>)\s*<\/p>/gi,
      (match, img1, img2) =>
        `<div style="display:flex;gap:8px;margin:1rem 0;">` +
        `<div style="flex:1;"><img ${img1.replace(/^<img/,'').replace(/>$/,'')} style="width:100%;height:180px;object-fit:cover;border-radius:6px;display:block;"></div>` +
        `<div style="flex:1;"><img ${img2.replace(/^<img/,'').replace(/>$/,'')} style="width:100%;height:180px;object-fit:cover;border-radius:6px;display:block;"></div>` +
        `</div>`
    );
    // 3 images dans un <p> → grille 3 colonnes
    htmlContent = htmlContent.replace(
      /<p>\s*(<img[^>]+>)\s*(<img[^>]+>)\s*(<img[^>]+>)\s*<\/p>/gi,
      (match, img1, img2, img3) =>
        `<div style="display:flex;gap:8px;margin:1rem 0;">` +
        `<div style="flex:1;"><img ${img1.replace(/^<img/,'').replace(/>$/,'')} style="width:100%;height:160px;object-fit:cover;border-radius:6px;display:block;"></div>` +
        `<div style="flex:1;"><img ${img2.replace(/^<img/,'').replace(/>$/,'')} style="width:100%;height:160px;object-fit:cover;border-radius:6px;display:block;"></div>` +
        `<div style="flex:1;"><img ${img3.replace(/^<img/,'').replace(/>$/,'')} style="width:100%;height:160px;object-fit:cover;border-radius:6px;display:block;"></div>` +
        `</div>`
    );
    // Supprimer white-space: pre-wrap des styles inline (cause débordement mobile)
    htmlContent = htmlContent.replace(/white-space\s*:\s*pre-wrap/gi, 'white-space: normal');
    htmlContent = htmlContent.replace(/white-space\s*:\s*pre/gi, 'white-space: normal');

    // Remplacer les src d'images relatives par des URLs complètes
    let processed = htmlContent.replace(
      /src="(\/uploads\/[^"]+)"/g,
      `src="${API_URL}$1"`
    );

    // Traiter les iframes Quill (ql-video) - s'assurer qu'elles ont les bons attributs
    processed = processed.replace(
      /<iframe([^>]*class="[^"]*ql-video[^"]*"[^>]*)><\/iframe>/gi,
      (match, attrs) => {
        // Extraire l'URL src
        const srcMatch = attrs.match(/src="([^"]+)"/);
        if (srcMatch) {
          const videoId = extractYouTubeId(srcMatch[1]);
          if (videoId) {
            return createYouTubeEmbed(videoId);
          }
        }
        // Si pas YouTube, retourner l'iframe avec les bons attributs
        return `<div class="youtube-container my-8"><div class="youtube-wrapper"><iframe${attrs} allowfullscreen loading="lazy"></iframe></div></div>`;
      }
    );

    // Traiter aussi les iframes sans classe ql-video mais avec YouTube
    processed = processed.replace(
      /<iframe([^>]*src="[^"]*(?:youtube\.com|youtu\.be)[^"]*"[^>]*)><\/iframe>/gi,
      (match, attrs) => {
        const srcMatch = attrs.match(/src="([^"]+)"/);
        if (srcMatch) {
          const videoId = extractYouTubeId(srcMatch[1]);
          if (videoId) {
            return createYouTubeEmbed(videoId);
          }
        }
        return match;
      }
    );

    // Convertir les liens YouTube en iframes responsives
    // Format: [youtube:VIDEO_ID] ou [youtube:URL_COMPLETE]
    processed = processed.replace(
      /\[youtube:([^\]]+)\]/g,
      (match, videoIdOrUrl) => {
        const videoId = extractYouTubeId(videoIdOrUrl) || videoIdOrUrl;
        return createYouTubeEmbed(videoId);
      }
    );

    // Détecter automatiquement les URLs YouTube dans les paragraphes (URLs seules)
    processed = processed.replace(
      /<p>\s*(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})[^\s<]*)\s*<\/p>/gi,
      (match, url, videoId) => createYouTubeEmbed(videoId)
    );

    // Convertir TOUS les liens YouTube en embed (watch, youtu.be, /embed/)
    processed = processed.replace(
      /<a[^>]*href="(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})[^"]*)"[^>]*>([^<]*)<\/a>/gi,
      (match, url, videoId) => createYouTubeEmbed(videoId)
    );
    // URLs embed en texte brut dans un paragraphe
    processed = processed.replace(
      /<p>\s*(https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})[^\s<]*)\s*<\/p>/gi,
      (match, url, videoId) => createYouTubeEmbed(videoId)
    );

    return processed;
  };

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/articles/${slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Article non trouve');
          } else {
            setError('Erreur lors du chargement de l\'article');
          }
          return;
        }

        const data = await response.json();
        setArticle(data);
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Impossible de charger l\'article');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = article?.title || '';

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-900/40 border-t-emerald-400 mx-auto"></div>
            <BookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-emerald-400" />
          </div>
          <p className="mt-6 text-gray-400 font-medium">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">{error}</h1>
          <p className="text-gray-400 mb-8 text-lg">L'article que vous recherchez n'existe pas ou a été supprimé.</p>
          <Button
            onClick={() => navigate('/blog')}
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl shadow-emerald-500/20"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour au blog
          </Button>
        </div>
      </div>
    );
  }

  if (!article) return null;

  // NOTE: `dangerouslySetInnerHTML` est utilisé pour le contenu rédigé via Quill
  // (déjà présent dans le code legacy). Le contenu provient de l'API back-office
  // contrôlée par l'admin du site — pas d'input utilisateur libre.
  const articleHtml = processContent(article.content);

  return (
    <div className="etf-article min-h-screen">
      {/* Barre de progression de lecture — gradient vert MyBotIA */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-slate-200/60 z-50">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-green-600 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* ============================================================
          HERO DARK FULL-BLEED — continuité visuelle avec Home dark
          ============================================================ */}
      <div className="relative bg-slate-950">
        {article.featuredImage ? (
          <div className="h-[55vh] md:h-[72vh] overflow-hidden relative">
            <img
              src={article.featuredImage.startsWith('http') ? article.featuredImage : `${API_URL}${article.featuredImage}`}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            {/* Overlay dégradé multi-couche pour lisibilité titre */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-transparent"></div>

            {/* Contenu sur l'image */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
              <div className="max-w-3xl mx-auto">
                {/* Catégorie et tags */}
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  <Badge className="bg-emerald-500/15 backdrop-blur-md text-emerald-300 border border-emerald-400/40 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider">
                    {article.category}
                  </Badge>
                  {article.tags && article.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="bg-white/5 backdrop-blur-md text-gray-200 border-white/15 text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Titre — serif premium */}
                <h1
                  className="text-3xl md:text-5xl lg:text-[3.5rem] font-bold text-white mb-5 leading-[1.1] tracking-tight"
                  style={{ fontFamily: '"Source Serif 4", "Charter", Georgia, ui-serif, serif' }}
                >
                  {article.title}
                </h1>

                {/* Extrait */}
                {article.excerpt && (
                  <p className="text-lg md:text-xl text-gray-300 mb-7 max-w-2xl leading-relaxed font-light">
                    {article.excerpt}
                  </p>
                )}

                {/* Métadonnées */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-300">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white font-bold ring-2 ring-emerald-400/30">
                      {article.author?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <p className="text-white font-medium leading-tight">{article.author}</p>
                      <p className="text-gray-400 text-xs">Auteur</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-400/70" />
                    <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-emerald-400/70" />
                    <span>{article.readTime}</span>
                  </div>
                  {article.views > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-emerald-400/70" />
                      <span>{article.views.toLocaleString()} vues</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Header sans image — dark slate cohérent avec Home
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 py-20 md:py-28 border-b border-slate-800">
            <div className="max-w-3xl mx-auto px-6">
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                <Badge className="bg-emerald-500/15 backdrop-blur-md text-emerald-300 border border-emerald-400/40 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider">
                  {article.category}
                </Badge>
              </div>
              <h1
                className="text-3xl md:text-5xl lg:text-[3.25rem] font-bold text-white mb-5 leading-[1.1] tracking-tight"
                style={{ fontFamily: '"Source Serif 4", "Charter", Georgia, ui-serif, serif' }}
              >
                {article.title}
              </h1>
              {article.excerpt && (
                <p className="text-lg md:text-xl text-gray-300 mb-7 max-w-2xl leading-relaxed font-light">
                  {article.excerpt}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-400/70" />
                  <span>{article.author}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-400/70" />
                  <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-emerald-400/70" />
                  <span>{article.readTime}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton retour flottant — verre dépoli */}
        <div className="absolute top-4 left-4 z-10 md:top-6 md:left-6">
          <Button
            variant="secondary"
            onClick={() => navigate('/blog')}
            className="shadow-xl bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>

      {/* ============================================================
          CONTENU ARTICLE — Light éditorial premium
          ============================================================ */}
      <div className="relative">
        {/* Barre de partage flottante (desktop) — palette claire cohérente */}
        <div className="hidden xl:flex fixed left-8 top-1/2 transform -translate-y-1/2 flex-col gap-3 z-40">
          <div className="bg-white rounded-full shadow-xl ring-1 ring-slate-200 p-2 flex flex-col gap-2">
            <button
              onClick={() => handleShare('facebook')}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-600 flex items-center justify-center transition-all hover:scale-110"
              title="Partager sur Facebook"
            >
              <Facebook className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-600 flex items-center justify-center transition-all hover:scale-110"
              title="Partager sur Twitter"
            >
              <Twitter className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-600 flex items-center justify-center transition-all hover:scale-110"
              title="Partager sur LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </button>
            <div className="w-6 h-px bg-slate-200 mx-auto my-1"></div>
            <button
              onClick={copyToClipboard}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-600 flex items-center justify-center transition-all hover:scale-110"
              title="Copier le lien"
            >
              {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Article principal — largeur lecture optimale (~720px) */}
        <article className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-10 py-14 md:py-20 pb-24">
          {/* Corps de l'article — typographie serif premium */}
          <div
            className="etf-article-body article-content max-w-none mb-12"
            style={{ whiteSpace: 'normal', overflowX: 'hidden', wordBreak: 'normal', overflowWrap: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: articleHtml }}
          />

          {/* 📚 Encart livre 418 Milliards — opt-in via article.showBookCta */}
          {article.showBookCta && (
            <div className="my-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/60 shadow-sm">
              <div className="flex-1 min-w-0">
                <div
                  className="font-bold text-slate-900 text-2xl mb-1"
                  style={{ fontFamily: '"Source Serif 4", Georgia, ui-serif, serif' }}
                >
                  📕 418 Milliards
                </div>
                <div className="text-slate-700 text-lg mb-1">La fraude de la grande distribution</div>
                <div className="text-slate-500 text-sm">Martine Donnette &amp; Claude Diot, avec Patrick Pasin</div>
              </div>
              <a
                href="https://www.novimondi.com/fr/societe/47-418-milliards-la-fraude-de-la-grande-distribution-avec-la-complicite-des-elus-et-de-l-administration.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-base font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 whitespace-nowrap"
              >
                Commander le livre
              </a>
            </div>
          )}

          {/* Séparateur décoratif éditorial */}
          <div className="flex items-center justify-center gap-3 my-12 text-slate-300">
            <span className="h-px w-12 bg-slate-300"></span>
            <span className="text-emerald-500 text-xs tracking-[0.4em] font-semibold">EN TOUTE FRANCHISE</span>
            <span className="h-px w-12 bg-slate-300"></span>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-slate-400" />
                {article.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-transparent hover:border-emerald-200 transition-all cursor-pointer"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Section de partage (mobile/tablette) */}
          <div className="xl:hidden bg-slate-50 rounded-2xl p-6 mb-12 border border-slate-100">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-4 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Partager cet article
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleShare('facebook')}
                className="flex-1 py-3 rounded-xl bg-white hover:bg-emerald-500 hover:text-white text-slate-700 border border-slate-200 flex items-center justify-center gap-2 transition-all"
              >
                <Facebook className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="flex-1 py-3 rounded-xl bg-white hover:bg-emerald-500 hover:text-white text-slate-700 border border-slate-200 flex items-center justify-center gap-2 transition-all"
              >
                <Twitter className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="flex-1 py-3 rounded-xl bg-white hover:bg-emerald-500 hover:text-white text-slate-700 border border-slate-200 flex items-center justify-center gap-2 transition-all"
              >
                <Linkedin className="h-5 w-5" />
              </button>
              <button
                onClick={copyToClipboard}
                className="py-3 px-4 rounded-xl bg-white hover:bg-emerald-500 hover:text-white text-slate-700 border border-slate-200 flex items-center justify-center transition-all"
              >
                {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* CTA final — dark slate cohérent avec le reste du site */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 rounded-3xl p-8 md:p-12 text-center border border-slate-800">
            {/* Décoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-emerald-500/15 backdrop-blur-sm border border-emerald-400/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-emerald-400" />
              </div>
              <h3
                className="text-2xl md:text-3xl font-bold text-white mb-3"
                style={{ fontFamily: '"Source Serif 4", Georgia, ui-serif, serif' }}
              >
                Besoin d'aide pour votre activité ?
              </h3>
              <p className="text-gray-300 mb-8 text-lg max-w-xl mx-auto leading-relaxed">
                En Toute Franchise Association accompagne les commerçants et artisans depuis plus de 30 ans.
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link to="/adhesion">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl shadow-emerald-500/30 px-8 transition-all transform hover:scale-105"
                  >
                    Devenir adhérent
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 px-8"
                  >
                    Nous contacter
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Bouton retour en haut */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-full shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-all hover:scale-110 z-40"
          title="Retour en haut"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default BlogArticle;
