import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { contactInfo } from '../mockData';
import { Phone, Mail, MapPin, Heart, GitCommit, Users, ArrowRight } from 'lucide-react';
import { getVersionString, BUILD_INFO } from '../config/buildInfo';
import { Button } from './ui/button';

const Footer = () => {
  const navigate = useNavigate();
  
  return (
    <footer className="bg-gray-900 text-white">
      {/* CTA Banner */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-white mb-2">
                Rejoignez le mouvement pour la justice commerciale
              </h3>
              <p className="text-gray-400 text-sm">
                Chaque adhésion et chaque don renforce notre combat collectif depuis 1994
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => navigate('/adhesion')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-green-500/25 transition-all group"
              >
                <Users className="h-4 w-4 mr-2" />
                Adhérer
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <a 
                href="https://www.helloasso.com/associations/en-toute-franchise/formulaires/1" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button 
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-red-500/25 transition-all group"
                >
                  <Heart className="h-4 w-4 mr-2 animate-pulse" />
                  Faire un don
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="https://aide.en-toutefranchise.com/lovable-uploads/19dabfce-86c9-4793-beb5-bcf6cb7b9e7b.png" 
                alt="En Toute Franchise Association Logo" 
                className="h-14 w-auto"
              />
              <span className="text-lg font-bold">En Toute Franchise</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              30 ans de combat pour la justice
            </p>
            <Link 
              to="/mentions-legales#mission" 
              className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors group cursor-pointer"
              title="Voir l'objet statutaire de l'association"
            >
              <Heart className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
              <span>Apolitique depuis 1994</span>
            </Link>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-400 hover:text-white transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/partenaires" className="text-gray-400 hover:text-white transition-colors">
                  Partenaires
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">Conseil & Accompagnement</li>
              <li className="text-gray-400">Assistance Administrative</li>
              <li className="text-gray-400">Conseil Stratégique</li>
              <li className="text-gray-400">Assistant IA 24/7</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2 text-gray-400">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{contactInfo.phone}</span>
              </li>
              <li className="flex items-start space-x-2 text-gray-400">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{contactInfo.email}</span>
              </li>
              <li className="flex items-start space-x-2 text-gray-400">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {contactInfo.address}<br />
                  {contactInfo.city}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="text-center text-sm text-gray-400">
            <p>© 2025 En Toute Franchise. Association apolitique, libre et indépendante.</p>
            <p className="mt-2">Ensemble, faisons respecter l'équité, la transparence et la justice.</p>
            
            {/* Liens légaux */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs">
              <Link to="/mentions-legales" className="text-gray-400 hover:text-white transition-colors">
                Mentions Légales
              </Link>
              <span className="text-gray-600">•</span>
              <Link to="/mentions-legales#rgpd" className="text-gray-400 hover:text-white transition-colors">
                Protection des données (RGPD)
              </Link>
            </div>
            
            {/* Crédits développement */}
            <div className="mt-4 text-xs text-gray-500">
              <p>
                Développement et design réalisés par{' '}
                <a 
                  href="https://www.maboitedigitale.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors font-medium"
                >
                  MaBoiteDigitale.com
                </a>
              </p>
            </div>
            
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
              <GitCommit className="h-3 w-3" />
              <span>{getVersionString()}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
