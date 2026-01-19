import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { 
  RefreshCw, AlertCircle, CheckCircle2, Info, AlertTriangle,
  Search, Filter, Download, Mail, Clock, User, ChevronDown, ChevronUp
} from 'lucide-react';
import API from '../../config/api';

const API_URL = API.defaults.baseURL;

// Mapping des étapes pour affichage
const STEP_LABELS = {
  form_started: "Formulaire démarré",
  form_type_selected: "Type sélectionné",
  form_submitted: "Formulaire soumis",
  form_validation_error: "Erreur validation",
  membership_created: "Adhésion créée",
  membership_create_error: "Erreur création",
  pdf_generated: "PDF généré",
  pdf_error: "Erreur PDF",
  helloasso_redirect: "Redirection HelloAsso",
  helloasso_webhook: "Webhook HelloAsso",
  helloasso_payment_success: "Paiement confirmé",
  helloasso_payment_error: "Erreur paiement",
  user_created: "Compte créé",
  user_create_error: "Erreur compte",
  user_updated: "Compte mis à jour",
  user_already_exists: "Compte existant",
  email_welcome_sent: "Email bienvenue envoyé",
  email_welcome_error: "Erreur email",
  email_admin_notified: "Admin notifié",
  sync_started: "Synchro démarrée",
  sync_completed: "Synchro terminée",
  sync_error: "Erreur synchro"
};

// Badge de statut
const StatusBadge = ({ status }) => {
  const styles = {
    success: "bg-green-100 text-green-800 border-green-200",
    error: "bg-red-100 text-red-800 border-red-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    info: "bg-blue-100 text-blue-800 border-blue-200"
  };
  
  const icons = {
    success: <CheckCircle2 className="h-3 w-3" />,
    error: <AlertCircle className="h-3 w-3" />,
    warning: <AlertTriangle className="h-3 w-3" />,
    info: <Info className="h-3 w-3" />
  };
  
  return (
    <Badge className={`${styles[status] || styles.info} flex items-center gap-1`}>
      {icons[status]}
      {status?.toUpperCase()}
    </Badge>
  );
};

