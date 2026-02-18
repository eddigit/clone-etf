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

const API_URL = process.env.REACT_APP_API_URL || 'https://clone-etf.onrender.com';

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
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
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

  // Fonction pour préfixer les URLs relatives d'images dans le contenu HTML
  // et convertir les liens YouTube en iframes
  const processContent = (htmlContent) => {
    if (!htmlContent) return '';
    // CORRECTIF PRINCIPAL : remplacer &nbsp; par des espaces normaux
    // Le contenu Quill sauvegarde tous les espaces en &nbsp; ce qui empêche
    // le retour à la ligne automatique → texte en une seule ligne horizontale
    htmlContent = htmlContent.replace(/&nbsp;/g, ' ');
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

    // Détecter les liens YouTube cliquables et les convertir
    processed = processed.replace(
      /<a[^>]*href="(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})[^"]*)"[^>]*>([^<]*)<\/a>/gi,
      (match, url, videoId, linkText) => {
        if (linkText.includes('youtube') || linkText.includes('youtu.be') || linkText === url) {
          return createYouTubeEmbed(videoId);
        }
        return match;
      }
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <BookOpen className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600" />
          </div>
          <p className="mt-6 text-gray-500 font-medium">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{error}</h1>
          <p className="text-gray-600 mb-8 text-lg">L'article que vous recherchez n'existe pas ou a été supprimé.</p>
          <Button onClick={() => navigate('/blog')} size="lg" className="shadow-lg">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Retour au blog
          </Button>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Barre de progression de lecture */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Hero immersif */}
      <div className="relative">
        {article.featuredImage ? (
          <div className="h-[50vh] md:h-[70vh] overflow-hidden relative">
            <img
              src={article.featuredImage.startsWith('http') ? article.featuredImage : `${API_URL}${article.featuredImage}`}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            
            {/* Contenu sur l'image */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
              <div className="max-w-4xl mx-auto">
                {/* Catégorie et tags */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-sm font-semibold">
                    {article.category}
                  </Badge>
                  {article.tags && article.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="bg-white/10 backdrop-blur-sm text-white border-white/30 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                {/* Titre */}
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                  {article.title}
                </h1>
                
                {/* Extrait */}
                <p className="text-lg md:text-xl text-gray-200 mb-6 max-w-3xl leading-relaxed">
                  {article.excerpt}
                </p>
                
                {/* Métadonnées */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {article.author?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <p className="text-white font-medium">{article.author}</p>
                      <p className="text-gray-400 text-xs">Auteur</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{article.readTime}</span>
                  </div>
                  {article.views > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      <span>{article.views.toLocaleString()} vues</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Header sans image
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-16 md:py-24">
            <div className="max-w-4xl mx-auto px-6">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Badge className="bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 text-sm font-semibold">
                  {article.category}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                {article.title}
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-6 max-w-3xl">
                {article.excerpt}
              </p>
              <div className="flex flex-wrap items-center gap-6 text-sm text-blue-200">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{article.author}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{article.readTime}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton retour flottant */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="secondary"
            onClick={() => navigate('/blog')}
            className="shadow-xl bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>

      {/* Contenu de l'article */}
      <div className="relative">
        {/* Barre de partage flottante (desktop) */}
        <div className="hidden lg:flex fixed left-8 top-1/2 transform -translate-y-1/2 flex-col gap-3 z-40">
          <div className="bg-white rounded-full shadow-xl p-2 flex flex-col gap-2">
            <button
              onClick={() => handleShare('facebook')}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all hover:scale-110"
              title="Partager sur Facebook"
            >
              <Facebook className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-all hover:scale-110"
              title="Partager sur Twitter"
            >
              <Twitter className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleShare('linkedin')}
              className="w-10 h-10 rounded-full bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center transition-all hover:scale-110"
              title="Partager sur LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </button>
            <div className="w-8 h-px bg-gray-200 mx-auto my-1"></div>
            <button
              onClick={copyToClipboard}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all hover:scale-110"
              title="Copier le lien"
            >
              {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Article principal */}
        <article className="max-w-2xl mx-auto px-10 sm:px-12 lg:px-16 py-12 pb-24">
          {/* Corps de l'article */}
          <div
            className="article-content prose prose-lg max-w-none mb-12"
            style={{ whiteSpace: 'normal', overflowX: 'hidden', wordBreak: 'normal', overflowWrap: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: processContent(article.content) }}
          />

          {/* 📚 Bloc Livre 418 Milliards — affiché après chaque article */}
          <div className="my-12 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 border border-slate-600">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
              {/* Couverture */}
              <div className="flex-shrink-0">
                <img
                  src="https://res.cloudinary.com/dx4fqegqb/image/upload/v1768839304/Couverture-418_Milliards_f2duv2.jpg"
                  alt="Couverture 418 Milliards"
                  className="w-28 sm:w-36 rounded-lg shadow-2xl"
                />
              </div>
              {/* Texte */}
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-1">Le livre de l'association</p>
                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-1">
                  <span className="text-red-500">418 MILLIARDS</span>
                </h3>
                <p className="text-sm text-slate-300 mb-1">La fraude de la grande distribution</p>
                <p className="text-xs text-slate-400 italic mb-4">Martine Donnette & Claude Diot, avec Patrick Pasin</p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <span className="text-2xl font-bold text-green-400">18,00 €</span>
                  <a
                    href="https://www.novimondi.com/fr/societe/47-418-milliards-la-fraude-de-la-grande-distribution-avec-la-complicite-des-elus-et-de-l-administration.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-lg transition-colors text-sm"
                  >
                    🛒 Commander le livre
                  </a>
                  <a
                    href="/livre-418-milliards"
                    className="inline-flex items-center gap-1 text-slate-300 hover:text-white text-sm underline transition-colors"
                  >
                    En savoir plus →
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Séparateur décoratif */}
          <div className="flex items-center gap-4 my-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <BookOpen className="h-6 w-6 text-gray-400" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 flex-wrap">
                <Tag className="h-5 w-5 text-gray-400" />
                {article.tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary"
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-blue-100 hover:text-blue-700 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Section de partage (mobile) */}
          <div className="lg:hidden bg-gray-50 rounded-2xl p-6 mb-12">
            <p className="text-sm text-gray-500 font-medium mb-4 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Partager cet article
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleShare('facebook')}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="flex-1 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center gap-2 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="flex-1 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center gap-2 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </button>
              <button
                onClick={copyToClipboard}
                className="py-3 px-4 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center transition-colors"
              >
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Call to Action Premium */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 md:p-12 text-center">
            {/* Décoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Besoin d'aide pour votre activité ?
              </h3>
              <p className="text-blue-100 mb-8 text-lg max-w-xl mx-auto">
                En Toute Franchise Association accompagne les commerçants et artisans depuis plus de 30 ans.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <Link to="/adhesion">
                  <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl px-8">
                    Devenir adhérent
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 px-8">
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
          className="fixed bottom-24 right-6 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 z-40"
          title="Retour en haut"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      )}
    </div>
  );
};

export default BlogArticle;
