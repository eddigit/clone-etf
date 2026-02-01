import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle2, Users, Store, Building2, ExternalLink } from 'lucide-react';

// Configuration des adhésions avec liens HelloAsso directs
const MEMBERSHIP_LIST = [
  {
    id: 'individual',
    title: 'Particuliers',
    icon: Users,
    price: '10 à 50',
    description: 'Pour les consommateurs et individus',
    benefits: [
      'Accès aux ressources et retours d\'expérience',
      'Newsletter mensuelle',
      'Participation aux assemblées',
      'Soutien aux actions collectives'
    ],
    helloAssoUrl: 'https://www.helloasso.com/associations/en-toute-franchise/adhesions/adhesion-2026-particuliers',
    popular: false
  },
  {
    id: 'association',
    title: 'Associations',
    icon: Building2,
    price: '152.32',
    description: 'Pour les associations partenaires',
    benefits: [
      'Partenariat privilégié',
      'Actions et orientations conjointes',
      'Partage de ressources',
      'Coordination des initiatives'
    ],
    helloAssoUrl: 'https://www.helloasso.com/associations/en-toute-franchise/adhesions/association-association-2026',
    popular: false
  },
  {
    id: 'professional_base',
    title: 'Commerçants - Artisans',
    subtitle: 'Moins de 100m²',
    icon: Store,
    price: '50',
    description: 'Pour les professionnels du commerce et de l\'artisanat (moins de 100m²)',
    benefits: [
      'Orientation et accompagnement personnalisé',
      'Accès à l\'assistant IA d\'information',
      'Partage de retours d\'expérience',
      'Orientation vers avocats partenaires',
      'Modèles et ressources documentaires'
    ],
    helloAssoUrl: 'https://www.helloasso.com/associations/en-toute-franchise/adhesions/adhesion-2026-commercants-artisans-50-2-2',
    popular: true
  },
  {
    id: 'professional_plus',
    title: 'Commerçants - Artisans',
    subtitle: '100 à 299m²',
    icon: Store,
    price: '152.32',
    description: 'Pour les commerces de 100 à 299m²',
    benefits: [
      'Accompagnement et orientation renforcés',
      'Mise en relation avec avocats partenaires',
      'Veille réglementaire informative',
      'Accès prioritaire au réseau',
      'Formation et partage d\'expérience'
    ],
    helloAssoUrl: 'https://www.helloasso.com/associations/en-toute-franchise/adhesions/adhesion-2026-100-m2-commercants-artisans-152-32-2',
    popular: false
  },
  {
    id: 'medium_store',
    title: 'Commerçants - Magasins',
    subtitle: 'Plus de 300 m²',
    icon: Store,
    price: '304.90',
    description: 'Pour les commerces de plus de 300 m²',
    benefits: [
      'Accompagnement et orientation renforcés',
      'Mise en relation avec avocats partenaires',
      'Veille réglementaire informative',
      'Accès prioritaire au réseau',
      'Formation et partage d\'expérience'
    ],
    helloAssoUrl: 'https://www.helloasso.com/associations/en-toute-franchise/adhesions/2026-magasins-de-300-m-et-plus-2',
    popular: false
  },
  {
    id: 'large_store',
    title: 'Grands Magasins',
    subtitle: 'Plus de 1 500 m²',
    icon: Store,
    price: '609.80',
    description: 'Pour les commerces de plus de 1 500 m²',
    benefits: [
      'Accompagnement et orientation premium',
      'Mise en relation avec avocats spécialisés',
      'Veille réglementaire complète',
      'Accès prioritaire au réseau national',
      'Formation et partage d\'expérience avancé'
    ],
    helloAssoUrl: 'https://www.helloasso.com/associations/en-toute-franchise/adhesions/2026-magasins-de-1-500-a-2-500-m2-2',
    popular: false
  },
  {
    id: 'hypermarket',
    title: 'Hypermarchés',
    subtitle: 'Plus de 2 500 m²',
    icon: Store,
    price: '904.69',
    description: 'Pour les commerces de plus de 2 500 m²',
    benefits: [
      'Accompagnement et orientation VIP',
      'Mise en relation directe avec cabinets d\'avocats',
      'Veille réglementaire personnalisée',
      'Accès prioritaire au réseau national et européen',
      'Formation et partage d\'expérience exclusif'
    ],
    helloAssoUrl: 'https://www.helloasso.com/associations/en-toute-franchise/adhesions/2026-magasins-de-2-500-m-et-plus-2',
    popular: false
  }
];

