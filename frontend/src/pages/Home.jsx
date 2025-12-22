import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
  Play
} from 'lucide-react';
import {
  stats,
  services,
  membershipPlans,
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

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-green-900 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-6 bg-green-700 text-white hover:bg-green-800 border-green-600">
              <Shield className="h-3 w-3 mr-1" />
              Association Apolitique, Libre et Indépendante depuis 1994
            </Badge>
            
            {/* Logo Hero */}
            <div className="flex justify-center mb-8">
              <img 
                src="/logo-etf.svg" 
                alt="En Toute Franchise Logo" 
                className="h-40 md:h-56 w-auto drop-shadow-2xl"
              />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              En Toute Franchise
            </h1>
            <p className="text-xl md:text-2xl text-green-400 font-semibold mb-4">
              Défenseur de vos droits
            </p>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
              Association de Défense des Commerçants Artisans créée en janvier 1994, nous luttons pour faire
              respecter votre <strong className="text-green-400">liberté de travailler librement</strong> et vos droits fondamentaux contre le
              favoritisme d'État et la concurrence illicite organisée.
            </p>
            
            {/* Important Disclaimer */}
            <div className="max-w-2xl mx-auto mb-8 p-4 bg-slate-800/70 border border-green-800/50 rounded-lg">
              <p className="text-sm text-gray-300 text-center">
                <strong className="text-green-400">Important :</strong> Nous sommes une association d'accompagnement et d'orientation.
                Nous ne sommes pas un cabinet d'avocats. Nous partageons notre expérience de 30 ans et orientons vers des avocats partenaires si nécessaire.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={() => navigate('/register')}>
                <Users className="mr-2 h-5 w-5" />
                Rejoindre l'association
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/contact')}>
                <Heart className="mr-2 h-5 w-5 text-red-500" />
                Faire un don Hello Asso
              </Button>
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
                  Notre Combat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Faire respecter les décisions de justice</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Promouvoir l'équité et la transparence</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Lutter contre la concurrence déloyale</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">Défendre votre droit de travailler librement</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
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
                    Le plus populaire
                  </Badge>
                )}
                <CardHeader>
                  <div className="text-sm text-gray-500 mb-2">{plan.type}</div>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-xl text-gray-600">{plan.currency}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
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

          <div className="mt-12 p-6 bg-blue-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Services inclus avec toute adhésion :</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm">Protection juridique complète</span>
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

      {/* AI Plans Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-purple-100 text-purple-700">ÉTAPE 2 • OPTIONNELLE</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choisissez votre Plan d'Assistance IA</h2>
            <p className="text-lg text-gray-600">
              Réservé exclusivement aux membres de l'association
            </p>
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
                  <div className="flex items-center space-x-2 mb-2">
                    <Bot className="h-6 w-6 text-purple-600" />
                    <span className="text-sm font-semibold text-purple-600">Assistance IA</span>
                  </div>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-xl text-gray-600">{plan.currency}/ {plan.period}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {plan.tokens} tokens + {plan.minutes} minutes d'assistance IA/mois
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
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

          <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-xl max-w-4xl mx-auto">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Important à retenir</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>
                    <strong>Prérequis obligatoire :</strong> L'adhésion à l'association est obligatoire pour accéder à
                    l'assistance IA
                  </li>
                  <li>
                    <strong>Accès exclusif :</strong> L'assistance IA est réservée exclusivement aux membres de
                    l'association
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Digital Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Services Digitaux Professionnels</h2>
            <p className="text-lg text-gray-600">
              Développez votre présence en ligne avec l'expertise de nos spécialistes
            </p>
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
                      Commander ce service
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
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
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
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
            <Button variant="outline" size="lg">
              Voir nos 120 vidéos et reportages TV
            </Button>
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
                <p className="text-xs text-gray-500 mt-2">Appel gratuit depuis un fixe</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Support Email</h3>
                <p className="text-lg text-gray-700 mb-2">{contactInfo.email}</p>
                <p className="text-sm text-gray-600">Réponse garantie sous 4h</p>
                <p className="text-xs text-gray-500 mt-2">7j/7 pour les urgences</p>
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

          <div className="mt-12 p-6 bg-red-50 border-2 border-red-200 rounded-xl text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Urgence Juridique ?</h3>
            <p className="text-gray-700 mb-4">
              En cas de contrôle, mise en demeure ou situation d'urgence, contactez notre ligne directe :
            </p>
            <p className="text-3xl font-bold text-red-600 mb-2">{contactInfo.emergencyPhone}</p>
            <p className="text-sm text-gray-600">
              Disponible 24h/24 pour les membres • Intervention sous 2h en région PACA
            </p>
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
            <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-100">
              <Heart className="mr-2 h-5 w-5" />
              Faire un don Hello Asso
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
