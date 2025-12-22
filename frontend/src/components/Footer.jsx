import React from 'react';
import { Link } from 'react-router-dom';
import { contactInfo } from '../mockData';
import { Phone, Mail, MapPin, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">ETF</span>
              </div>
              <span className="text-lg font-bold">En Toute Franchise</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              30 ans de combat pour la justice
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Heart className="h-4 w-4 text-red-500" />
              <span>Apolitique depuis 1994</span>
            </div>
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
              <li className="text-gray-400">Protection Juridique</li>
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

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>© 2025 En Toute Franchise. Association apolitique, libre et indépendante.</p>
          <p className="mt-2">Ensemble, faisons respecter l'équité, la transparence et la justice.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
