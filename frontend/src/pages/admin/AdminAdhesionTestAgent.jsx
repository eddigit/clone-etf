import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
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
  Shield,
  AlertTriangle,
  Info,
  Users,
  CreditCard,
  Building,
  Heart
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const API_URL = process.env.REACT_APP_API_URL || 'https://etf-backend-t3j5.onrender.com';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

const MEMBERSHIP_TYPES = {
  individual: { label: 'Particuliers', icon: User, color: 'blue' },
  professional: { label: 'Commerçants/Artisans', icon: CreditCard, color: 'green' },
  professional_plus: { label: 'Commerces +100m²', icon: Building, color: 'purple' },
  association: { label: 'Associations', icon: Heart, color: 'orange' }
};

const AdminAdhesionTestAgent = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [runningTest, setRunningTest] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState({});
  const [cleanupMode, setCleanupMode] = useState(true);
  const [selectedMembershipType, setSelectedMembershipType] = useState('individual');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/test-adhesion/reports`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  const runSingleTest = async () => {
    setRunningTest(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/test-adhesion/run?membership_type=${selectedMembershipType}&cleanup=${cleanupMode}`, 
        {
          method: 'POST',
          headers: getHeaders()
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setSelectedReport(data.report);
        await fetchReports();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.detail || 'Échec du test'}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution du test:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setRunningTest(false);
    }
  };

  const runAllTests = async () => {
    setRunningTest(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/test-adhesion/run-all-types?cleanup=${cleanupMode}`, 
        {
          method: 'POST',
          headers: getHeaders()
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        await fetchReports();
        if (data.results && data.results.length > 0) {
          // Afficher le premier rapport
          const firstReport = await fetchSingleReport(data.results[0].report_id);
          if (firstReport) setSelectedReport(firstReport);
        }
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

  const fetchSingleReport = async (reportId) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/test-adhesion/reports/${reportId}`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        return data.report;
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
    return null;
  };

  const cleanupTestData = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer toutes les données de test d\'adhésion ?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/admin/test-adhesion/cleanup`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Nettoyage terminé:\n- ${data.deleted_users} utilisateurs supprimés\n- ${data.deleted_memberships} adhésions supprimées\n- ${data.deleted_messages} messages supprimés`);
        await fetchReports();
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
    }
  };

  const togglePhase = (phaseName) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseName]: !prev[phaseName]
    }));
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      error: 'bg-orange-100 text-orange-800 border-orange-300',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      info: 'bg-blue-100 text-blue-800 border-blue-300',
      success: 'bg-green-100 text-green-800 border-green-300'
    };
    
    return (
      <Badge className={`${variants[severity] || 'bg-gray-100 text-gray-800'} border text-xs`}>
        {severity}
      </Badge>
    );
  };

  const getPhaseIcon = (success) => {
    return success ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  const formatDuration = (ms) => {
    if (!ms) return '0ms';
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

  const getMembershipTypeIcon = (type) => {
    const config = MEMBERSHIP_TYPES[type];
    if (!config) return <User className="h-4 w-4" />;
    const Icon = config.icon;
    return <Icon className={`h-4 w-4 text-${config.color}-500`} />;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-7 w-7 text-purple-600" />
              Agent de Test du Parcours Adhésion
            </h1>
            <p className="text-gray-600 mt-1">
              Simulez le parcours complet d'un utilisateur souhaitant adhérer
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={cleanupTestData}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Nettoyer
            </Button>
            
            <Button
              variant="outline"
              onClick={fetchReports}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Statistiques globales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white border border-gray-200">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-900">{stats.total_tests}</div>
                <p className="text-sm text-gray-500">Tests effectués</p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.successful_tests}</div>
                <p className="text-sm text-gray-500">Tests réussis</p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{stats.total_tests - stats.successful_tests}</div>
                <p className="text-sm text-gray-500">Tests échoués</p>
              </CardContent>
            </Card>
            <Card className="bg-white border border-gray-200">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{stats.success_rate.toFixed(1)}%</div>
                <p className="text-sm text-gray-500">Taux de réussite</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Options et lancement */}
        <Card className="bg-white border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Lancer un test</CardTitle>
            <CardDescription>
              Choisissez le type d'adhésion à tester
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Select value={selectedMembershipType} onValueChange={setSelectedMembershipType}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Type d'adhésion" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MEMBERSHIP_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {getMembershipTypeIcon(key)}
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cleanup"
                  checked={cleanupMode}
                  onChange={(e) => setCleanupMode(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600"
                />
                <label htmlFor="cleanup" className="text-sm text-gray-700">
                  Nettoyer après le test
                </label>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={runSingleTest}
                  disabled={runningTest}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {runningTest ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      En cours...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Tester ce type
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={runAllTests}
                  disabled={runningTest}
                  variant="outline"
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Tester tous les types
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des rapports */}
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Historique
              </CardTitle>
              <CardDescription>
                {reports.length} rapport(s)
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
                <div className="max-h-[600px] overflow-y-auto">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedReport?.id === report.id ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {report.overall_success ? 
                            <CheckCircle className="h-4 w-4 text-green-500" /> : 
                            <XCircle className="h-4 w-4 text-red-500" />
                          }
                          <span className="text-sm font-medium">
                            {MEMBERSHIP_TYPES[report.test_membership_type]?.label || report.test_membership_type}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDuration(report.total_duration_ms)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(report.started_at)}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {report.critical_issues > 0 && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            {report.critical_issues} critique(s)
                          </Badge>
                        )}
                        {report.errors > 0 && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs">
                            {report.errors} erreur(s)
                          </Badge>
                        )}
                        {report.warnings > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            {report.warnings} avertissement(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Détails du rapport */}
          <Card className="lg:col-span-2 bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedReport ? 'Détails du rapport' : 'Sélectionnez un rapport'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedReport ? (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Lancez un test ou sélectionnez un rapport</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Résumé */}
                  <div className={`p-4 rounded-lg border ${
                    selectedReport.overall_success ? 
                      'bg-green-50 border-green-200' : 
                      'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      {selectedReport.overall_success ? 
                        <CheckCircle className="h-6 w-6 text-green-600" /> :
                        <XCircle className="h-6 w-6 text-red-600" />
                      }
                      <span className="font-semibold">
                        {selectedReport.summary}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Type</span>
                        <p className="font-semibold flex items-center gap-1">
                          {getMembershipTypeIcon(selectedReport.test_membership_type)}
                          {MEMBERSHIP_TYPES[selectedReport.test_membership_type]?.label}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Phases</span>
                        <p className="font-semibold">
                          {selectedReport.passed_phases}/{selectedReport.total_phases}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Durée</span>
                        <p className="font-semibold">
                          {formatDuration(selectedReport.total_duration_ms)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Environnement</span>
                        <p className="font-semibold">{selectedReport.environment}</p>
                      </div>
                    </div>
                    
                    {selectedReport.test_user_email && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-400" />
                        <code className="bg-white/50 px-2 py-0.5 rounded text-xs">
                          {selectedReport.test_user_email}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Problèmes détectés */}
                  {selectedReport.all_issues && selectedReport.all_issues.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Problèmes détectés ({selectedReport.all_issues.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedReport.all_issues.map((issue, index) => (
                          <div 
                            key={index}
                            className={`p-3 rounded-lg border ${
                              issue.severity === 'critical' ? 'bg-red-50 border-red-200' :
                              issue.severity === 'error' ? 'bg-orange-50 border-orange-200' :
                              issue.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                              'bg-blue-50 border-blue-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {getSeverityIcon(issue.severity)}
                              <span className="font-medium text-sm">{issue.title}</span>
                              {getSeverityBadge(issue.severity)}
                            </div>
                            <p className="text-sm text-gray-700 ml-6">{issue.description}</p>
                            {issue.suggestion && (
                              <p className="text-sm text-gray-600 ml-6 mt-1 flex items-center gap-1">
                                <span className="text-yellow-500">💡</span>
                                {issue.suggestion}
                              </p>
                            )}
                            {issue.endpoint && (
                              <code className="text-xs bg-gray-200 px-2 py-0.5 rounded ml-6 mt-1 inline-block">
                                {issue.endpoint}
                              </code>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommandations */}
                  {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-500" />
                        Recommandations
                      </h3>
                      <ul className="space-y-1">
                        {selectedReport.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-blue-500">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Phases détaillées */}
                  <div>
                    <h3 className="font-semibold mb-3">Phases du test</h3>
                    <div className="space-y-2">
                      {selectedReport.phases?.map((phase, index) => (
                        <div
                          key={phase.phase}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <div
                            onClick={() => togglePhase(phase.phase)}
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                          >
                            {expandedPhases[phase.phase] ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                            {getPhaseIcon(phase.success)}
                            <span className="flex-1 font-medium text-sm">
                              {index + 1}. {phase.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDuration(phase.duration_ms)}
                            </span>
                          </div>
                          
                          {expandedPhases[phase.phase] && (
                            <div className="px-4 pb-3 pt-1 bg-gray-50 border-t border-gray-200">
                              <p className="text-sm text-gray-600 mb-2">{phase.description}</p>
                              
                              {phase.issues && phase.issues.length > 0 && (
                                <div className="mb-2">
                                  {phase.issues.map((issue, i) => (
                                    <div key={i} className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-1">
                                      <strong>{issue.title}:</strong> {issue.description}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {phase.details && Object.keys(phase.details).length > 0 && (
                                <div className="text-sm">
                                  <strong className="text-gray-600">Détails:</strong>
                                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(phase.details, null, 2)}
                                  </pre>
                                </div>
                              )}
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

export default AdminAdhesionTestAgent;
