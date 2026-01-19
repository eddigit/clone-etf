import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ExternalLink, ShoppingCart, Youtube } from 'lucide-react';

const Livre418Milliards = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              <span className="text-red-500">418 MILLIARDS</span>
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              LA FRAUDE DE LA GRANDE DISTRIBUTION
            </h2>
            <p className="text-xl text-white mb-4">
              AVEC LA COMPLICITÉ DES ÉLUS ET DE L'ADMINISTRATION
            </p>
            <p className="text-lg text-white italic">
              MARTINE DONNETTE & CLAUDE DIOT
            </p>
            <p className="text-md text-white italic">
              AVEC PATRICK PASIN
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Book Cover */}
            <div className="flex flex-col items-center space-y-6">
              <Card className="bg-white shadow-2xl overflow-hidden w-full max-w-md">
                <img
                  src="https://res.cloudinary.com/dx4fqegqb/image/upload/v1768839304/Couverture-418_Milliards_f2duv2.jpg"
                  alt="Couverture du livre 418 Milliards"
                  className="w-full h-auto"
                />
              </Card>
              
              {/* Video Section */}
              <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Youtube className="h-6 w-6 text-red-500" />
                    Vidéo de présentation
                  </h3>
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      width="100%"
                      height="100%"
                      src="https://www.youtube.com/embed/cGxDEgsOZc8"
                      title="418 Milliards - Vidéo promo"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                </CardContent>
              </Card>

              {/* Purchase Section */}
              <Card className="bg-gradient-to-br from-green-600 to-green-700 border-green-500 w-full max-w-md">
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-white mb-2">18,00 €</p>
                    <p className="text-sm text-green-100">ISBN: 978-2-377-90-0107</p>
                  </div>
                  <Button
                    onClick={() => window.open('https://www.novimondi.com/fr/societe/47-418-milliards-la-fraude-de-la-grande-distribution-avec-la-complicite-des-elus-et-de-l-administration.html', '_blank')}
                    size="lg"
                    className="w-full bg-white text-green-700 hover:bg-green-50 font-bold text-lg py-6"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Acheter le livre
                  </Button>
                  <a
                    href="https://www.talmastudios.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-white hover:text-green-100 mt-4 text-sm"
                  >
                    www.talmastudios.com
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Book Description */}
            <div className="space-y-8">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-white text-lg leading-relaxed mb-4">
                      Est-il possible que les grandes surfaces exploitent en France des millions de mètres carrés 
                      en toute illégalité, sans autorisation administrative, voire sans permis de construire ou 
                      irréguliers, parfois sur des zones inondables, naturelles ou à risque, donc inconstructibles ?
                    </p>
                    <p className="text-white text-lg leading-relaxed mb-4">
                      Et en toute impunité, donc avec la complicité du gouvernement, des élus et de l'Administration ? 
                      Ainsi, pourquoi les préfets refusent-ils de faire respecter la loi pour sanctionner les fraudeurs ?
                    </p>
                    <p className="text-white text-lg leading-relaxed mb-4">
                      Or, ces surfaces illicites devraient être fermées et les amendes à encaisser s'élèvent à des 
                      dizaines, ou plutôt des centaines, de milliards d'euros.
                    </p>
                    <p className="text-white text-lg leading-relaxed mb-4">
                      La fraude généralisée à une telle échelle semble impensable, c'est pourtant ce dont témoigne 
                      ce livre, en révélant un système de prédation destructeur net et de richesse et d'emplois, 
                      qui fragilise des secteurs essentiels comme l'agriculture et l'industrie. Quant à son impact 
                      sur notre cadre de vie et l'environnement, il est quasiment irréversible.
                    </p>
                    <p className="text-white text-lg leading-relaxed">
                      De plus, d'autres dangers pointent à l'horizon. Il devient donc urgent d'ouvrir un débat 
                      collectif, car c'est le type de société dans lequel nous voulons vivre qui se décide à notre 
                      insu. C'est à cette prise de conscience que <strong className="text-white">418 Milliards</strong> apporte 
                      sa contribution.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Authors Bio Section */}
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-6 border-b border-slate-600 pb-3">
                    Les Auteurs
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white text-2xl font-bold">
                        MD
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-green-400 mb-2">Martine Donnette & Claude Diot</h4>
                        <p className="text-white leading-relaxed">
                          Anciens commerçants, Martine Donnette et Claude Diot créent l'association 
                          <strong className="text-white"> En Toute Franchise</strong> en 1994, axée principalement contre 
                          la fraude des grandes surfaces.
                        </p>
                      </div>
                    </div>
                    <p className="text-white leading-relaxed pl-24">
                      <strong className="text-white">418 Milliards</strong> est le témoignage de leur engagement 
                      et de leurs actions depuis plus de vingt-cinq ans sur ce sujet globalement inconnu du grand public.
                    </p>
                    <div className="bg-slate-700/50 rounded-lg p-6 mt-6 border-l-4 border-red-500">
                      <p className="text-white leading-relaxed italic">
                        Il est temps de demander des explications aux politiques, qui eux connaissent parfaitement 
                        la situation. D'ailleurs, <strong className="text-white">Bruno Le Maire</strong> n'hésite pas 
                        à parler de <span className="text-red-400 font-bold">« scandale »</span> dans une réponse à 
                        En Toute Franchise. En tant que ministre, qu'eût-il pu tout le faire cesser ?
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-slate-900 via-red-900/20 to-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Rejoignez le combat pour la transparence
          </h2>
          <p className="text-xl text-white mb-8">
            Soutenez notre action en adhérant à l'association En Toute Franchise
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.location.href = '/adhesion'}
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              Adhérer à l'association
            </Button>
            <Button
              onClick={() => window.open('https://www.novimondi.com/fr/societe/47-418-milliards-la-fraude-de-la-grande-distribution-avec-la-complicite-des-elus-et-de-l-administration.html', '_blank')}
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-slate-900 font-bold"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Commander le livre
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-8 px-4 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white text-sm">
            Un livre édité par{' '}
            <a
              href="https://www.talmastudios.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300"
            >
              Talma Studios
            </a>
            {' '}• ISBN: 978-2-377-90-0107
          </p>
        </div>
      </section>
    </div>
  );
};

export default Livre418Milliards;
