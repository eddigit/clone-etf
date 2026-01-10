import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Share2,
  Lock,
  Eye
} from 'lucide-react';
import API from '../../config/api';

const ArticleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await API.get(`/api/articles/${slug}`);
        setArticle(response.data);
      } catch (err) {
        console.error('Error fetching article:', err);
        if (err.response?.status === 404) {
          setError('Article non trouve');
        } else {
          setError('Impossible de charger l\'article');
        }
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Lien copie !');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Chargement de l'article...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8">
          <div className="max-w-2xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
            <p className="text-gray-600 mb-8">
              L'article que vous recherchez n'existe pas ou a ete supprime.
            </p>
            <Button onClick={() => navigate('/dashboard/articles')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux articles
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!article) return null;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/articles')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux articles
        </Button>

        <article className="max-w-4xl mx-auto">
          {/* Featured Image */}
          {article.featuredImage && (
            <div className="h-64 md:h-96 overflow-hidden rounded-xl mb-8">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-blue-600">{article.category}</Badge>
              {article.publishTo?.includes('members') && (
                <Badge className="bg-purple-600">
                  <Lock className="h-3 w-3 mr-1" />
                  Contenu exclusif
                </Badge>
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
            className="prose prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Share Section */}
          <div className="border-t pt-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600 font-medium">Partager :</span>
              </div>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                Copier le lien
              </Button>
            </div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 pt-8 border-t">
              <div className="flex items-center gap-2 flex-wrap">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </DashboardLayout>
  );
};

export default ArticleDetail;
