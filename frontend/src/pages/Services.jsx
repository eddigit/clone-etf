import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Check, Shield, FileText, TrendingUp, Bot, Globe, Rocket, ExternalLink, Sparkles, Mail, BarChart3, Users, Palette, Calendar, Headphones } from 'lucide-react';
import { services, digitalServices, membershipPlans, aiPlans } from '../mockData';

const iconMap = {
  Shield,
  FileText,
  TrendingUp,
  Bot,
  Globe,
  Rocket
};

const Services = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Nos Services Professionnels
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Des solutions complètes pour protéger et développer votre activité
            </p>
          </div>
        </div>
      </section>

      {/* Services Juridiques */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Services Juridiques et Administratifs</h2>
            <p className="text-lg text-gray-600">Inclus dans toutes les adhésions professionnelles</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => {
              const IconComponent = iconMap[service.icon];
              return (
                <Card
                  key={service.id}
                  className={`hover:shadow-lg transition-shadow ${
                    service.isNew ? 'border-2 border-blue-500 relative' : ''
                  }`}
                >
                  {service.isNew && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                      NOUVEAU
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
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

      {/* Section MaBoiteDigitale - Partenaire Premium */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-purple-600 text-white text-sm px-4 py-1">
              <Sparkles className="h-4 w-4 mr-2 inline" />
              PARTENARIAT EXCLUSIF ADHÉRENTS
            </Badge>
            <h2 className="text-4xl font-bold text-white mb-4">
              MaBoiteDigitale.com
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              La plateforme tout-en-un pour digitaliser votre activité et booster votre communication
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image de la plateforme */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-2xl opacity-30 transform -rotate-3"></div>
              <div className="relative bg-slate-800 rounded-2xl p-2 shadow-2xl border border-purple-500/30">
                <img 
                  src="/images/maboitedigitale-dashboard.png" 
                  alt="Dashboard MaBoiteDigitale - Tous vos outils digitaux" 
                  className="w-full rounded-xl"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop';
                  }}
                />
                <div className="absolute -bottom-4 -right-4 bg-green-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                  -56% pour les adhérents !
                </div>
              </div>
            </div>

            {/* Contenu descriptif */}
            <div className="space-y-6">
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Rocket className="h-6 w-6 mr-3 text-purple-400" />
                  Tous vos outils digitaux réunis
                </h3>
                <p className="text-gray-300 mb-4">
                  En tant qu'adhérent ETF, vous bénéficiez d'un accès privilégié à la plateforme MaBoiteDigitale.com 
                  avec une <strong className="text-green-400">réduction exclusive de 20%</strong> sur tous les abonnements.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center text-gray-300">
                    <Mail className="h-5 w-5 mr-2 text-cyan-400" />
                    <span>Signatures Email Pro</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Globe className="h-5 w-5 mr-2 text-green-400" />
                    <span>Site Web One-Page</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Calendar className="h-5 w-5 mr-2 text-orange-400" />
                    <span>Prise de RDV en ligne</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Palette className="h-5 w-5 mr-2 text-pink-400" />
                    <span>Brand Kit & Identité</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-400" />
                    <span>Statistiques détaillées</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Users className="h-5 w-5 mr-2 text-yellow-400" />
                    <span>Programme Affiliation</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Bot className="h-5 w-5 mr-2 text-purple-400" />
                    <span>Coach Digital IA</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Headphones className="h-5 w-5 mr-2 text-red-400" />
                    <span>Support & Services</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="bg-purple-600 hover:bg-purple-700 flex-1"
                    onClick={() => window.open('https://maboitedigitale.com?partner=etf', '_blank')}
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Découvrir la plateforme
                  </Button>
                  <div className="text-center sm:text-left">
                    <div className="text-3xl font-bold text-white">17€<span className="text-lg text-gray-400">/mois</span></div>
                    <div className="text-sm text-gray-400 line-through">Au lieu de 39€/mois</div>
                  </div>
                </div>
              </div>

              {/* Témoignage */}
              <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl p-6 border border-purple-500/20">
                <div className="flex items-start gap-4">
                  <div className="text-4xl text-purple-400">"</div>
                  <div>
                    <p className="text-gray-300 italic mb-3">
                      Grâce à MaBoiteDigitale, j'ai pu créer ma signature email professionnelle et mon mini-site en quelques minutes. 
                      Un vrai gain de temps pour ma communication !
                    </p>
                    <p className="text-purple-400 font-semibold">— Un adhérent ETF satisfait</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Digitaux */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Services Digitaux</h2>
            <p className="text-lg text-gray-600">Développez votre présence en ligne</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {digitalServices.map((service) => {
              const IconComponent = iconMap[service.icon];
              return (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">{service.price}</span>
                      <span className="text-xl text-gray-600">{service.currency}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {service.delivery} • {service.guarantee}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Commander
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tarifs Adhésion */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tarifs d'Adhésion</h2>
            <p className="text-lg text-gray-600">Choisissez la formule adaptée à vos besoins</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {membershipPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative hover:shadow-lg transition-shadow ${
                  plan.popular ? 'border-2 border-blue-500' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    Populaire
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-xl text-gray-600">{plan.currency}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Adhérer
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Plans IA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-purple-100 text-purple-700">OPTIONNEL</Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Assistance IA</h2>
            <p className="text-lg text-gray-600">Réservé aux membres de l'association</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {aiPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative hover:shadow-lg transition-shadow ${
                  plan.popular ? 'border-2 border-purple-500' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
                    RECOMMANDÉ
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-xl text-gray-600">{plan.currency}/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant="outline" disabled={!plan.available}>
                    {plan.available ? 'Souscrire' : 'Disponible bientôt'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
