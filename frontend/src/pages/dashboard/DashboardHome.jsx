import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Bot,
  FileText,
  BookOpen,
  Bell,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../../config/api';

const DashboardHome = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const getMembershipTypeLabel = (type) => {
    const labels = {
      individual: 'Particulier',
      professional: 'Commercant - Artisan',
      professional_plus: 'Entreprise',
      association: 'Association'
    };
    return labels[type] || type || 'Non defini';
  };

  const getMembershipStatusBadge = (status) => {
    if (status === 'active') {
      return <Badge className="bg-green-600">Active</Badge>;
    } else if (status === 'pending') {
      return <Badge className="bg-yellow-500">En attente</Badge>;
    } else {
      return <Badge className="bg-red-500">Expiree</Badge>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Non definie';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isAccessEnabled = profile?.membershipStatus === 'active';

  const stats = [
    {
      label: 'Statut adhesion',
      value: profile?.membershipStatus === 'active' ? 'Active' : (profile?.membershipStatus === 'pending' ? 'En attente' : 'Expiree'),
      icon: profile?.membershipStatus === 'active' ? CheckCircle2 : (profile?.membershipStatus === 'pending' ? AlertTriangle : XCircle),
      color: profile?.membershipStatus === 'active' ? 'text-green-600' : (profile?.membershipStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'),
      bg: profile?.membershipStatus === 'active' ? 'bg-green-100' : (profile?.membershipStatus === 'pending' ? 'bg-yellow-100' : 'bg-red-100')
    },
    { label: 'Documents', value: '-', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Ressources', value: '-', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Requetes IA', value: '-', icon: Bot, color: 'text-orange-600', bg: 'bg-orange-100' }
  ];

  const notifications = [
    {
      id: 1,
      type: 'info',
      title: 'Nouvelle ressource disponible',
      message: 'Guide complet sur le renouvellement de bail commercial',
      time: 'Il y a 2 heures'
    },
    {
      id: 2,
      type: 'warning',
      title: 'Rappel',
      message: 'Votre cotisation annuelle arrive à échéance dans 30 jours',
      time: 'Il y a 1 jour'
    },
    {
      id: 3,
      type: 'success',
      title: 'Document validé',
      message: 'Votre contrat de prestation a été vérifié par nos experts',
      time: 'Il y a 3 jours'
    }
  ];

  const quickActions = [
    {
      icon: Bot,
      title: 'Poser une question à l\'IA',
      description: 'Obtenez conseils et orientation instantanés',
      action: () => navigate('/dashboard/ai'),
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      icon: FileText,
      title: 'Uploader un document',
      description: 'Ajoutez un nouveau document à analyser',
      action: () => navigate('/dashboard/documents'),
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      icon: BookOpen,
      title: 'Explorer les ressources',
      description: 'Accédez à nos guides et modèles',
      action: () => navigate('/dashboard/resources'),
      color: 'bg-green-600 hover:bg-green-700'
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
          <p className="text-gray-600">Bienvenue dans votre espace membre</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={action.action}>
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications
              </CardTitle>
              <CardDescription>Vos dernières alertes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                      <p className="text-sm text-gray-600">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {notif.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Membership Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Statut de l'adhesion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type d'adhesion</span>
                <Badge className="bg-blue-600">{getMembershipTypeLabel(profile?.membershipType)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Date d'echeance</span>
                <span className="font-semibold text-gray-900">{formatDate(profile?.membershipEndDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Statut</span>
                {getMembershipStatusBadge(profile?.membershipStatus)}
              </div>

              {/* Alerte si adhesion non active */}
              {profile?.membershipStatus !== 'active' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    {profile?.membershipStatus === 'pending'
                      ? "Votre adhesion est en attente de paiement. Les outils seront accessibles apres confirmation."
                      : "Votre adhesion a expire. Renouvelez-la pour acceder aux outils."}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">Services inclus :</p>
                <ul className="space-y-2 text-sm">
                  <li className={`flex items-center ${isAccessEnabled ? 'text-gray-700' : 'text-gray-400'}`}>
                    <CheckCircle2 className={`h-4 w-4 mr-2 ${isAccessEnabled ? 'text-green-500' : 'text-gray-300'}`} />
                    Communaute et entraide
                  </li>
                  <li className={`flex items-center ${isAccessEnabled ? 'text-gray-700' : 'text-gray-400'}`}>
                    <CheckCircle2 className={`h-4 w-4 mr-2 ${isAccessEnabled ? 'text-green-500' : 'text-gray-300'}`} />
                    Dossiers ETF collectifs
                  </li>
                  <li className={`flex items-center ${isAccessEnabled ? 'text-gray-700' : 'text-gray-400'}`}>
                    <CheckCircle2 className={`h-4 w-4 mr-2 ${isAccessEnabled ? 'text-green-500' : 'text-gray-300'}`} />
                    Assistant IA d'orientation
                  </li>
                  <li className={`flex items-center ${isAccessEnabled ? 'text-gray-700' : 'text-gray-400'}`}>
                    <CheckCircle2 className={`h-4 w-4 mr-2 ${isAccessEnabled ? 'text-green-500' : 'text-gray-300'}`} />
                    Messagerie entre membres
                  </li>
                  <li className={`flex items-center ${isAccessEnabled ? 'text-gray-700' : 'text-gray-400'}`}>
                    <CheckCircle2 className={`h-4 w-4 mr-2 ${isAccessEnabled ? 'text-green-500' : 'text-gray-300'}`} />
                    Acces aux ressources et guides
                  </li>
                </ul>
              </div>
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={() => navigate('/dashboard/adhesions')}
              >
                {profile?.membershipStatus === 'active' ? 'Voir mes adhesions' : 'Renouveler mon adhesion'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
