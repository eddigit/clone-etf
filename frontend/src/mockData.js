// Mock data pour la plateforme associative

export const stats = [
  { value: '1994', label: 'Année de création' },
  { value: '30+', label: 'Années d\'expérience' },
  { value: '100%', label: 'Indépendante' },
  { value: '2500+', label: 'Membres protégés' }
];

export const services = [
  {
    id: 1,
    icon: 'Shield',
    title: 'Accompagnement Juridique',
    description: 'Orientation et soutien pour vos démarches juridiques',
    features: [
      'Orientation vers avocats partenaires',
      'Partage de connaissances jurisprudentielles',
      'Accompagnement dans vos démarches',
      'Conseils basés sur 30 ans d\'expérience'
    ],
    disclaimer: 'L\'association n\'est pas un cabinet d\'avocats'
  },
  {
    id: 2,
    icon: 'FileText',
    title: 'Assistance Administrative',
    description: 'Aide et orientation face aux organismes officiels',
    features: [
      'Accompagnement URSSAF et caisses',
      'Aide à la préparation aux contrôles',
      'Orientation sur les procédures',
      'Partage d\'expériences réussies'
    ]
  },
  {
    id: 3,
    icon: 'TrendingUp',
    title: 'Conseil & Orientation',
    description: 'Partage d\'expertise basé sur 30 ans d\'expérience',
    features: [
      'Orientation pour votre activité',
      'Partage de bonnes pratiques',
      'Mise en relation avec experts',
      'Veille réglementaire informative'
    ]
  },
  {
    id: 4,
    icon: 'Bot',
    title: 'Assistant IA d\'Orientation 24/7',
    description: 'Outil d\'information basé sur 30 ans d\'expérience',
    features: [
      'Disponible 24/7 pour information',
      'Base de connaissances de 30 ans',
      'Orientation sur vos questions',
      'Ne remplace pas un avocat'
    ],
    isNew: true,
    disclaimer: 'Outil d\'information uniquement, ne remplace pas un conseil juridique professionnel'
  }
];

export const membershipPlans = [
  {
    id: 1,
    type: 'individual',
    name: 'Particuliers',
    price: '10 à 50',
    currency: '€',
    description: 'Pour les consommateurs et individus',
    features: [
      'Accès aux ressources et retours d\'expérience',
      'Newsletter mensuelle',
      'Participation aux assemblées',
      'Soutien aux actions collectives'
    ],
    popular: false,
    helloAssoUrl: 'https://www.helloasso.com/associations/en-toute-franchise/adhesions/adhesion-2025-particuliers'
  },
  {
    id: 2,
    type: 'professional',
    name: 'Commerçants - Artisans',
    price: '50',
    currency: '€',
    description: 'Pour les professionnels du commerce et de l\'artisanat (moins de 100m²)',
    features: [
      'Orientation et accompagnement personnalisé',
      'Accès à l\'assistant IA d\'information',
      'Partage de retours d\'expérience',
      'Orientation vers avocats partenaires',
      'Modèles et ressources documentaires'
    ],
    popular: true,
    helloAssoUrl: 'https://www.helloasso.com/associations/en-toute-franchise/adhesions/adhesion-2025-commercants-artisans',
    disclaimer: 'L\'association accompagne et oriente, ne remplace pas un avocat'
  },
  {
    id: 3,
    type: 'professional_plus',
    name: 'Commerçants +100m²',
    price: '152.32',
    currency: '€',
    description: 'Pour les commerces de plus de 100m²',
    features: [
      'Accompagnement et orientation renforcés',
      'Mise en relation avec avocats partenaires',
      'Veille réglementaire informative',
      'Accès prioritaire au réseau',
      'Formation et partage d\'expérience'
    ],
    popular: false,
    helloAssoUrl: 'https://www.helloasso.com/associations/en-toute-franchise/adhesions/adhesion-2025-entreprises'
  },
  {
    id: 4,
    type: 'association',
    name: 'Associations',
    price: '152.32',
    currency: '€',
    description: 'Pour les associations partenaires',
    features: [
      'Partenariat privilégié',
      'Actions et orientations conjointes',
      'Partage de ressources',
      'Coordination des initiatives'
    ],
    popular: false,
    helloAssoUrl: 'https://www.helloasso.com/associations/en-toute-franchise/adhesions/adhesion-2025-associations'
  }
];

