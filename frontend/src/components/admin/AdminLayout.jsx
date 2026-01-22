import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import {
  LayoutDashboard,
  Users,
  Gift,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  FileText,
  Newspaper,
  Zap,
  BarChart3,
  MessageCircle,
  UsersRound,
  Bot,
  ScrollText,
  TestTube2
} from 'lucide-react';

const AdminLayout = ({ children }) => {
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
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: BarChart3, label: 'Statistiques', path: '/admin/analytics' },
    { icon: Bot, label: 'Intelligence Artificielle', path: '/admin/ai' },
    { icon: MessageCircle, label: 'Chat en direct', path: '/admin/chat' },
    { icon: UsersRound, label: 'Cohésion', path: '/admin/cohesion' },
    { icon: Users, label: 'Adherents', path: '/admin/members' },
    { icon: FileText, label: 'Adhesions', path: '/admin/adhesions' },
    { icon: ScrollText, label: 'Logs Adhésions', path: '/admin/adhesion-logs' },
    { icon: Newspaper, label: 'Blog', path: '/admin/blog' },
    { icon: Gift, label: 'Coupons', path: '/admin/coupons' },
    { icon: CreditCard, label: 'HelloAsso', path: '/admin/helloasso' },
    { icon: Zap, label: 'Agent de Test', path: '/admin/test-agent' },
    { icon: TestTube2, label: 'Test Adhésion', path: '/admin/test-adhesion' },
    { icon: Settings, label: 'Parametres', path: '/admin/settings' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-gray-900 text-white">
        <div className="p-6 border-b border-gray-800">
          <Link to="/admin" className="flex items-center space-x-3">
            <img 
              src="https://aide.en-toutefranchise.com/lovable-uploads/19dabfce-86c9-4793-beb5-bcf6cb7b9e7b.png" 
              alt="ETF Logo" 
              className="h-10 w-auto"
            />
            <div>
              <span className="text-lg font-bold">Admin</span>
              <span className="text-xs text-gray-400 block">En Toute Franchise Association</span>
            </div>
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
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link to="/dashboard">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <ChevronLeft className="h-5 w-5 mr-3" />
              Espace membre
            </Button>
          </Link>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
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
          <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 shadow-xl z-50">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <span className="text-lg font-bold text-white">Admin ETF</span>
              <button onClick={() => setSidebarOpen(false)} className="text-white">
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
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-800">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-400 hover:text-red-300"
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
        <header className="md:hidden bg-gray-900 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold text-white">Administration</span>
          <div className="w-6" />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
