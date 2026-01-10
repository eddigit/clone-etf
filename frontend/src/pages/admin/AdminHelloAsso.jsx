import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Download,
  Calendar,
  Users,
  CreditCard
} from 'lucide-react';
import { API_URL } from '../../config/api';

const AdminHelloAsso = () => {
  const [status, setStatus] = useState(null);
  const [forms, setForms] = useState([]);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [activeTab, setActiveTab] = useState('status');

  // Fonction pour récupérer les headers avec le token actuel
  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/helloasso/status`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/helloasso/forms`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setForms(data.forms || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/admin/helloasso/members`;
      if (fromDate) {
        url += `?from_date=${fromDate}`;
      }
      const response = await fetch(url, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/helloasso/payments`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (force = false) => {
    setSyncing(true);
    try {
      let url = `${API_URL}/admin/helloasso/sync?force=${force}`;
      if (fromDate) {
        url += `&from_date=${fromDate}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Synchronisation terminée!\n\nTotal traités: ${result.total}\nCréés: ${result.created}\nMis à jour: ${result.updated}\nIgnorés: ${result.skipped}\nErreurs: ${result.errors?.length || 0}`);
        fetchPayments();
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'forms':
        fetchForms();
        break;
      case 'preview':
        fetchMembers();
        break;
      case 'payments':
        fetchPayments();
        break;
      default:
        fetchStatus();
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/admin" className="hover:text-blue-600">Admin</Link>
            <span>/</span>
            <span>HelloAsso</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <img 
              src="https://cdn.helloasso.com/img/logos/ha-logo.svg" 
              alt="HelloAsso" 
              className="h-8"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            Intégration HelloAsso
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {[
          { id: 'status', label: 'Statut', icon: CheckCircle },
          { id: 'forms', label: 'Formulaires', icon: Calendar },
          { id: 'preview', label: 'Prévisualisation', icon: Users },
          { id: 'payments', label: 'Paiements', icon: CreditCard }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Status Tab */}
          {activeTab === 'status' && (
            <Card>
              <CardHeader>
                <CardTitle>État de la connexion</CardTitle>
              </CardHeader>
              <CardContent>
                {status?.connected ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800">Connecté à HelloAsso</p>
                        <p className="text-sm text-green-700">
                          Organisation: {status.organization?.name} ({status.organization?.slug})
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">URL de Webhook</h4>
                      <code className="text-sm bg-white p-2 rounded border block">
                        https://en-toutefranchise.com/api/webhooks/helloasso
                      </code>
                      <p className="text-sm text-gray-500 mt-2">
                        Configurez cette URL dans votre espace HelloAsso pour recevoir les notifications de paiement automatiquement.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-800">Non connecté</p>
                      <p className="text-sm text-red-700">
                        {status?.error || 'Vérifiez vos identifiants HelloAsso'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Forms Tab */}
          {activeTab === 'forms' && (
            <Card>
              <CardHeader>
                <CardTitle>Formulaires HelloAsso</CardTitle>
                <CardDescription>Liste de vos formulaires d'adhésion</CardDescription>
              </CardHeader>
              <CardContent>
                {forms.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>État</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {forms.map((form, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{form.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{form.formType}</Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm">{form.formSlug}</code>
                          </TableCell>
                          <TableCell>
                            {form.state === 'Public' ? (
                              <Badge className="bg-green-100 text-green-800">Public</Badge>
                            ) : (
                              <Badge variant="secondary">{form.state}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucun formulaire trouvé</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Prévisualisation avant synchronisation</CardTitle>
                  <CardDescription>Visualisez les adhérents HelloAsso avant de les importer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <label className="text-sm text-gray-500">À partir du</label>
                      <Input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button onClick={fetchMembers} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Charger
                      </Button>
                      <Button onClick={() => handleSync(false)} disabled={syncing || members.length === 0}>
                        {syncing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Synchronisation...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Synchroniser ({members.length})
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {members.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Formulaire</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.slice(0, 50).map((member, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>{member.firstName} {member.lastName}</TableCell>
                            <TableCell>
                              <code className="text-xs">{member.formSlug}</code>
                            </TableCell>
                            <TableCell>{member.amount} €</TableCell>
                            <TableCell>{formatDate(member.paymentDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Cliquez sur "Charger" pour afficher les adhérents
                    </p>
                  )}
                  
                  {members.length > 50 && (
                    <p className="text-sm text-gray-500 text-center mt-4">
                      Affichage des 50 premiers sur {members.length} adhérents
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <Card>
              <CardHeader>
                <CardTitle>Paiements synchronisés</CardTitle>
                <CardDescription>Historique des paiements HelloAsso importés</CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Formulaire</TableHead>
                        <TableHead>Type adhésion</TableHead>
                        <TableHead>Synchronisé le</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{payment.email}</TableCell>
                          <TableCell className="font-medium">{payment.amount} €</TableCell>
                          <TableCell>
                            <code className="text-xs">{payment.formSlug}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.membershipType}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(payment.syncedAt || payment.processedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucun paiement synchronisé</p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AdminHelloAsso;
