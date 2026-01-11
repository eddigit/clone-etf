import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Play, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Trash2,
  FileText,
  ChevronDown,
  ChevronRight,
  User,
  Zap,
  Shield
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const API_URL = process.env.REACT_APP_API_URL || 'https://etf-backend-t3j5.onrender.com';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

const AdminTestAgent = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [runningTest, setRunningTest] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [cleanupMode, setCleanupMode] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/test-agent/reports`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  const runTests = async () => {
    setRunningTest(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/test-agent/run?cleanup=${cleanupMode}`, {
        method: 'POST',
        headers: getHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setSelectedReport(data.report);
        await fetchReports();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.detail || 'Échec des tests'}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution des tests:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setRunningTest(false);
    }
  };

  const cleanupTestData = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer toutes les données de test ?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/admin/test-agent/cleanup`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Nettoyage terminé: ${data.deleted_users} utilisateurs et ${data.deleted_messages} messages supprimés`);
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
    }
  };

  const toggleStep = (stepName) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepName]: !prev[stepName]
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      passed: 'bg-green-100 text-green-800 border-green-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
      skipped: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      running: 'bg-blue-100 text-blue-800 border-blue-300',
      pending: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    
    const labels = {
      passed: 'Réussi',
      failed: 'Échoué',
      skipped: 'Ignoré',
      running: 'En cours',
      pending: 'En attente'
    };
    
    return (
      <Badge className={`${variants[status] || variants.pending} border`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-7 w-7 text-blue-600" />
              Agent de Test Utilisateur
            </h1>
            <p className="text-gray-600 mt-1">
              Simulez un parcours utilisateur complet pour tester l'application
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={cleanupTestData}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Nettoyer les données test
            </Button>
            
            <Button
              onClick={runTests}
              disabled={runningTest}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {runningTest ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Tests en cours...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Lancer les tests
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Options de test */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Options de test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="cleanup"
                checked={cleanupMode}
                onChange={(e) => setCleanupMode(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="cleanup" className="text-sm text-gray-700">
                Nettoyer automatiquement l'utilisateur test après les tests
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des rapports */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Historique des tests
              </CardTitle>
              <CardDescription>
                {reports.length} rapport(s) disponible(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 text-center">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                </div>
              ) : reports.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucun test effectué
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedReport?.id === report.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        {getStatusBadge(report.status)}
                        <span className="text-xs text-gray-500">
                          {formatDuration(report.total_duration_ms)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(report.started_at)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {report.passed_tests}/{report.total_tests} tests réussis
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Détails du rapport sélectionné */}
          <Card className="lg:col-span-2 bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedReport ? 'Détails du rapport' : 'Sélectionnez un rapport'}
              </CardTitle>
              {selectedReport && (
                <CardDescription>
                  ID: {selectedReport.id?.substring(0, 8)}...
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!selectedReport ? (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Lancez un test ou sélectionnez un rapport dans l'historique</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Résumé */}
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(selectedReport.status)}
                      <span className="font-semibold text-lg">
                        {selectedReport.summary}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Total</span>
                        <p className="font-semibold">{selectedReport.total_tests} tests</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Réussis</span>
                        <p className="font-semibold text-green-600">{selectedReport.passed_tests}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Échoués</span>
                        <p className="font-semibold text-red-600">{selectedReport.failed_tests}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Durée totale</span>
                        <p className="font-semibold">{formatDuration(selectedReport.total_duration_ms)}</p>
                      </div>
                    </div>
                    
                    {selectedReport.test_user_email && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">Utilisateur test:</span>
                        <code className="bg-gray-200 px-2 py-0.5 rounded text-xs">
                          {selectedReport.test_user_email}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Étapes détaillées */}
                  <div>
                    <h3 className="font-semibold mb-3">Étapes du test</h3>
                    <div className="space-y-2">
                      {selectedReport.steps?.map((step, index) => (
                        <div
                          key={step.name}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <div
                            onClick={() => toggleStep(step.name)}
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                          >
                            {expandedSteps[step.name] ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                            {getStatusIcon(step.status)}
                            <span className="flex-1 font-medium text-sm">
                              {index + 1}. {step.description}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDuration(step.duration_ms)}
                            </span>
                          </div>
                          
                          {expandedSteps[step.name] && (
                            <div className="px-4 pb-3 pt-1 bg-gray-50 border-t border-gray-200">
                              {step.error && (
                                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                  <strong>Erreur:</strong> {step.error}
                                </div>
                              )}
                              {step.details && Object.keys(step.details).length > 0 && (
                                <div className="text-sm">
                                  <strong className="text-gray-600">Détails:</strong>
                                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(step.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                              <div className="mt-2 text-xs text-gray-500">
                                Démarré: {formatDate(step.started_at)} | 
                                Terminé: {formatDate(step.completed_at)}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTestAgent;
