import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Bot, 
  ExternalLink, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Clock, 
  Users,
  FileText,
  MessageSquare,
  Zap,
  Star,
  Info,
  CreditCard,
  Percent,
  Link2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import API from '../../config/api';

// URL de Ma Boîte Digitale
const MABOITEDIGITALE_URL = 'https://maboitedigitale.com';

const AIAssistant = () => {
  const [user, setUser] = useState(null);
  const [membershipActive, setMembershipActive] = useState(false);
  const [iaSubscriptionActive, setIaSubscriptionActive] = useState(false);
  const [iaSubscription, setIaSubscription] = useState(null);
  const [memberNumber, setMemberNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoError, setSsoError] = useState(null);
  const [isVipOrAdmin, setIsVipOrAdmin] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (token) {
          // Vérifier le statut d'adhésion ETF
          try {
            const response = await API.get('/api/user/profile');
            if (response.data) {
              setUser(response.data);
              setMemberNumber(response.data.memberNumber || response.data.id || '');
              // Vérifier si l'adhésion est active
              const isActive = response.data.membershipStatus === 'active';
              const notExpired = !response.data.membershipEndDate || 
                                new Date(response.data.membershipEndDate) > new Date();
              setMembershipActive(isActive && notExpired);
              
              // Vérifier si VIP ou Admin (accès gratuit au chat IA)
              const userRole = response.data.role || '';
              const hasVipAccess = userRole === 'admin' || userRole === 'vip';
              setIsVipOrAdmin(hasVipAccess);
              
              // Si VIP ou Admin, activer automatiquement l'accès IA
              if (hasVipAccess) {
                setIaSubscriptionActive(true);
              }
            }
          } catch (err) {
            console.error('Error fetching user profile:', err);
          }

          // Vérifier le statut d'abonnement IA sur maboitedigitale.com (sauf VIP/Admin)
          const userRole = localStorage.getItem('userRole');
          if (userRole !== 'admin' && userRole !== 'vip') {
            try {
              const iaResponse = await API.get('/api/maboitedigitale/subscription');
              if (iaResponse.data) {
                setIaSubscription(iaResponse.data);
                setIaSubscriptionActive(iaResponse.data.has_subscription === true);
              }
            } catch (err) {
              console.error('Error fetching IA subscription:', err);
              // Si erreur, on ne bloque pas l'interface
              setIaSubscriptionActive(false);
            }
          }
        }
      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  // Fonction pour se connecter directement à Ma Boîte Digitale avec SSO
  const handleConnectToMaBoiteDigitale = async () => {
    setSsoLoading(true);
    setSsoError(null);
    
    try {
      // Appeler l'API backend pour générer un token SSO
      const response = await API.post('/api/maboitedigitale/sso');
      
      if (response.data.success && response.data.redirect_url) {
        // Redirection avec le token SSO
        window.open(response.data.redirect_url, '_blank');
      } else if (response.data.redirect_url) {
        // Mode dev: redirection simple
        window.open(response.data.redirect_url, '_blank');
      } else {
        // Erreur ou message
        setSsoError(response.data.message || 'Impossible de générer le lien de connexion');
        // Fallback: redirection simple
        const fallbackUrl = `${MABOITEDIGITALE_URL}/login?source=etf&member=${encodeURIComponent(memberNumber)}`;
        window.open(fallbackUrl, '_blank');
      }
    } catch (error) {
      console.error('SSO error:', error);
      setSsoError('Erreur de connexion. Redirection vers le site...');
      // Fallback en cas d'erreur
      setTimeout(() => {
        const fallbackUrl = `${MABOITEDIGITALE_URL}/login?source=etf&member=${encodeURIComponent(memberNumber)}`;
        window.open(fallbackUrl, '_blank');
      }, 1000);
    } finally {
      setSsoLoading(false);
    }
  };

  const features = [
    {
      icon: MessageSquare,
      title: 'Assistant IA Juridique',
      description: 'Posez vos questions sur le droit de la franchise et obtenez des réponses instantanées basées sur 30 ans d\'expérience.'
    },
    {
      icon: FileText,
      title: 'Analyse de Documents',
      description: 'Soumettez vos contrats et documents pour une analyse IA détaillée et des alertes sur les points de vigilance.'
    },
    {
      icon: Zap,
      title: 'Génération de Courriers',
      description: 'Créez des courriers professionnels adaptés à votre situation en quelques clics.'
    },
    {
      icon: Shield,
      title: 'Veille Juridique',
      description: 'Restez informé des évolutions légales et jurisprudentielles qui impactent votre activité.'
    }
  ];

  const steps = [
    {
      number: '1',
      title: 'Créez votre compte',
      description: 'Rendez-vous sur maboitedigitale.com et créez votre compte utilisateur.'
    },
    {
      number: '2',
      title: 'Renseignez votre numéro ETF',
      description: `Indiquez votre numéro d'adhérent${memberNumber ? ` (${memberNumber})` : ''} pour débloquer la remise adhérent.`
    },
    {
      number: '3',
      title: 'Profitez de la remise',
      description: 'Bénéficiez de tarifs préférentiels exclusifs réservés aux adhérents ETF.'
    },
    {
      number: '4',
      title: 'Accédez à vos outils',
      description: 'Connectez-vous directement depuis votre espace ETF ou maboitedigitale.com.'
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mb-6 shadow-lg">
            <Bot className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Outils IA pour les Adhérents
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Accédez à une suite complète d'outils d'intelligence artificielle conçus spécialement 
            pour les professionnels de la franchise.
          </p>
        </div>

        {/* Statut d'adhésion et abonnement IA */}
        {loading ? (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                <p className="text-gray-600">Vérification de votre statut...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Statut adhésion ETF */}
            {membershipActive ? (
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-900">Adhésion ETF active</h3>
                        <p className="text-green-700 text-sm">
                          {memberNumber && <span>N° adhérent: <strong>{memberNumber}</strong> • </span>}
                          Vous bénéficiez de la remise adhérent sur maboitedigitale.com
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-600 text-white">
                      <Percent className="h-3 w-3 mr-1" />
                      Remise active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <Info className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900">Adhésion ETF requise</h3>
                      <p className="text-amber-700 text-sm">
                        Pour bénéficier de la remise adhérent, votre adhésion ETF doit être à jour.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statut abonnement IA */}
            {isVipOrAdmin ? (
              <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <Star className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-amber-900">Accès VIP</h3>
                          <Badge className="bg-amber-500 text-white">VIP</Badge>
                        </div>
                        <p className="text-amber-700 text-sm">
                          Vous bénéficiez d'un accès gratuit et illimité aux outils IA.
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="bg-amber-600 hover:bg-amber-700"
                      onClick={handleConnectToMaBoiteDigitale}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Accéder aux outils
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : iaSubscriptionActive ? (
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Bot className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-900">Abonnement IA actif</h3>
                        <p className="text-purple-700 text-sm">
                          Vous avez accès à tous les outils IA de Ma Boîte Digitale.
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={handleConnectToMaBoiteDigitale}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Accéder aux outils
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Bot className="h-6 w-6 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-700">Abonnement IA non actif</h3>
                        <p className="text-gray-600 text-sm">
                          Souscrivez sur maboitedigitale.com pour accéder aux outils IA.
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`${MABOITEDIGITALE_URL}/tarifs`, '_blank')}
                    >
                      Voir les tarifs
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* CTA Principal */}
        <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white border-0 shadow-xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <Badge className="bg-white/20 text-white mb-4 backdrop-blur-sm">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Nouveau
                </Badge>
                <h2 className="text-3xl font-bold mb-4">
                  Accédez à Ma Boîte Digitale
                </h2>
                <p className="text-blue-100 mb-6 text-lg">
                  Votre plateforme d'outils IA dédiée aux adhérents En Toute Franchise. 
                  Assistants intelligents, analyse de documents, génération de courriers et bien plus.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg" 
                    className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg"
                    onClick={handleConnectToMaBoiteDigitale}
                  >
                    {iaSubscriptionActive ? 'Accéder aux outils IA' : 'Découvrir Ma Boîte Digitale'}
                    <ExternalLink className="ml-2 h-5 w-5" />
                  </Button>
                  {!iaSubscriptionActive && (
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-white/50 text-white hover:bg-white/10"
                      onClick={() => window.open(`${MABOITEDIGITALE_URL}/inscription?source=etf&member=${encodeURIComponent(memberNumber)}`, '_blank')}
                    >
                      Créer mon compte
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="w-48 h-48 bg-white/10 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                    <Bot className="h-24 w-24 text-white/80" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                    <Star className="h-6 w-6 text-yellow-900" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comment ça marche */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Comment accéder aux outils IA ?</h2>
            <p className="text-gray-600">Suivez ces étapes simples pour commencer</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-blue-600">{step.number}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ce qui vous attend</h2>
            <p className="text-gray-600">Des outils puissants pour vous accompagner au quotidien</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Note importante */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Percent className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Avantage Adhérent ETF</h3>
                <p className="text-green-800 text-sm mb-3">
                  En tant qu'adhérent En Toute Franchise, vous bénéficiez d'une <strong>remise exclusive</strong> sur 
                  l'abonnement aux outils IA de Ma Boîte Digitale. Utilisez votre numéro d'adhérent 
                  {memberNumber && <strong> ({memberNumber})</strong>} lors de votre inscription pour activer la remise.
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center text-green-700">
                    <Percent className="h-4 w-4 mr-1" />
                    Remise adhérent
                  </div>
                  <div className="flex items-center text-green-700">
                    <CreditCard className="h-4 w-4 mr-1" />
                    Paiement sécurisé
                  </div>
                  <div className="flex items-center text-green-700">
                    <Clock className="h-4 w-4 mr-1" />
                    Activation immédiate
                  </div>
                  <div className="flex items-center text-green-700">
                    <Link2 className="h-4 w-4 mr-1" />
                    Connexion liée
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Final */}
        <div className="text-center py-8">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
            onClick={handleConnectToMaBoiteDigitale}
          >
            <Bot className="mr-2 h-5 w-5" />
            {iaSubscriptionActive ? 'Accéder à mes outils IA' : 'Découvrir Ma Boîte Digitale'}
            <ExternalLink className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            En cas de question, contactez-nous à contact@en-toutefranchise.com
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Les outils IA sont fournis par <a href="https://maboitedigitale.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">maboitedigitale.com</a>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIAssistant;
