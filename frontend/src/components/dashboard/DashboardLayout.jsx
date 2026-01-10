import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import {
  LayoutDashboard,
  Bot,
  FileText,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Users,
  MessageSquare,
  Briefcase,
  UserCircle,
  Newspaper
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    navigate('/');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
    { icon: Bot, label: 'Assistant IA', path: '/dashboard/ai' },
    { icon: Users, label: 'Mes Adhésions', path: '/dashboard/adhesions' },
    { icon: UserCircle, label: 'Annuaire Membres', path: '/dashboard/members' },
    { icon: MessageSquare, label: 'Communauté', path: '/dashboard/community' },
    { icon: MessageSquare, label: 'Messagerie', path: '/dashboard/messages' },
    { icon: Briefcase, label: 'Dossiers', path: '/dashboard/cases' },
    { icon: Newspaper, label: 'Articles Exclusifs', path: '/dashboard/articles' },
    { icon: FileText, label: 'Mes Documents', path: '/dashboard/documents' },
    { icon: BookOpen, label: 'Ressources', path: '/dashboard/resources' },
    { icon: CreditCard, label: 'Abonnement', path: '/dashboard/subscription' },
    { icon: Settings, label: 'Paramètres', path: '/dashboard/settings' }
  ];

  // Vérifier si l'utilisateur est admin
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'admin';

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="https://aide.en-toutefranchise.com/lovable-uploads/19dabfce-86c9-4793-beb5-bcf6cb7b9e7b.png" 
              alt="En Toute Franchise Logo" 
              className="h-12 w-auto"
            />
            <span className="text-lg font-bold text-gray-900">Espace Membre</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Lien Administration pour les admins */}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mt-4 border-t border-gray-200 pt-4 ${
                location.pathname.startsWith('/admin')
                  ? 'bg-purple-50 text-purple-600'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <Shield className="h-5 w-5" />
              <span className="font-medium">Administration</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <Link to="/" className="flex items-center space-x-3">
                <img 
                  src="https://aide.en-toutefranchise.com/lovable-uploads/19dabfce-86c9-4793-beb5-bcf6cb7b9e7b.png" 
                  alt="En Toute Franchise Logo" 
                  className="h-12 w-auto"
                />
                <span className="text-lg font-bold text-gray-900">En Toute Franchise</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Lien Administration pour les admins - Mobile */}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors mt-4 border-t border-gray-200 pt-4 ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-purple-50 text-purple-600'
                      : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Administration</span>
                </Link>
              )}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Déconnexion
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold text-gray-900">Espace Membre</span>
          <div className="w-6" />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