// Composant pour un log individuel
const LogEntry = ({ log, expanded, onToggle }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`border rounded-lg mb-2 ${
      log.status === 'error' ? 'border-red-200 bg-red-50' :
      log.status === 'warning' ? 'border-amber-200 bg-amber-50' :
      log.status === 'success' ? 'border-green-200 bg-green-50' :
      'border-gray-200 bg-white'
    }`}>
      <div 
        className="p-3 cursor-pointer flex items-center justify-between"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 flex-1">
          <StatusBadge status={log.status} />
          <span className="font-mono text-xs text-gray-500">
            {formatDate(log.timestamp)}
          </span>
          <Badge variant="outline" className="text-xs">
            {STEP_LABELS[log.step] || log.step}
          </Badge>
          {log.email && (
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <User className="h-3 w-3" />
              {log.email}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 max-w-md truncate">
            {log.message}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>
      
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-200 mt-2 pt-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Message:</span>
              <p className="font-medium">{log.message}</p>
            </div>
            {log.error && (
              <div className="col-span-2">
                <span className="text-gray-500">Erreur:</span>
                <p className="font-medium text-red-600 font-mono text-xs bg-red-100 p-2 rounded mt-1">
                  {log.error}
                </p>
              </div>
            )}
            {log.user_id && (
              <div>
                <span className="text-gray-500">User ID:</span>
                <p className="font-mono text-xs">{log.user_id}</p>
              </div>
            )}
            {log.membership_id && (
              <div>
                <span className="text-gray-500">Membership ID:</span>
                <p className="font-mono text-xs">{log.membership_id}</p>
              </div>
            )}
            {log.source && (
              <div>
                <span className="text-gray-500">Source:</span>
                <p>{log.source}</p>
              </div>
            )}
            {log.details && Object.keys(log.details).length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-500">Détails:</span>
                <pre className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminAdhesionLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLog, setExpandedLog] = useState(null);
  
  // Filtres
  const [emailFilter, setEmailFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stepFilter, setStepFilter] = useState('');
  
  // Stats
  const [stats, setStats] = useState(null);
  
  const token = localStorage.getItem('token');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (emailFilter) params.append('email', emailFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (stepFilter) params.append('step', stepFilter);
      params.append('limit', '100');
      
      const response = await fetch(
        `${API_URL}/admin/adhesion-logs?${params.toString()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      } else {
        setError('Erreur lors du chargement des logs');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [token, emailFilter, statusFilter, stepFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/admin/adhesion-logs/stats?days=30`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [token]);

  const testNotification = async () => {
    try {
      const response = await fetch(
        `${API_URL}/admin/adhesion-logs/test-notification`,
        { 
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` } 
        }
      );
      
      const data = await response.json();
      if (data.status === 'success') {
        alert('✅ Notifications de test envoyées avec succès !');
      } else {
        alert(`⚠️ Résultat: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      alert('❌ Erreur lors du test: ' + err.message);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Logs des Adhésions</h1>
          <p className="text-gray-500">Suivi détaillé du parcours d'adhésion</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={testNotification}>
            <Mail className="h-4 w-4 mr-2" />
            Tester notifications
          </Button>
          <Button onClick={() => { fetchLogs(); fetchStats(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total_logs || 0}</div>
              <p className="text-gray-500 text-sm">Événements (30j)</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                {stats.by_status?.success || 0}
              </div>
              <p className="text-gray-500 text-sm">Succès</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">
                {stats.by_status?.error || 0}
              </div>
              <p className="text-gray-500 text-sm">Erreurs</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-600">
                {stats.by_status?.warning || 0}
              </div>
              <p className="text-gray-500 text-sm">Avertissements</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-500 mb-1 block">Email</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par email..."
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-48">
              <label className="text-sm text-gray-500 mb-1 block">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="error">🔴 Erreurs</SelectItem>
                  <SelectItem value="warning">🟡 Avertissements</SelectItem>
                  <SelectItem value="success">🟢 Succès</SelectItem>
                  <SelectItem value="info">🔵 Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-56">
              <label className="text-sm text-gray-500 mb-1 block">Étape</label>
              <Select value={stepFilter} onValueChange={setStepFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les étapes</SelectItem>
                  <SelectItem value="form_submitted">Formulaire soumis</SelectItem>
                  <SelectItem value="membership_created">Adhésion créée</SelectItem>
                  <SelectItem value="helloasso_webhook">Webhook HelloAsso</SelectItem>
                  <SelectItem value="helloasso_payment_success">Paiement confirmé</SelectItem>
                  <SelectItem value="user_created">Compte créé</SelectItem>
                  <SelectItem value="membership_create_error">Erreur création</SelectItem>
                  <SelectItem value="helloasso_payment_error">Erreur paiement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchLogs}>
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historique des événements
            <Badge variant="outline">{logs.length} résultats</Badge>
          </CardTitle>
          <CardDescription>
            Cliquez sur une ligne pour voir les détails
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              Chargement...
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p>Aucun log trouvé</p>
              <p className="text-sm">Les logs apparaîtront lorsque des adhésions seront effectuées</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <LogEntry 
                  key={log.id || index}
                  log={log}
                  expanded={expandedLog === (log.id || index)}
                  onToggle={() => setExpandedLog(
                    expandedLog === (log.id || index) ? null : (log.id || index)
                  )}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dernières erreurs */}
      {stats?.errors?.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Dernières erreurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.errors.slice(0, 5).map((err, idx) => (
                <div key={idx} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-red-100 text-red-800 mb-1">
                        {STEP_LABELS[err.step] || err.step}
                      </Badge>
                      <p className="text-sm font-medium">{err.message}</p>
                      {err.email && (
                        <p className="text-xs text-gray-500">{err.email}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(err.timestamp).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  {err.error && (
                    <p className="text-xs text-red-600 mt-2 font-mono bg-red-100 p-2 rounded">
                      {err.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
