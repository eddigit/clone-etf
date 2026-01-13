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
  Eye
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://clone-etf.onrender.com';

const BlogArticle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Fonction pour préfixer les URLs relatives d'images dans le contenu HTML
  // et convertir les liens YouTube en iframes
  const processImageUrls = (htmlContent) => {
    if (!htmlContent) return '';
    
    // Remplacer les src d'images relatives par des URLs complètes
    let processed = htmlContent.replace(
      /src="(\/uploads\/[^"]+)"/g, 
      `src="${API_URL}$1"`
    );
    
    // Convertir les liens YouTube en iframes responsives
    // Format: [youtube:VIDEO_ID] ou [youtube:URL_COMPLETE]
    processed = processed.replace(
      /\[youtube:([^\]]+)\]/g,
      (match, videoIdOrUrl) => {
        let videoId = videoIdOrUrl;
        // Extraire l'ID de différents formats d'URL YouTube
        if (videoIdOrUrl.includes('youtube.com/watch')) {
          const urlParams = new URLSearchParams(videoIdOrUrl.split('?')[1]);
          videoId = urlParams.get('v') || videoIdOrUrl;
        } else if (videoIdOrUrl.includes('youtu.be/')) {
          videoId = videoIdOrUrl.split('youtu.be/')[1]?.split('?')[0] || videoIdOrUrl;
        } else if (videoIdOrUrl.includes('youtube.com/embed/')) {
          videoId = videoIdOrUrl.split('youtube.com/embed/')[1]?.split('?')[0] || videoIdOrUrl;
        }
        return `<div class="youtube-embed my-6"><div class="relative w-full" style="padding-bottom: 56.25%;"><iframe src="https://www.youtube.com/embed/${videoId}" title="Vidéo YouTube" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"></iframe></div></div>`;
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
    alert('Lien copie !');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
          <p className="text-gray-600 mb-8">L'article que vous recherchez n'existe pas ou a ete supprime.</p>
          <Button onClick={() => navigate('/blog')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au blog
          </Button>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero with Featured Image */}
      <div className="relative">
        {article.featuredImage && (
          <div className="h-64 md:h-96 overflow-hidden">
            <img
              src={article.featuredImage.startsWith('http') ? article.featuredImage : `${API_URL}${article.featuredImage}`}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
        )}

        {/* Back button */}
        <div className="absolute top-4 left-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/blog')}
            className="shadow-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-blue-600">{article.category}</Badge>
            {article.tags && article.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {article.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>

          <p className="text-xl text-gray-600 mb-6">
            {article.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 border-y py-4">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              {article.author}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(article.publishedAt || article.createdAt)}
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {article.readTime}
            </div>
            {article.views > 0 && (
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {article.views} vues
              </div>
            )}
          </div>
        </header>

        {/* Article Body */}
        <div
          className="prose prose-lg max-w-none mb-12 prose-img:rounded-lg prose-img:shadow-md prose-img:w-full prose-img:h-auto"
          style={{
            color: '#1f2937',
            '--tw-prose-body': '#1f2937',
            '--tw-prose-headings': '#111827',
            '--tw-prose-links': '#2563eb',
            '--tw-prose-bold': '#111827',
            '--tw-prose-counters': '#4b5563',
            '--tw-prose-bullets': '#4b5563',
            '--tw-prose-hr': '#e5e7eb',
            '--tw-prose-quotes': '#1f2937',
            '--tw-prose-quote-borders': '#2563eb',
            '--tw-prose-captions': '#4b5563',
            '--tw-prose-code': '#111827',
            '--tw-prose-pre-code': '#e5e7eb',
            '--tw-prose-pre-bg': '#1f2937',
            '--tw-prose-th-borders': '#d1d5db',
            '--tw-prose-td-borders': '#e5e7eb'
          }}
          dangerouslySetInnerHTML={{ __html: processImageUrls(article.content) }}
        />

        {/* Share Section */}
        <div className="border-t pt-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 font-medium">Partager cet article :</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('facebook')}
                className="text-blue-600"
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('twitter')}
                className="text-sky-500"
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShare('linkedin')}
                className="text-blue-700"
              >
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
              >
                Copier le lien
              </Button>
            </div>
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-gray-500" />
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 bg-blue-50 rounded-xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Besoin d'aide pour votre activite ?
          </h3>
          <p className="text-gray-600 mb-4">
            En Toute Franchise Association accompagne les commercants et artisans depuis plus de 30 ans.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/adhesion">
              <Button>Devenir adherent</Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline">Nous contacter</Button>
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogArticle;
