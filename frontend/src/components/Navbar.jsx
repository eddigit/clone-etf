import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  Menu, 
  X, 
  LogIn, 
  UserCircle, 
  Heart, 
  Users, 
  Search, 
  Command,
  Home,
  Briefcase,
  BookOpen,
  BookMarked,
  Handshake,
  Mail,
  ArrowRight
} from 'lucide-react';
import Notifications from './Notifications';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/');
    setMenuOpen(false);
  };

  // Navigation items
  const navItems = [
    { path: '/', label: 'Accueil', icon: Home, description: 'Page d\'accueil' },
    { path: '/services', label: 'Services', icon: Briefcase, description: 'Nos services d\'accompagnement' },
    { path: '/adhesion', label: 'Adhérer', icon: Users, description: 'Rejoindre l\'association' },
    { path: '/blog', label: 'Blog', icon: BookOpen, description: 'Articles et actualités' },
    { path: '/livre-418-milliards', label: 'Le Livre', icon: BookMarked, description: '418 Milliards - L\'enquête' },
    { path: '/partenaires', label: 'Partenaires', icon: Handshake, description: 'Nos partenaires associatifs' },
    { path: '/contact', label: 'Contact', icon: Mail, description: 'Nous contacter' },
  ];

  // Filtered items for search
  const filteredItems = navItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    // Ctrl+K or Cmd+K to open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(true);
    }
    // Escape to close
    if (e.key === 'Escape') {
      setSearchOpen(false);
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen || searchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen, searchOpen]);

  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 flex-shrink-0">
              <img 
                src="https://aide.en-toutefranchise.com/lovable-uploads/19dabfce-86c9-4793-beb5-bcf6cb7b9e7b.png" 
                alt="En Toute Franchise" 
                className="h-10 w-auto"
              />
              <span className="text-lg font-bold text-white hidden lg:block">En Toute Franchise</span>
            </Link>

            {/* Center - Search Bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg text-gray-400 hover:text-gray-300 transition-all group max-w-xs lg:max-w-sm flex-1 mx-4"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm flex-1 text-left">Rechercher...</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-slate-700 rounded text-gray-400 group-hover:bg-slate-600">
                <Command className="h-3 w-3" />K
              </kbd>
            </button>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* CTA Buttons - Desktop */}
              <a 
                href="https://www.helloasso.com/associations/en-toute-franchise/formulaires/1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hidden sm:block"
              >
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-red-500/25 transition-all"
                >
                  <Heart className="h-4 w-4 mr-1 animate-pulse" />
                  <span className="hidden md:inline">Faire un don</span>
                </Button>
              </a>
              
              <Button 
                onClick={() => handleNavigate('/adhesion')} 
                size="sm" 
                className="hidden sm:flex bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-green-500/25 transition-all"
              >
                <Users className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">Adhérer</span>
              </Button>

              {/* Auth - Desktop */}
              {isAuthenticated && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="h-6 w-px bg-slate-700"></div>
                  <Notifications />
                  <Button
                    onClick={() => handleNavigate(userRole === 'admin' ? '/admin' : '/dashboard')}
                    variant="outline"
                    size="sm"
                    className="text-white border-slate-600 hover:border-green-500"
                  >
                    <UserCircle className="h-4 w-4 mr-1" />
                    <span className="hidden lg:inline">{userRole === 'admin' ? 'Admin' : 'Espace'}</span>
                  </Button>
                </div>
              )}

              {!isAuthenticated && (
                <Button 
                  onClick={() => handleNavigate('/login')} 
                  variant="ghost" 
                  size="sm" 
                  className="hidden sm:flex text-gray-300 hover:text-white"
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  <span className="hidden lg:inline">Connexion</span>
                </Button>
              )}

              {/* Mobile Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="sm:hidden p-2 text-gray-400 hover:text-white"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Menu Burger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Menu"
              >
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Modal (Command Palette) */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative min-h-screen flex items-start justify-center pt-20 px-4">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une page..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
                  autoFocus
                />
                <kbd className="px-2 py-1 text-xs bg-slate-800 rounded text-gray-400">ESC</kbd>
              </div>
              
              {/* Results */}
              <div className="max-h-80 overflow-y-auto py-2">
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-800 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-800 group-hover:bg-green-500/20 flex items-center justify-center transition-colors">
                        <Icon className="h-5 w-5 text-gray-400 group-hover:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{item.label}</div>
                        <div className="text-sm text-gray-400">{item.description}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-green-400 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  );
                })}
                {filteredItems.length === 0 && (
                  <div className="px-4 py-8 text-center text-gray-400">
                    Aucun résultat pour "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Menu (Full Screen Overlay) */}
      {menuOpen && (
        <div className="fixed inset-0 z-[90] bg-slate-900">
          {/* Close button in top right */}
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white z-10"
          >
            <X className="h-8 w-8" />
          </button>

          <div className="h-full overflow-y-auto pt-20 pb-8 px-6">
            <div className="max-w-2xl mx-auto">
              {/* Navigation Links */}
              <nav className="space-y-2 mb-12">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isCurrentPath = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all group ${
                        isCurrentPath 
                          ? 'bg-green-500/20 border border-green-500/30' 
                          : 'hover:bg-slate-800'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        isCurrentPath 
                          ? 'bg-green-500/30' 
                          : 'bg-slate-800 group-hover:bg-green-500/20'
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          isCurrentPath ? 'text-green-400' : 'text-gray-400 group-hover:text-green-400'
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className={`text-xl font-semibold ${
                          isCurrentPath ? 'text-green-400' : 'text-white'
                        }`}>
                          {item.label}
                        </div>
                        <div className="text-sm text-gray-400">{item.description}</div>
                      </div>
                      <ArrowRight className={`h-5 w-5 transition-all ${
                        isCurrentPath 
                          ? 'text-green-400' 
                          : 'text-gray-600 group-hover:text-green-400 group-hover:translate-x-1'
                      }`} />
                    </button>
                  );
                })}
              </nav>

              {/* CTAs */}
              <div className="space-y-4 mb-8">
                <a 
                  href="https://www.helloasso.com/associations/en-toute-franchise/formulaires/1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button 
                    size="lg"
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-lg h-14"
                  >
                    <Heart className="h-5 w-5 mr-2 animate-pulse" />
                    Faire un don
                  </Button>
                </a>
                <Button
                  onClick={() => handleNavigate('/adhesion')}
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-lg h-14"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Adhérer à l'association
                </Button>
              </div>

              {/* Auth Section */}
              <div className="border-t border-slate-800 pt-6">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleNavigate(userRole === 'admin' ? '/admin' : '/dashboard')}
                      variant="outline"
                      size="lg"
                      className="w-full h-12 text-white border-slate-700"
                    >
                      <UserCircle className="h-5 w-5 mr-2" />
                      {userRole === 'admin' ? 'Espace Administration' : 'Mon Espace Membre'}
                    </Button>
                    <Button 
                      onClick={handleLogout} 
                      variant="ghost" 
                      size="lg"
                      className="w-full h-12 text-gray-400 hover:text-white"
                    >
                      Déconnexion
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleNavigate('/login')}
                    variant="outline"
                    size="lg"
                    className="w-full h-12 text-white border-slate-700"
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    Connexion membre
                  </Button>
                )}
              </div>

              {/* Footer info */}
              <div className="mt-8 text-center text-sm text-gray-500">
                <p>Association En Toute Franchise</p>
                <p>Depuis 1994 • Apolitique et Indépendante</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
