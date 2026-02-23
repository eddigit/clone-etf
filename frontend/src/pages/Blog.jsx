import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Clock, User, ArrowRight, FileText, Filter } from 'lucide-react';
import { articles as mockArticles } from '../mockData';

// API URL - utiliser l'API si disponible
const API_URL = process.env.REACT_APP_API_URL || 'https://clone-etf.onrender.com';

const Blog = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);

  // Fonction pour obtenir l'URL complète d'une image
  const getFullImageUrl = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/uploads/')) {
      return `${API_URL}${url}`;
    }
    return url;
  };

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        // Recuperer les articles publics (blog visiteurs)
        const params = new URLSearchParams({ status: 'published' });
        if (selectedCategory) params.append('category', selectedCategory);

        params.append("limit", "50");
          const response = await fetch(`${API_URL}/api/articles?${params.toString()}`);

        if (response.ok) {
          const data = await response.json();
          if (data.articles && data.articles.length > 0) {
            setArticles(data.articles);
          } else {
            // Utiliser les donnees mock si pas d'articles en base
            setUseMockData(true);
            setArticles(mockArticles);
          }
        } else {
          setUseMockData(true);
          setArticles(mockArticles);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
        // Fallback sur les donnees mock
        setUseMockData(true);
        setArticles(mockArticles);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/articles/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchArticles();
    fetchCategories();
  }, [selectedCategory]);

  const handleReadMore = (article) => {
    if (useMockData) {
      // Pour les donnees mock, pas de page detail
      return;
    }
    navigate(`/blog/${article.slug}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Blog & Actualites
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Decouvrez nos guides pratiques, retours d'experience et actualites pour mieux proteger votre activite
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      {categories.length > 0 && (
        <section className="py-6 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              <div className="flex items-center text-gray-500">
                <Filter className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Filtrer:</span>
              </div>
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === ''
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Articles Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Chargement des articles...</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun article disponible</h3>
              <p className="text-gray-500">Les articles arrivent bientot !</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <Link 
                  key={article.id}
                  to={useMockData ? '#' : `/blog/${article.slug}`}
                  className="block"
                >
                  <Card
                    className="overflow-hidden hover:shadow-xl transition-shadow group cursor-pointer bg-white h-full"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={getFullImageUrl(article.featuredImage || article.image)}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800';
                        }}
                      />
                      <Badge className="absolute top-4 left-4 bg-blue-600">
                        {article.category}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl line-clamp-2 group-hover:text-blue-600 transition-colors text-gray-900">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3 text-gray-600">
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
                          {formatDate(article.publishedAt || article.date || article.createdAt)}
                        </span>
                        <span className="text-blue-600 hover:text-blue-700 flex items-center text-sm font-medium">
                          Lire plus
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Restez informe</h2>
          <p className="text-xl mb-8">
            Recevez nos derniers articles et conseils juridiques directement dans votre boite mail
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Votre email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <Button size="lg" variant="secondary">
              S'abonner
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
