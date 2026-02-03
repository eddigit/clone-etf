import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Check, Shield, FileText, TrendingUp, Bot, Globe, Rocket, ExternalLink, Sparkles, Mail, BarChart3, Users, Palette, Calendar, Headphones } from 'lucide-react';
import { services, digitalServices, aiPlans } from '../mockData';
import MembershipSelector from '../components/MembershipSelector';

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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
              PARTENARIAT COACH DIGITAL
            </Badge>
            <h2 className="text-4xl font-bold text-white mb-4">
              Accompagnement Digital Personnalisé
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Un partenariat exclusif avec un coach digital pour accompagner les commerçants et adhérents En Toute Franchise dans leur projet digital
            </p>
          </div>

          {/* Services de coaching digital */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-slate-800/70 backdrop-blur rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/60 transition-all hover:transform hover:scale-105">
              <Globe className="h-10 w-10 text-green-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Conception de Site Internet</h3>
              <p className="text-gray-400 text-sm">
                Créez votre vitrine en ligne professionnelle pour présenter votre activité et attirer de nouveaux clients
              </p>
            </div>
            <div className="bg-slate-800/70 backdrop-blur rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/60 transition-all hover:transform hover:scale-105">
              <Rocket className="h-10 w-10 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Projet Digital</h3>
              <p className="text-gray-400 text-sm">
                Accompagnement complet dans la conception et la mise en œuvre de votre stratégie digitale
              </p>
            </div>
            <div className="bg-slate-800/70 backdrop-blur rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/60 transition-all hover:transform hover:scale-105">
              <BarChart3 className="h-10 w-10 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Présence sur Google</h3>
              <p className="text-gray-400 text-sm">
                Optimisez votre visibilité locale et soyez trouvé facilement par vos clients potentiels
              </p>
            </div>
            <div className="bg-slate-800/70 backdrop-blur rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/60 transition-all hover:transform hover:scale-105">
              <Users className="h-10 w-10 text-orange-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Réseaux Sociaux</h3>
              <p className="text-gray-400 text-sm">
                Apprenez à gérer efficacement vos réseaux sociaux pour développer votre communauté
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image de la plateforme */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-2xl opacity-30 transform -rotate-3"></div>
              <div className="relative bg-slate-800 rounded-2xl p-2 shadow-2xl border border-purple-500/30">
                <img 
                  src="https://res.cloudinary.com/dtoink4qi/image/upload/v1768391962/Capture_d_%C3%A9cran_2026-01-14_094205_kellpl.png" 
                  alt="Dashboard MaBoiteDigitale - Tous vos outils digitaux" 
                  className="w-full rounded-xl"
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
                  <Bot className="h-6 w-6 mr-3 text-purple-400" />
                  <a href="https://maboitedigitale.com/" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
                    MaBoiteDigitale.com
                  </a>
                </h3>
                <p className="text-gray-300 mb-4">
                  Notre partenaire <a href="https://maboitedigitale.com/" target="_blank" rel="noopener noreferrer" className="text-purple-400 font-bold hover:text-purple-300">MaBoiteDigitale</a> met à disposition des adhérents ETF
                  une plateforme complète et un <strong className="text-green-400">accompagnement personnalisé</strong> pour réussir votre transformation digitale.
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
                    <Bot className="h-5 w-5 mr-2 text-purple-400" />
                    <span>Coach Digital IA</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="bg-purple-600 hover:bg-purple-700 flex-1"
                    onClick={() => window.open('https://maboitedigitale.com', '_blank')}
                  >
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Découvrir maboitedigitale.com
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
                      Le coach digital m'a accompagné dans la création de mon site et m'a appris à gérer ma présence sur Google. 
                      Aujourd'hui, je reçois des clients grâce à internet !
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

          <MembershipSelector variant="light" showTitle={false} />
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
