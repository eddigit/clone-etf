import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Menu, X, LogIn, UserCircle } from 'lucide-react';
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
              to="/contact"
              className={`text-sm font-medium transition-colors ${
                isActive('/contact') ? 'text-green-400' : 'text-gray-300 hover:text-green-400'
              }`}
            >
              Contact
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Notifications />
                <Button
                  onClick={() => navigate(userRole === 'admin' ? '/admin' : '/dashboard')}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <UserCircle className="h-4 w-4" />
                  <span>{userRole === 'admin' ? 'Admin' : 'Espace Membre'}</span>
                </Button>
                <Button onClick={handleLogout} variant="ghost" size="sm">
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => navigate('/login')} variant="ghost" size="sm">
                  Connexion
                </Button>
                <Button onClick={() => navigate('/register')} size="sm" className="bg-green-600 hover:bg-green-700">
                  S'inscrire
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
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
              to="/contact"
              className="block py-2 text-sm font-medium text-gray-300 hover:text-green-400"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            {isAuthenticated ? (
              <>
                <Button
                  onClick={() => {
                    navigate(userRole === 'admin' ? '/admin' : '/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  {userRole === 'admin' ? 'Admin' : 'Espace Membre'}
                </Button>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="w-full justify-start">
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Connexion
                </Button>
                <Button
                  onClick={() => {
                    navigate('/register');
                    setMobileMenuOpen(false);
                  }}
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  S'inscrire
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
