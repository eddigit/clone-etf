import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import MembershipSelector from '../components/MembershipSelector';
import {
  Shield,
  FileText,
  TrendingUp,
  Bot,
  Users,
  Award,
  Check,
  Star,
  Phone,
  Mail,
  Clock,
  AlertCircle,
  Heart,
  Scale,
  Globe,
  Rocket,
  Play,
  ArrowRight,
  Newspaper,
  ExternalLink,
  Sparkles,
  BarChart3,
  Palette,
  Calendar,
  Headphones
} from 'lucide-react';
import {
  stats,
  services,
  aiPlans,
  digitalServices,
  testimonials,
  videos,
  contactInfo
} from '../mockData';

const iconMap = {
  Shield,
  FileText,
  TrendingUp,
  Bot,
  Globe,
  Rocket
};

const API_URL = process.env.REACT_APP_API_URL || 'https://clone-etf.onrender.com';

const Home = () => {
  const navigate = useNavigate();
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);

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
    const fetchFeaturedArticles = async () => {
      try {
        const response = await fetch(`${API_URL}/api/articles/featured`);
        if (response.ok) {
          const data = await response.json();
          setFeaturedArticles(data.articles || []);
        }
      } catch (error) {
        console.error('Error fetching featured articles:', error);
      }
    };
    fetchFeaturedArticles();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="py-20 text-white" style={{ backgroundColor: '#182034' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-green-700 text-white hover:bg-green-800 border-green-600">
              <Shield className="h-3 w-3 mr-1" />
              Association Loi 1901 - Défense des Commerçants-Artisans
            </Badge>
            
            {/* Vidéo Hero - intégrée naturellement */}
            <div className="flex justify-center mb-8 overflow-hidden" style={{ backgroundColor: '#182034' }}>
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-auto block"
                style={{ 
                  backgroundColor: '#182034',
                  objectFit: 'cover',
                  height: '18em'
                }}
              >
                <source 
                  src="https://res.cloudinary.com/dniurvpzd/video/upload/v1768131595/grok-video-9d48ca91-d8d8-4739-bf81-9a7d9ff29354_1_z57ca2.mp4" 
                  type="video/mp4" 
                />
              </video>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              EN TOUTE FRANCHISE : L'association qui défend les commerçants et artisans
            </h1>
            <p className="text-xl md:text-2xl text-green-400 font-semibold mb-4">
              Notre mission : lutter pour vos droits face aux abus, à la concurrence déloyale et aux excès de pouvoir.
            </p>
            
            {/* Important Disclaimer */}
            <div className="max-w-2xl mx-auto mb-8 p-4 bg-slate-800/70 border border-green-800/50 rounded-lg">
              <p className="text-sm text-gray-300 text-center">
                <strong className="text-green-400">Important :</strong> Nous sommes une association d'accompagnement et d'orientation.
                Nous ne sommes pas un cabinet d'avocats. Nous partageons notre expérience de 30 ans et orientons vers des avocats partenaires si nécessaire.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-xl hover:shadow-green-500/30 transition-all transform hover:scale-105" 
                onClick={() => navigate('/adhesion')}
              >
                <Users className="mr-2 h-5 w-5" />
                Adhérer à l'association
              </Button>
              <a 
                href="https://www.helloasso.com/associations/en-toute-franchise/formulaires/1" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-xl hover:shadow-red-500/30 transition-all transform hover:scale-105"
                >
                  <Heart className="mr-2 h-5 w-5 animate-pulse" />
                  Faire un don
                </Button>
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-slate-800/50 rounded-xl shadow-lg border border-slate-700">
                <div className="text-3xl font-bold text-green-400 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notre ADN Section */}
      <section className="py-20 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Notre ADN : Indépendance & Justice
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-green-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl text-white">
                  <Shield className="h-6 w-6 mr-2 text-green-400" />
                  Notre Indépendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Association apolitique depuis 1994</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Libre et indépendante - Non subventionnée</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Enregistrée N° W134002644 sous-préfecture d'Istres</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Siège : 1 rue François Boucher 13700 Marignane</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-800 bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl text-white">
                  <Scale className="h-6 w-6 mr-2 text-green-400" />
                  Nos 4 Combats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Shield className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300"><strong>Défense des Commerçants-Artisans :</strong> Protection face aux pratiques abusives et accompagnement dans les litiges</span>
                  </li>
                  <li className="flex items-start">
                    <Scale className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300"><strong>Transparence et Équité :</strong> Promotion de contrats équilibrés et lutte contre les clauses abusives</span>
                  </li>
                  <li className="flex items-start">
                    <Globe className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300"><strong>Représentation :</strong> Lobbying auprès des institutions pour faire évoluer la législation</span>
                  </li>
                  <li className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300"><strong>Information et Prévention :</strong> Sensibilisation sur les pièges à éviter et décryptage des DIP</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Articles Section */}
      {featuredArticles.length > 0 && (
        <section className="py-20 bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-700 text-white">
                <Newspaper className="h-3 w-3 mr-1" />
                Actualites
              </Badge>
              <h2 className="text-4xl font-bold text-white mb-4">
                Nos Dernieres Actualites
              </h2>
              <p className="text-lg text-gray-400">
                Restez informe des evolutions du secteur de la franchise
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/blog/${article.slug}`}
                  className="block"
                >
                  <Card
                    className="overflow-hidden hover:shadow-xl transition-all bg-slate-800 border-slate-700 cursor-pointer group h-full"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={getFullImageUrl(article.featuredImage)}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800';
                        }}
                      />
                      <Badge className="absolute top-4 left-4 bg-green-600">
                        {article.category}
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-xl text-white line-clamp-2 group-hover:text-green-400 transition-colors">
                        {article.title}
                      </CardTitle>
                      <CardDescription className="text-gray-400 line-clamp-2">
                        {article.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>{formatDate(article.publishedAt)}</span>
                        <span className="flex items-center text-green-400">
                          Lire plus
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="text-center mt-10">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/blog')}
                className="border-green-600 text-green-400 hover:bg-green-900/50"
              >
                Voir tous les articles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Pourquoi Adhérer Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Pourquoi Adhérer ?
            </h2>
            <p className="text-lg text-gray-400">
              Rejoignez une communauté de commerçants et bénéficiez d'avantages exclusifs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white">Accompagnement & Conseil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Assistant IA <strong className="text-green-400">24/7</strong>, conseil stratégique basé sur 20 ans d'expérience, et assistance administrative
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white">Accès à la Communauté</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Échangez avec d'autres commerçants partageant les mêmes problématiques et bénéficiez de leur expérience
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center mb-4">
                  <AlertCircle className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white">Alertes et Actualités</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Restez informé des évolutions législatives et des pratiques des réseaux de commerçants
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white">Code Promo Exclusif</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Accès privilégié à des outils digitaux partenaires pour développer votre activité
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-2 border-green-600">
              <CardHeader>
                <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center mb-4">
                  <Rocket className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white">
                  <a href="https://maboitedigitale.com/" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors">
                    Ma Boîte Digitale
                  </a>
                </CardTitle>
                <Badge className="bg-green-600 mt-2">NOUVEAU PARTENAIRE</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-3">
                  <strong className="text-green-400">17€/mois au lieu de 39€</strong> avec votre code promo adhérent
                </p>
                <ul className="space-y-1 text-sm text-gray-400">
                  <li>• Chat IA intégré</li>
                  <li>• Création de site internet</li>
                  <li>• Signature mail professionnelle</li>
                  <li>• Et bien plus d'outils</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-green-400" />
                </div>
                <CardTitle className="text-xl text-white">Soutien à nos Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Votre cotisation finance nos actions collectives et nous aide à maintenir notre indépendance
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12 flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-xl hover:shadow-green-500/30 transition-all transform hover:scale-105" 
              onClick={() => navigate('/adhesion')}
            >
              <Users className="mr-2 h-5 w-5" />
              Adhérer maintenant
            </Button>
            <a 
              href="https://www.helloasso.com/associations/en-toute-franchise/formulaires/1" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-xl hover:shadow-red-500/30 transition-all transform hover:scale-105"
              >
                <Heart className="mr-2 h-5 w-5 animate-pulse" />
                Soutenir par un don
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Section MaBoiteDigitale - Partenariat Exclusif */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-600/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <Badge className="bg-purple-600/20 text-purple-300 border border-purple-500 mb-4">
              <Sparkles className="h-4 w-4 mr-2" />
              PARTENARIAT COACH DIGITAL
            </Badge>
            <h2 className="text-4xl font-bold text-white mb-4">
              Accompagnement Digital
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Un coach digital partenaire pour accompagner les commerçants et adhérents En Toute Franchise dans leur projet digital
            </p>
          </div>

          {/* 4 services de coaching */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-purple-500/20 text-center hover:border-purple-500/50 transition-all">
              <Globe className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold mb-1">Site Internet</h4>
              <p className="text-gray-400 text-xs">Conception de votre vitrine en ligne</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-purple-500/20 text-center hover:border-purple-500/50 transition-all">
              <Rocket className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold mb-1">Projet Digital</h4>
              <p className="text-gray-400 text-xs">Stratégie et transformation digitale</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-purple-500/20 text-center hover:border-purple-500/50 transition-all">
              <BarChart3 className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold mb-1">Présence Google</h4>
              <p className="text-gray-400 text-xs">Visibilité locale optimisée</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-purple-500/20 text-center hover:border-purple-500/50 transition-all">
              <Users className="h-8 w-8 text-orange-400 mx-auto mb-2" />
              <h4 className="text-white font-semibold mb-1">Réseaux Sociaux</h4>
              <p className="text-gray-400 text-xs">Gestion et animation</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image du dashboard */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-green-600/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-slate-800/50 backdrop-blur border border-purple-500/30 rounded-2xl p-4 shadow-2xl">
                <img
                  src="https://res.cloudinary.com/dtoink4qi/image/upload/v1768391962/Capture_d_%C3%A9cran_2026-01-14_094205_kellpl.png"
                  alt="Dashboard Ma Boîte Digitale - Outils numériques"
                  className="w-full rounded-xl shadow-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" fill="%231e293b"><rect width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23a855f7" font-size="18">Capture Ma Boîte Digitale</text></svg>';
                  }}
                />
                <div className="absolute -bottom-4 -right-4 bg-green-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  -56% pour les adhérents !
                </div>
              </div>
            </div>

            {/* Contenu et outils */}
            <div className="space-y-8">
              {/* Prix */}
              <div className="bg-slate-800/50 backdrop-blur border border-green-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Tarif adhérent ETF</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-green-400">17€</span>
                      <span className="text-gray-400">/mois</span>
                      <span className="text-red-400 line-through text-lg">39€/mois</span>
                    </div>
                  </div>
                  <Badge className="bg-green-600">ÉCONOMISEZ 22€/mois</Badge>
                </div>
              </div>

              {/* Grille d'outils */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: Mail, label: 'Signatures Email', color: 'text-blue-400' },
                  { icon: Globe, label: 'Site Web', color: 'text-green-400' },
                  { icon: Calendar, label: 'Rendez-vous', color: 'text-orange-400' },
                  { icon: Palette, label: 'Brand Kit', color: 'text-pink-400' },
                  { icon: BarChart3, label: 'Statistiques', color: 'text-cyan-400' },
                  { icon: Users, label: 'Affiliation', color: 'text-yellow-400' },
                  { icon: Bot, label: 'Coach Digital IA', color: 'text-purple-400' },
                  { icon: Headphones, label: 'Support', color: 'text-gray-400' },
                ].map((tool, index) => (
                  <div 
                    key={index}
                    className="bg-slate-700/50 rounded-lg p-3 text-center hover:bg-slate-700 transition-colors"
                  >
                    <tool.icon className={`h-6 w-6 mx-auto mb-2 ${tool.color}`} />
                    <span className="text-xs text-gray-300">{tool.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-purple-600 hover:bg-purple-700 flex-1"
                  onClick={() => window.open('https://www.maboitedigitale.com', '_blank')}
                >
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Découvrir la plateforme
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-green-500 text-green-400 hover:bg-green-500/10 flex-1"
                  onClick={() => navigate('/adhesion')}
                >
                  <Rocket className="mr-2 h-5 w-5" />
                  Adhérer pour en profiter
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Nos Services d'Excellence</h2>
            <p className="text-lg text-gray-400">Une gamme complète de services réalisés par des professionnels</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => {
              const IconComponent = iconMap[service.icon];
              return (
                <Card
                  key={service.id}
                  className={`hover:shadow-xl transition-all bg-slate-800 border-slate-700 ${
                    service.isNew ? 'border-2 border-green-500 relative' : ''
                  }`}
                >
                  {service.isNew && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600">
                      NOUVEAU
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-green-400" />
                    </div>
                    <CardTitle className="text-xl text-white">{service.title}</CardTitle>
                    <CardDescription className="text-gray-400">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm">
                          <Check className="h-4 w-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Membership Plans Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-100 text-blue-700">ÉTAPE 1 • OBLIGATOIRE</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choisissez votre type d'adhésion</h2>
            <p className="text-lg text-gray-600">
              Sélectionnez le type d'adhésion qui correspond à votre profil
            </p>
          </div>

          <MembershipSelector variant="light" showTitle={false} />

          <div className="mt-12 p-6 bg-blue-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Services inclus avec toute adhésion :</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Conseil & accompagnement</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Assistance administrative</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Conseil stratégique</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Communauté de 2500+ professionnels</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Videos Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Nos Vidéos</h2>
            <p className="text-lg text-gray-600">
              Découvrez nos témoignages, guides juridiques et actualités
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {videos.map((video) => (
              <Card 
                key={video.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative">
                  <img
                    src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                      <Play className="h-8 w-8 text-white ml-1" />
                    </div>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{video.title}</CardTitle>
                  <CardDescription>{video.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <a 
              href="https://www.youtube.com/@EnTouteFranchise" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg">
                Voir nos 120 vidéos et reportages TV
              </Button>
            </a>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-12 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">50+</div>
              <div className="text-sm text-gray-600">Vidéos éducatives</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">15K</div>
              <div className="text-sm text-gray-600">Vues totales</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">800+</div>
              <div className="text-sm text-gray-600">Abonnés</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Témoignages de Confiance</h2>
            <p className="text-lg text-gray-600">
              Découvrez comment nous avons aidé nos membres à surmonter leurs défis
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((testimonial) => (
              <Card key={testimonial.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">€2.1M</div>
              <div className="text-sm text-gray-600">Economisés pour nos membres</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">1,847</div>
              <div className="text-sm text-gray-600">Conflits résolus avec succès</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">98%</div>
              <div className="text-sm text-gray-600">Taux de satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">12h</div>
              <div className="text-sm text-gray-600">Délai moyen de réponse</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Contactez nos Experts</h2>
            <p className="text-lg text-gray-600">
              Notre équipe d'experts est à votre disposition pour vous accompagner
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Assistance Téléphonique</h3>
                <p className="text-2xl font-bold text-blue-600 mb-2">{contactInfo.phone}</p>
                <p className="text-sm text-gray-600">{contactInfo.hours}</p>
                <p className="text-xs text-gray-500 mt-2">Appel non surtaxé</p>
                <p className="text-sm text-green-600 mt-3 font-semibold">En cas d'urgence, contactez-nous directement sur ces lignes.</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Support Email</h3>
                <p className="text-lg text-gray-700 mb-2">{contactInfo.email}</p>
                <p className="text-sm text-gray-600">Réponse garantie sous 24 heures</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Siège Social</h3>
                <p className="text-gray-700 mb-1">{contactInfo.address}</p>
                <p className="text-gray-700 mb-2">{contactInfo.city}</p>
                <p className="text-sm text-gray-600">Rendez-vous sur RDV uniquement</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">30 ans de combat pour la justice</h2>
          <p className="text-xl mb-8">
            Rejoignez notre association apolitique, libre et indépendante. Ensemble, faisons respecter l'équité, la
            transparence et la justice dans le domaine économique.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={() => navigate('/register')}>
              <Users className="mr-2 h-5 w-5" />
              Adhérer à l'association
            </Button>
            <a 
              href="https://www.helloasso.com/associations/en-toute-franchise/formulaires/1" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-100">
                <Heart className="mr-2 h-5 w-5" />
                Faire un don Hello Asso
              </Button>
            </a>
          </div>
        </div>
      </section>

      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div 
            className="relative w-full max-w-4xl aspect-video"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-3xl font-bold"
            >
              &times;
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
              title={selectedVideo.title}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
