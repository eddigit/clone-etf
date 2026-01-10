import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Clock, User, ArrowRight, FileText, Lock, BookOpen } from 'lucide-react';
import API from '../../config/api';

const Articles = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMembersArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await API.get('/api/articles/members');
        setArticles(response.data.articles || []);
      } catch (err) {
        console.error('Error fetching members articles:', err);
        if (err.response?.status === 403) {
          setError('Acces reserve aux adherents avec une adhesion active.');
        } else {
          setError('Impossible de charger les articles.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMembersArticles();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleReadArticle = (article) => {
    navigate(`/dashboard/articles/${article.slug}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <BookOpen className="h-8 w-8 mr-3 text-blue-600" />
            Articles reserves aux adherents
          </h1>
          <p className="text-gray-600">
            Contenu exclusif pour les membres En Toute Franchise
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Chargement des articles...</p>
          </div>
        ) : error ? (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Lock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">{error}</h3>
                  <p className="text-sm text-orange-700">
                    Veuillez renouveler votre adhesion pour acceder au contenu exclusif.
                  </p>
                  <Button
                    className="mt-3"
                    variant="outline"
                    onClick={() => navigate('/dashboard/adhesions')}
                  >
                    Gerer mon adhesion
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : articles.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Aucun article disponible
                </h3>
                <p className="text-gray-500">
                  Les articles exclusifs seront disponibles prochainement.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Card
                key={article.id}
                className="overflow-hidden hover:shadow-xl transition-shadow group cursor-pointer"
                onClick={() => handleReadArticle(article)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={article.featuredImage || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800'}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-blue-600">{article.category}</Badge>
                    <Badge className="bg-purple-600">
                      <Lock className="h-3 w-3 mr-1" />
                      Exclusif
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {article.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{article.author}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {formatDate(article.publishedAt || article.createdAt)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Lire
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Articles;