export const aiPlans = [
  {
    id: 1,
    name: 'Plan Essentiel',
    price: '10',
    currency: '€',
    period: 'mois',
    description: 'Pour un usage ponctuel et des questions ciblées',
    tokens: '1000',
    minutes: '10',
    features: [
      '1 000 tokens IA/mois',
      '10 minutes d\'assistance/mois',
      'Réponses instantanées 24/7',
      'Expertise de 30 ans intégrée',
      'Validation par nos experts'
    ],
    available: false
  },
  {
    id: 2,
    name: 'Plan Complet',
    price: '39',
    currency: '€',
    period: 'mois',
    description: 'Pour un accompagnement intensif et quotidien',
    tokens: '10000',
    minutes: '50',
    features: [
      '10 000 tokens IA/mois',
      '50 minutes d\'assistance/mois',
      'Support prioritaire par nos experts',
      'Analyses approfondies personnalisées',
      'Rapports mensuels détaillés'
    ],
    popular: true,
    available: false
  }
];

export const digitalServices = [
  {
    id: 1,
    title: 'Création de Site Web Professionnel',
    description: 'Site web sur-mesure qui reflète votre expertise et attire de nouveaux clients',
    price: '499',
    currency: '€',
    delivery: 'Livraison en 15 jours',
    guarantee: 'Garantie satisfaction',
    features: [
      'Design moderne et responsive',
      'Optimisation SEO avancée',
      'Hébergement premium 1 an offert',
      'Formation complète incluse',
      'Support technique 12 mois',
      'Intégration réseaux sociaux'
    ],
    icon: 'Globe'
  },
  {
    id: 2,
    title: 'Coaching Digital Personnalisé',
    description: 'Accompagnement stratégique pour maximiser votre visibilité et vos ventes en ligne',
    price: '60',
    currency: '€',
    delivery: 'Sessions personnalisées',
    guarantee: 'Résultats garantis',
    features: [
      'Audit digital complet (Google, réseaux sociaux)',
      'Stratégie marketing digital sur-mesure',
      'Gestion réseaux sociaux professionnels',
      'Optimisation référencement local',
      'Formation outils digitaux',
      'Suivi personnalisé de vos progrès'
    ],
    icon: 'Rocket'
  }
];

export const testimonials = [
  {
    id: 1,
    name: 'Annie D.',
    role: 'Commerçante',
    avatar: 'AD',
    content: 'Je n\'ai pas perdu mon bail commercial grâce aux conseils d\'En Toute Franchise. Leur expertise m\'a sauvé d\'une situation très difficile.',
    rating: 5
  },
  {
    id: 2,
    name: 'Frédéric B.',
    role: 'Entrepreneur',
    avatar: 'FB',
    content: 'En conflit avec mon bailleur, grâce aux experts du Conseil Juridique d\'En toute Franchise, j\'ai pu négocier le renouvellement de mon bail aux mêmes conditions.',
    rating: 5
  },
  {
    id: 3,
    name: 'Viviane D.',
    role: 'Propriétaire de magasin',
    avatar: 'VD',
    content: 'J\'ai pu réinvestir dans mon magasin. Grâce aux recours d\'En toute franchise la grande surface ne s\'est pas installée à côté de chez moi.',
    rating: 5
  },
  {
    id: 4,
    name: 'Geoffrey K.',
    role: 'Utilisateur IA',
    avatar: 'GK',
    content: 'J\'utilise leur Intelligence Artificielle juridique et administrative depuis 3 mois, si j\'avais connu ce service avant ! Merci à eux pour cette innovation.',
    rating: 5
  },
  {
    id: 5,
    name: 'Nadine W.',
    role: 'E-commerçante',
    avatar: 'NW',
    content: 'Grâce à leur partenaire j\'ai pu avoir un site e-commerce pas cher et efficace avec un accompagnement, et leur IA juridique est de grande aide pour un budget faible.',
    rating: 5
  }
];

