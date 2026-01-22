import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Menu, X, LogIn, UserCircle, Heart, Users } from 'lucide-react';
import Notifications from './Notifications';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="https://aide.en-toutefranchise.com/lovable-uploads/19dabfce-86c9-4793-beb5-bcf6cb7b9e7b.png" 
              alt="En Toute Franchise Association Logo" 
              className="h-12 w-auto"
            />
            <span className="text-xl font-bold text-white hidden sm:block">En Toute Franchise Association</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                isActive('/') ? 'text-green-400' : 'text-gray-300 hover:text-green-400'
              }`}
            >
              Accueil
            </Link>
            <Link
              to="/services"
              className={`text-sm font-medium transition-colors ${
                isActive('/services') ? 'text-green-400' : 'text-gray-300 hover:text-green-400'
              }`}
            >
              Services
            </Link>
            <Link
              to="/adhesion"
              className={`text-sm font-medium transition-colors ${
                isActive('/adhesion') ? 'text-green-400' : 'text-gray-300 hover:text-green-400'
              }`}
            >
              Adhérer
            </Link>
            <Link
              to="/blog"
              className={`text-sm font-medium transition-colors ${
                isActive('/blog') ? 'text-green-400' : 'text-gray-300 hover:text-green-400'
              }`}
            >
              Blog
            </Link>
            <Link
              to="/livre-418-milliards"
              className={`text-sm font-medium transition-colors ${
                isActive('/livre-418-milliards') ? 'text-green-400' : 'text-gray-300 hover:text-green-400'
              }`}
            >
              Le Livre
            </Link>
            <Link
              to="/partenaires"
              className={`text-sm font-medium transition-colors ${
                isActive('/partenaires') ? 'text-green-400' : 'text-gray-300 hover:text-green-400'
              }`}
            >
              Partenaires
            </Link>
            <Link
              to="/contact"
              className={`text-sm font-medium transition-colors ${
                isActive('/contact') ? 'text-green-400' : 'text-gray-300 hover:text-green-400'
              }`}
            >
              Contact
            </Link>
          </div>

          {/* CTA Buttons + Auth */}
          <div className="hidden md:flex items-center space-x-3">
            {/* CTA Faire un don - toujours visible */}
            <a 
              href="https://www.helloasso.com/associations/en-toute-franchise/formulaires/1" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-red-500/25 transition-all"
              >
                <Heart className="h-4 w-4 mr-1 animate-pulse" />
                Faire un don
              </Button>
            </a>
            
            {/* CTA Adhérer - toujours visible */}
            <Button 
              onClick={() => navigate('/adhesion')} 
              size="sm" 
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-green-500/25 transition-all"
            >
              <Users className="h-4 w-4 mr-1" />
              Adhérer
            </Button>

            {/* Separator */}
            <div className="h-6 w-px bg-slate-600"></div>

            {isAuthenticated ? (
              <>
                <Notifications />
                <Button
                  onClick={() => navigate(userRole === 'admin' ? '/admin' : '/dashboard')}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 text-white border-slate-600 hover:text-white hover:border-green-500"
                >
                  <UserCircle className="h-4 w-4" />
                  <span>{userRole === 'admin' ? 'Admin' : 'Mon espace'}</span>
                </Button>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  Déconnexion
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/login')} variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                <LogIn className="h-4 w-4 mr-1" />
                Connexion
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900">
          <div className="px-4 py-3 space-y-3">
            <Link
              to="/"
              className="block py-2 text-sm font-medium text-gray-300 hover:text-green-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Accueil
            </Link>
            <Link
              to="/services"
              className="block py-2 text-sm font-medium text-gray-300 hover:text-green-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Services
            </Link>
            <Link
              to="/adhesion"
              className="block py-2 text-sm font-medium text-gray-300 hover:text-green-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Adhérer
            </Link>
            <Link
              to="/blog"
              className="block py-2 text-sm font-medium text-gray-300 hover:text-green-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              to="/livre-418-milliards"
              className="block py-2 text-sm font-medium text-gray-300 hover:text-green-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Le Livre
            </Link>
            <Link
              to="/partenaires"
              className="block py-2 text-sm font-medium text-gray-300 hover:text-green-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Partenaires
            </Link>
            <Link
              to="/contact"
              className="block py-2 text-sm font-medium text-gray-300 hover:text-green-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            {/* CTA Mobile - Toujours visibles */}
            <div className="pt-4 border-t border-slate-700 space-y-3">
              <a 
                href="https://www.helloasso.com/associations/en-toute-franchise/formulaires/1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <Button 
                  size="sm" 
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                >
                  <Heart className="h-4 w-4 mr-2 animate-pulse" />
                  Faire un don
                </Button>
              </a>
              <Button
                onClick={() => {
                  navigate('/adhesion');
                  setMobileMenuOpen(false);
                }}
                size="sm"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Adhérer à l'association
              </Button>
            </div>

            {/* Auth Mobile */}
            {isAuthenticated ? (
              <div className="pt-3 space-y-2">
                <Button
                  onClick={() => {
                    navigate(userRole === 'admin' ? '/admin' : '/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  {userRole === 'admin' ? 'Admin' : 'Mon espace'}
                </Button>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="w-full justify-start text-gray-400">
                  Déconnexion
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-gray-400"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Déjà membre ? Connexion
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
