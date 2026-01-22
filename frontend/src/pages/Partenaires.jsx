import React, { useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { 
  Handshake, 
  Shield, 
  Eye, 
  Scale, 
  Building2, 
  MapPin, 
  Store,
  ExternalLink,
  Users
} from 'lucide-react';

// Liste des partenaires - facilement extensible
const partenaires = [
  {
    id: 1,
    nom: "SOS MAIRES",
    description: "Autonomie et résilience des communes - Alerter les maires et construire ensemble la résilience territoriale",
    logo: "https://sosmaires.org/wp-content/uploads/2022/01/cropped-sos-maires_logo-2.png?w=580&h=435",
    url: "https://sosmaires.org"
  },
  {
    id: 2,
    nom: "Démocraties Directes",
    description: "Initiative démocratique pour une citoyenneté mature et instruite - Vers la première démocratie directe réelle",
    logo: "https://www.democratie.direct/wp-content/uploads/2024/06/logo-ddf-carre-final.png",
    url: "https://democratiesdirectes.org"
  },
  {
    id: 3,
    nom: "Coalition citoyenne",
    description: "Un outil pour tous permettant la conquête de la souveraineté populaire - S'unir pour agir",
    logo: "https://coalition-citoyenne.fr/wp-content/uploads/2025/01/Logo-Coalition-300x300.png",
    url: "https://coalition-citoyenne.fr"
  },
  {
    id: 4,
    nom: "GADSECA",
    description: "Groupement d'action pour la défense des commerçants et artisans",
    logo: null,
    url: null
  },
  {
    id: 5,
    nom: "CAPRE06",
    description: "Collectif pour l'aménagement et la protection de l'environnement dans les Alpes-Maritimes",
    logo: null,
    url: null
  }
];

// Valeurs communes
const valeurs = [
  {
    icon: Shield,
    titre: "Défense de l'intérêt général",
    couleur: "blue"
  },
  {
    icon: Eye,
    titre: "Transparence des décisions publiques",
    couleur: "green"
  },
  {
    icon: Scale,
    titre: "Respect des règles démocratiques",
    couleur: "purple"
  },
  {
    icon: Building2,
    titre: "Urbanisme commercial équitable",
    couleur: "orange"
  },
  {
    icon: MapPin,
    titre: "Équilibre des territoires",
    couleur: "red"
  },
  {
    icon: Store,
    titre: "Soutien au commerce et à l'artisanat de proximité",
    couleur: "teal"
  }
];

const getColorClasses = (couleur) => {
  const colors = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
    red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-600', border: 'border-teal-200' }
  };
  return colors[couleur] || colors.blue;
};

const Partenaires = () => {
  // SEO - Mise à jour des balises meta
  useEffect(() => {
    document.title = 'Nos Partenaires | EN TOUTE FRANCHISE - Association de commerçants et artisans';
    
    // Meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'Découvrez les partenaires de l\'association EN TOUTE FRANCHISE : organisations citoyennes engagées pour une démocratie locale transparente et un aménagement du territoire respectueux de l\'intérêt général.';
    
    return () => {
      document.title = 'En Toute Franchise Association';
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50 py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <Handshake className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Nos partenaires
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Ensemble pour une démocratie locale transparente et un aménagement du territoire respectueux de l'intérêt général
              </p>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="py-12 lg:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none text-center">
              <p className="text-lg text-gray-700 leading-relaxed">
                <strong className="text-gray-900">EN TOUTE FRANCHISE</strong> est une association de commerçants et d'artisans indépendants 
                engagée dans la défense de l'intérêt général et le respect des règles démocratiques.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mt-4">
                Nous travaillons en lien avec des organisations citoyennes partageant les mêmes valeurs afin de garantir 
                un aménagement du territoire juste, équilibré et conforme au droit, au bénéfice de l'économie locale et des citoyens.
              </p>
            </div>
          </div>
        </section>

        {/* Valeurs communes */}
        <section className="py-12 lg:py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Valeurs communes</h2>
              <p className="text-gray-600">Les principes qui nous unissent</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {valeurs.map((valeur, index) => {
                const IconComponent = valeur.icon;
                const colors = getColorClasses(valeur.couleur);
                
                return (
                  <div 
                    key={index}
                    className={`flex items-center gap-4 p-5 bg-white rounded-xl border ${colors.border} shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <span className="text-gray-800 font-medium">{valeur.titre}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Liste des partenaires */}
        <section className="py-12 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos partenaires</h2>
              <p className="text-gray-600">Des organisations engagées à nos côtés</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {partenaires.map((partenaire) => (
                <Card 
                  key={partenaire.id}
                  className="hover:shadow-lg transition-all duration-300 border-gray-200 group"
                >
                  <CardContent className="p-6">
                    {/* Zone logo - prête pour l'ajout ultérieur */}
                    <div className="w-full h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg flex items-center justify-center mb-5 group-hover:from-blue-50 group-hover:to-slate-50 transition-colors">
                      {partenaire.logo ? (
                        <img 
                          src={partenaire.logo} 
                          alt={`Logo ${partenaire.nom}`}
                          className="max-h-16 max-w-full object-contain"
                        />
                      ) : (
                        <Users className="h-10 w-10 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {partenaire.nom}
                    </h3>
                    
                    {partenaire.description && (
                      <p className="text-sm text-gray-600 mb-4">
                        {partenaire.description}
                      </p>
                    )}
                    
                    {partenaire.url && (
                      <a 
                        href={partenaire.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Visiter le site
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Conclusion */}
        <section className="py-12 lg:py-16 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Handshake className="h-12 w-12 text-blue-400 mx-auto mb-6" />
            <p className="text-lg lg:text-xl text-gray-200 leading-relaxed">
              Ensemble, nous œuvrons pour que les acteurs publics, les élus et les administrations 
              respectent les lois et les principes démocratiques, afin de garantir un développement 
              territorial durable, équilibré et conforme à l'intérêt général.
            </p>
          </div>
        </section>
      </div>
  );
};

export default Partenaires;
