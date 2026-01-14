import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Users,
  Eye,
  TrendingUp,
  Globe,
  Search,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Activity,
  Clock,
  ExternalLink,
  ArrowUpRight,
  BarChart3,
  PieChart
} from 'lucide-react';
import { API_URL } from '../../config/api';

const AdminAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [realtimeStats, setRealtimeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/analytics/stats?days=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  const fetchRealtimeStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/analytics/realtime`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRealtimeStats(data);
      }
    } catch (error) {
      console.error('Error fetching realtime stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchRealtimeStats();
    
    // Rafraîchir les stats en temps réel toutes les 30 secondes
    const interval = setInterval(fetchRealtimeStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchRealtimeStats]);

  const getDeviceIcon = (device) => {
    switch (device) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'traffic', label: 'Sources de trafic', icon: Globe },
    { id: 'pages', label: 'Pages populaires', icon: Eye },
    { id: 'realtime', label: 'Temps réel', icon: Activity }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/admin" className="hover:text-blue-600">Admin</Link>
            <span>/</span>
            <span>Statistiques</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Statistiques</h1>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">90 derniers jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { fetchStats(); fetchRealtimeStats(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Visiteurs uniques</p>
                <p className="text-3xl font-bold">{formatNumber(stats?.total_visitors || 0)}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {stats?.unique_visitors_today || 0} aujourd'hui
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pages vues</p>
                <p className="text-3xl font-bold">{formatNumber(stats?.total_page_views || 0)}</p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {stats?.page_views_today || 0} aujourd'hui
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En ligne maintenant</p>
                <p className="text-3xl font-bold text-green-600">
                  {realtimeStats?.visitors_online || 0}
                </p>
                <Badge className="bg-green-100 text-green-800 mt-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  En direct
                </Badge>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recherches Google</p>
                <p className="text-3xl font-bold">
                  {stats?.top_search_queries?.length || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">mots-clés détectés</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Search className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Graphique visiteurs par jour */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Visiteurs par jour
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-1">
                {stats?.visitors_by_day?.slice(-30).map((day, index) => {
                  const maxViews = Math.max(...(stats.visitors_by_day?.map(d => d.page_views) || [1]));
                  const height = (day.page_views / maxViews) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full">
                        <div
                          className="bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                          style={{ height: `${Math.max(height, 2)}%`, minHeight: '4px' }}
                          title={`${day.date}: ${day.page_views} pages vues, ${day.unique_visitors} visiteurs`}
                        />
                      </div>
                      {index % 5 === 0 && (
                        <span className="text-xs text-gray-400 mt-1 -rotate-45">
                          {day.date?.split('-').slice(1).join('/')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Devices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Appareils
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.visitors_by_device?.map((device, index) => {
                  const total = stats.visitors_by_device.reduce((sum, d) => sum + d.count, 0);
                  const percentage = total > 0 ? Math.round((device.count / total) * 100) : 0;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded">
                        {getDeviceIcon(device.device)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{device.device || 'Inconnu'}</span>
                          <span className="text-sm text-gray-500">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Browsers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Navigateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.visitors_by_browser?.slice(0, 5).map((browser, index) => {
                  const total = stats.visitors_by_browser.reduce((sum, b) => sum + b.count, 0);
                  const percentage = total > 0 ? Math.round((browser.count / total) * 100) : 0;
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors[index]}`} />
                        <span className="text-sm">{browser.browser || 'Inconnu'}</span>
                      </div>
                      <span className="text-sm text-gray-500">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'traffic' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Referrers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Sources de trafic
              </CardTitle>
              <CardDescription>D'où viennent vos visiteurs</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.top_referrers?.length > 0 ? (
                <div className="space-y-3">
                  {stats.top_referrers.map((referrer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                          <Globe className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="font-medium truncate max-w-48">
                          {referrer.domain || 'Direct'}
                        </span>
                      </div>
                      <Badge variant="secondary">{referrer.visits} visites</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Pas encore de données de referrer
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recherches Google */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Recherches Google
              </CardTitle>
              <CardDescription>Mots-clés qui amènent les visiteurs</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.top_search_queries?.length > 0 ? (
                <div className="space-y-3">
                  {stats.top_search_queries.map((query, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-200 rounded flex items-center justify-center">
                          <Search className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="font-medium">"{query.query}"</span>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">
                        {query.count} fois
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    Pas encore de recherches Google détectées
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Les mots-clés apparaîtront ici quand les visiteurs
                    arriveront depuis Google.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'pages' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Pages les plus visitées
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.top_pages?.length > 0 ? (
              <div className="space-y-2">
                {stats.top_pages.map((page, index) => {
                  const maxViews = stats.top_pages[0]?.views || 1;
                  const percentage = Math.round((page.views / maxViews) * 100);
                  return (
                    <div key={index} className="relative">
                      <div
                        className="absolute inset-0 bg-blue-100 rounded"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="relative flex items-center justify-between p-3">
                        <span className="font-medium truncate max-w-lg">
                          {page.page || '/'}
                        </span>
                        <Badge>{page.views} vues</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Pas encore de données de pages
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'realtime' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Visiteurs en ligne */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Visiteurs en ligne
                <Badge className="bg-green-100 text-green-800 ml-2">
                  {realtimeStats?.visitors_online || 0} actifs
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {realtimeStats?.online_visitors?.length > 0 ? (
                <div className="space-y-3">
                  {realtimeStats.online_visitors.map((visitor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <div>
                          <p className="font-medium">
                            {visitor.current_page || 'Page inconnue'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {visitor.device_type} • {visitor.browser}
                          </p>
                        </div>
                      </div>
                      <Link to="/admin/chat">
                        <Button size="sm" variant="outline">
                          Contacter
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Aucun visiteur en ligne</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activité (30 min)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {realtimeStats?.activity_by_minute?.slice(-10).reverse().map((activity, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{activity.time}</span>
                    <div className="flex-1 mx-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (activity.views / 10) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                    <span className="font-medium">{activity.views}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