// Variante sombre (pour page Adhesion)
function MembershipCardDark({ config }) {
  const Icon = config.icon;
  const isPopular = config.popular;
  
  return (
    <Card 
      className={`relative flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl bg-slate-800/50 backdrop-blur border-slate-700 ${
        isPopular ? 'border-green-500 border-2 shadow-lg shadow-green-500/10' : 'hover:border-green-500/50'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
            Le plus populaire
          </span>
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <CardTitle className="text-xl text-white">
              {config.title}
            </CardTitle>
            {config.subtitle && (
              <div className="text-sm font-medium text-green-400 mt-1">
                {config.subtitle}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-3xl font-bold text-green-400">
            {config.price}
          </span>
          <span className="text-lg text-gray-400">€</span>
          <span className="text-sm text-gray-500 ml-1">/an</span>
        </div>
        
        <CardDescription className="text-gray-400 text-sm">
          {config.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pt-0">
        <div className="border-t border-slate-700 pt-4 mb-4 flex-1">
          <ul className="space-y-2">
            {config.benefits.slice(0, 4).map((benefit, idx) => (
              <li key={idx} className="flex items-start text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{benefit}</span>
              </li>
            ))}
            {config.benefits.length > 4 && (
              <li className="text-xs text-gray-500 pl-6">
                + {config.benefits.length - 4} autres avantages
              </li>
            )}
          </ul>
        </div>

        <Button 
          onClick={() => window.open(config.helloAssoUrl, '_blank')}
          className={`w-full flex items-center justify-center gap-2 ${
            isPopular 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg' 
              : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
          }`}
        >
          Adhérer maintenant
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// Variante claire (pour Home et Services)
function MembershipCardLight({ config }) {
  const Icon = config.icon;
  const isPopular = config.popular;
  
  return (
    <Card 
      className={`relative flex flex-col hover:shadow-lg transition-shadow ${
        isPopular ? 'border-2 border-blue-500' : ''
      }`}
    >
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
          Le plus populaire
        </Badge>
      )}
      
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-5 w-5 text-blue-600" />
          <div className="flex flex-col">
            <CardTitle className="text-xl">{config.title}</CardTitle>
            {config.subtitle && (
              <span className="text-sm text-blue-600 font-medium">{config.subtitle}</span>
            )}
          </div>
        </div>
        <div className="mb-2">
          <span className="text-3xl font-bold text-gray-900">{config.price}</span>
          <span className="text-xl text-gray-600">€</span>
        </div>
        <CardDescription>{config.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        <ul className="space-y-2 mb-6 flex-1">
          {config.benefits.slice(0, 4).map((benefit, idx) => (
            <li key={idx} className="flex items-start text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          onClick={() => window.open(config.helloAssoUrl, '_blank')}
          className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          Adhérer
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// Composant principal exporté
export default function MembershipSelector({ variant = 'dark', showTitle = true }) {
  const CardComponent = variant === 'dark' ? MembershipCardDark : MembershipCardLight;
  
  return (
    <div className={variant === 'dark' ? 'space-y-8' : 'space-y-6'}>
      {showTitle && variant === 'dark' && (
        <div className="text-center mb-8">
          <div className="inline-block bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-green-500/30">
            ADHÉSION 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Rejoignez le mouvement
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Choisissez l'adhésion adaptée à votre profil et soutenez notre combat pour la justice commerciale
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MEMBERSHIP_LIST.map((config) => (
          <CardComponent
            key={config.id}
            config={config}
          />
        ))}
      </div>

      {/* Footer info */}
      {variant === 'dark' && (
        <div className="mt-12 text-center">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 max-w-2xl mx-auto">
            <p className="text-gray-400 text-sm">
              <strong className="text-green-400">100% sécurisé</strong> — Paiement via HelloAsso, plateforme de confiance pour les associations.
              <br />
              <span className="text-gray-500">Votre adhésion est valable 1 an à compter de la date de paiement.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Export de la configuration pour utilisation externe
export { MEMBERSHIP_LIST };