export const videos = [
  {
    id: 1,
    videoId: 'oTzDsV1flnM',
    title: 'Notre Mission - En Toute Franchise',
    description: 'Découvrez notre association et notre combat pour vos droits'
  },
  {
    id: 2,
    videoId: 'EJrugkeI82Q',
    title: 'Nouvelle vidéo',
    description: 'Découvrez notre dernière vidéo sur notre chaîne YouTube'
  },
  {
    id: 3,
    videoId: '2ZgurP7jcD4',
    title: 'Dernière vidéo',
    description: 'Notre plus récente publication sur YouTube'
  }
];

export const articles = [
  {
    id: 1,
    title: 'Guide complet du bail commercial en 2025',
    excerpt: 'Tout ce que vous devez savoir sur les baux commerciaux : droits, obligations, renouvellement et résiliation.',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
    author: 'Jean Dupont',
    date: '2025-01-15',
    category: 'Juridique',
    readTime: '8 min'
  },
  {
    id: 2,
    title: 'Concurrence déloyale : comment se défendre',
    excerpt: 'Les recours juridiques disponibles pour protéger votre commerce contre la concurrence déloyale.',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800',
    author: 'Marie Martin',
    date: '2025-01-10',
    category: 'Défense',
    readTime: '6 min'
  },
  {
    id: 3,
    title: 'Optimisation fiscale pour les commerçants',
    excerpt: 'Stratégies légales pour réduire votre charge fiscale tout en respectant la réglementation.',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
    author: 'Pierre Dubois',
    date: '2025-01-05',
    category: 'Fiscalité',
    readTime: '10 min'
  },
  {
    id: 4,
    title: 'Les nouvelles réglementations 2025',
    excerpt: 'Découvrez les changements réglementaires qui impactent votre activité cette année.',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800',
    author: 'Sophie Bernard',
    date: '2025-01-02',
    category: 'Actualités',
    readTime: '5 min'
  }
];

export const resources = [
  {
    id: 1,
    title: 'Modèle de lettre de mise en demeure',
    type: 'document',
    category: 'Modèles juridiques',
    format: 'DOCX',
    size: '45 KB',
    downloads: 234
  },
  {
    id: 2,
    title: 'Guide du renouvellement de bail',
    type: 'guide',
    category: 'Guides pratiques',
    format: 'PDF',
    size: '2.3 MB',
    downloads: 567
  },
  {
    id: 3,
    title: 'Checklist contrôle URSSAF',
    type: 'checklist',
    category: 'Aide administrative',
    format: 'PDF',
    size: '890 KB',
    downloads: 189
  },
  {
    id: 4,
    title: 'Modèle de contrat de prestation',
    type: 'document',
    category: 'Modèles juridiques',
    format: 'DOCX',
    size: '52 KB',
    downloads: 423
  }
];

export const contactInfo = {
  phone: '07 56 97 44 19',
  email: 'assistance@entoutefranchise.fr',
  address: '1 rue François Boucher',
  city: '13700 Marignane',
  hours: 'Lun-Ven 9h-18h • Sam 9h-12h',
  emergencyPhone: '07 56 97 44 19'
};

export const mockConversations = [
  {
    id: 1,
    title: 'Question sur bail commercial',
    date: '2025-01-20',
    messagesCount: 5,
    lastMessage: 'Merci pour ces précisions...'
  },
  {
    id: 2,
    title: 'Litige avec bailleur',
    date: '2025-01-18',
    messagesCount: 8,
    lastMessage: 'Quels sont mes recours...'
  }
];

export const mockMessages = [
  {
    id: 1,
    conversationId: 1,
    role: 'user',
    content: 'Bonjour, j\'ai une question sur mon bail commercial. Mon bailleur souhaite augmenter le loyer de 30%. Est-ce légal ?',
    timestamp: '2025-01-20T10:30:00'
  },
  {
    id: 2,
    conversationId: 1,
    role: 'assistant',
    content: 'Bonjour. Non, une augmentation de 30% n\'est généralement pas conforme à la réglementation. Le bail commercial est encadré par le statut des baux commerciaux. L\'augmentation du loyer lors du renouvellement est plafonnée selon l\'indice des loyers commerciaux (ILC) ou l\'indice des loyers des activités tertiaires (ILAT). Une augmentation de 30% serait excessive sauf circonstances très particulières.',
    timestamp: '2025-01-20T10:31:00'
  }
];
