import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Check, 
  CreditCard, 
  Calendar, 
  ExternalLink, 
  Sparkles, 
  Bot, 
  Percent,
  ArrowRight,
  Shield,
  Star
} from 'lucide-react';
import API from '../../config/api';

const MABOITEDIGITALE_URL = 'https://www.maboitedigitale.com';

const Subscription = () => {
  const [user, setUser] = useState(null);
  const [memberNumber, setMemberNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await API.get('/api/user/profile');
          setUser(response.data);
          setMemberNumber(response.data.membershipNumber || response.data.couponCode || '');
        }
      } catch (error) {
        console.error('Erreur récupération profil:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const currentMembership = user ? {
    type: user.membershipType || 'Adhérent',
    startDate: user.membershipStartDate,
    endDate: user.membershipEndDate,
    status: user.membershipStatus || 'active'
  } : null;

  const handleGoToMaBoiteDigitale = (path = '') => {
    const url = memberNumber 
      ? `${MABOITEDIGITALE_URL}${path}?source=etf&member=${encodeURIComponent(memberNumber)}`
      : `${MABOITEDIGITALE_URL}${path}?source=etf`;
    window.open(url, '_blank');
  };

  const services = [
    {
      icon: Bot,
      title: 'Assistant IA 24/7',
      description: 'Outil d\'orientation intelligent basé sur 20 ans d\'expérience',
      features: ['Réponses instantanées', 'Base de connaissances juridiques', 'Disponible 24h/24']
    },
    {
      icon: CreditCard,
      title: 'Création de Site Web',
      description: 'Site vitrine professionnel pour votre commerce',
      features: ['Design personnalisé', 'Optimisé mobile', 'Hébergement inclus']
    },
    {
      icon: Sparkles,
      title: 'Signature Email Pro',
      description: 'Signature email professionnelle avec votre image',
      features: ['Logo intégré', 'Liens réseaux sociaux', 'Template responsive']
    },
    {
      icon: Star,
      title: 'Outils Marketing',
      description: 'Suite complète d\'outils digitaux',
      features: ['Cartes de visite digitales', 'QR Codes', 'Formulaires']
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Abonnements & Services</h1>
          <p className="text-gray-600">Gérez votre adhésion ETF et accédez aux services partenaires</p>
        </div>

        {/* Current Membership */}
        {currentMembership && (
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Shield className="h-6 w-6 text-green-600" />
                    Adhésion En Toute Franchise
                  </CardTitle>
                  <CardDescription>Votre statut de membre actif</CardDescription>
                </div>
                <Badge className="bg-green-600">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                    {currentMembership.type?.replace('_', ' ')}
                  </h3>
                  <div className="space-y-3">
                    {currentMembership.startDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Depuis</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(currentMembership.startDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {currentMembership.endDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Valide jusqu'au</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(currentMembership.endDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                    {memberNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">N° adhérent</span>
                        <span className="font-mono font-semibold text-green-700">{memberNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Avantages inclus :</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Accompagnement et orientation</span>
                    </li>
                    <li className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Mise en relation avocats partenaires</span>
                    </li>
                    <li className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Ressources et modèles documentaires</span>
                    </li>
                    <li className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Remise adhérent sur <a href="https://maboitedigitale.com/" target="_blank" rel="noopener noreferrer" className="hover:underline text-purple-600">MaBoiteDigitale</a></span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Partenaire - Ma Boîte Digitale */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Services Digitaux Partenaires</h2>
              <p className="text-gray-600">
                Propulsés par <a href="https://maboitedigitale.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-purple-600 hover:underline">Ma Boîte Digitale</a>
              </p>
            </div>
          </div>

          {/* Avantage adhérent */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Percent className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-purple-900">Avantage Adhérent ETF</h3>
                  <p className="text-sm text-purple-700">
                    Bénéficiez de tarifs préférentiels sur tous les services <a href="https://maboitedigitale.com/" target="_blank" rel="noopener noreferrer" className="hover:underline font-medium">MaBoiteDigitale</a> en tant qu'adhérent
                  </p>
                </div>
                <Button 
                  onClick={() => handleGoToMaBoiteDigitale('/tarifs')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Voir les tarifs
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{service.title}</CardTitle>
                        <CardDescription className="mt-1">{service.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA Principal */}
          <div className="mt-8 text-center">
            <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-0">
              <CardContent className="py-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Découvrez tous les services digitaux
                </h3>
                <p className="text-gray-300 mb-6 max-w-xl mx-auto">
                  Création de site, assistant IA, signature email, cartes de visite digitales et bien plus...
                </p>
                <Button 
                  size="lg"
                  onClick={() => handleGoToMaBoiteDigitale()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Accéder à Ma Boîte Digitale
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <p className="text-gray-400 text-sm mt-4">
                  Votre code adhérent sera automatiquement appliqué
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>
            Les services digitaux sont fournis par notre partenaire{' '}
            <a 
              href="https://maboitedigitale.com/"
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline font-medium"
            >
              Ma Boîte Digitale
            </a>
          </p>
          <p className="mt-1">
            Pour toute question sur les abonnements, contactez directement la plateforme partenaire.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Subscription;
