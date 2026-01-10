import React from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
  const navigate = useNavigate();

  const stats = [
    { label: 'Statut adhésion', value: 'Active', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Documents', value: '12', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Ressources utilisées', value: '8', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Requêtes IA', value: '23', icon: Bot, color: 'text-orange-600', bg: 'bg-orange-100' }
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
                Statut de l'adhésion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type d'adhésion</span>
                <Badge className="bg-blue-600">Commerçant - Artisan</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Date d'échéance</span>
                <span className="font-semibold text-gray-900">31 décembre 2025</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Statut</span>
                <Badge className="bg-green-600">Active</Badge>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">Services inclus :</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Conseil & accompagnement
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Assistance administrative
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Assistant IA d'orientation
                  </li>
                  <li className="flex items-center text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    Accès aux ressources
                  </li>
                </ul>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Gérer mon abonnement
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
