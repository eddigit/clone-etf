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
  CreditCard
} from 'lucide-react';

const AIAssistant = () => {
  const [user, setUser] = useState(null);
  const [membershipActive, setMembershipActive] = useState(false);

  useEffect(() => {
    // Récupérer les infos utilisateur depuis le localStorage ou l'API
    const checkMembership = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Simuler la vérification du statut d'adhésion
          // En production, cela devrait appeler l'API pour vérifier
          setMembershipActive(true); // Pour l'instant on suppose que l'adhésion est active
        }
      } catch (error) {
        console.error('Error checking membership:', error);
      }
    };
    checkMembership();
  }, []);

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
      description: 'Rendez-vous sur maboitedigital.com et créez votre compte utilisateur.'
    },
    {
      number: '2',
      title: 'Renseignez votre numéro ETF',
      description: 'Indiquez votre numéro d\'adhérent En Toute Franchise pour valider votre accès.'
    },
    {
      number: '3',
      title: 'Souscrivez à l\'abonnement IA',
      description: 'Choisissez votre formule d\'abonnement pour accéder à tous les outils IA.'
    },
    {
      number: '4',
      title: 'Accédez à vos outils',
      description: 'Connectez-vous et profitez de l\'ensemble des assistants IA disponibles.'
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

        {/* Statut d'adhésion */}
        {membershipActive ? (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">Votre adhésion ETF est active</h3>
                  <p className="text-green-700 text-sm">
                    Vous pouvez accéder aux outils IA en vous connectant à Ma Boîte Digitale.
                  </p>
                </div>
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
                  <h3 className="font-semibold text-amber-900">Adhésion requise</h3>
                  <p className="text-amber-700 text-sm">
                    Pour accéder aux outils IA, votre adhésion ETF doit être à jour.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
                    onClick={() => window.open('https://maboitedigital.com', '_blank')}
                  >
                    Accéder à Ma Boîte Digitale
                    <ExternalLink className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white/50 text-white hover:bg-white/10"
                    onClick={() => window.open('https://maboitedigital.com/inscription', '_blank')}
                  >
                    Créer mon compte
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
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
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Information importante</h3>
                <p className="text-blue-800 text-sm mb-3">
                  L'accès aux outils IA nécessite un abonnement séparé sur la plateforme Ma Boîte Digitale. 
                  Votre numéro d'adhérent ETF vous permet de bénéficier de tarifs préférentiels réservés aux membres.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center text-blue-700">
                    <CreditCard className="h-4 w-4 mr-1" />
                    Paiement sécurisé
                  </div>
                  <div className="flex items-center text-blue-700">
                    <Clock className="h-4 w-4 mr-1" />
                    Activation immédiate
                  </div>
                  <div className="flex items-center text-blue-700">
                    <Users className="h-4 w-4 mr-1" />
                    Tarif adhérent ETF
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
            onClick={() => window.open('https://maboitedigital.com', '_blank')}
          >
            <Bot className="mr-2 h-5 w-5" />
            Découvrir Ma Boîte Digitale
            <ExternalLink className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            En cas de question, contactez-nous à contact@en-toutefranchise.com
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIAssistant;
