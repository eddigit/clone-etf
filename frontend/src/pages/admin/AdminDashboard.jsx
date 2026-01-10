import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Users, 
  CreditCard, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Gift,
  Settings,
  ExternalLink
} from 'lucide-react';
import { API_URL } from '../../config/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [helloassoStatus, setHelloassoStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch stats
      const statsRes = await fetch(`${API_URL}/admin/stats`, { headers });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // Fetch HelloAsso status
      const haRes = await fetch(`${API_URL}/admin/helloasso/status`, { headers });
      if (haRes.ok) {
        setHelloassoStatus(await haRes.json());
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/helloasso/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Synchronisation terminée!\n\nCréés: ${result.created}\nMis à jour: ${result.updated}\nIgnorés: ${result.skipped}`);
        fetchData(); // Refresh stats
      } else {
        alert('Erreur lors de la synchronisation');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600 mt-1">Gestion des adhérents et synchronisation HelloAsso</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Adhérents</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalMembers || 0}</div>
            <p className="text-sm text-gray-500 mt-1">
              {stats?.newMembersThisMonth || 0} ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Adhérents Actifs</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.activeMembers || 0}</div>
            <p className="text-sm text-gray-500 mt-1">
              {stats?.expiredMembers || 0} expirés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Coupons Générés</CardTitle>
            <Gift className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalCoupons || 0}</div>
            <p className="text-sm text-gray-500 mt-1">
              {stats?.usedCoupons || 0} utilisés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Revenus</CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.revenue?.toFixed(2) || '0.00'} €</div>
            <p className="text-sm text-gray-500 mt-1">Via HelloAsso</p>
          </CardContent>
        </Card>
      </div>

      {/* HelloAsso Connection */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <img 
                  src="https://cdn.helloasso.com/img/logos/ha-logo.svg" 
                  alt="HelloAsso" 
                  className="h-6"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                Connexion HelloAsso
              </CardTitle>
              <CardDescription>Synchronisez les adhérents depuis HelloAsso</CardDescription>
            </div>
            {helloassoStatus?.connected ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-4 w-4 mr-1" />
                Connecté
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-4 w-4 mr-1" />
                Non connecté
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {helloassoStatus?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{helloassoStatus.organization?.name}</p>
                  <p className="text-sm text-gray-500">Organisation: {helloassoStatus.organization?.slug}</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={handleSync} disabled={syncing}>
                  {syncing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Synchronisation...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Synchroniser maintenant
                    </>
                  )}
                </Button>
                <Link to="/admin/helloasso">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres HelloAsso
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                <strong>Configuration requise:</strong> Veuillez configurer les identifiants HelloAsso dans les variables d'environnement.
              </p>
              {helloassoStatus?.error && (
                <p className="text-sm text-yellow-700 mt-2">Erreur: {helloassoStatus.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/members">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Gérer les Adhérents
              </CardTitle>
              <CardDescription>Liste, recherche, modification des adhérents</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Accéder
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/coupons">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-600" />
                Gérer les Coupons
              </CardTitle>
              <CardDescription>Création et suivi des codes de réduction</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Accéder
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/payments">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Historique Paiements
              </CardTitle>
              <CardDescription>Paiements HelloAsso synchronisés</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Accéder
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
