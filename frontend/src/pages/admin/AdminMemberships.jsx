import React, { useState, useEffect } from 'react';
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
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Users,
  Calendar,
  X,
  Edit,
  Filter
} from 'lucide-react';
import { API_URL } from '../../config/api';

const AdminMemberships = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [memberships, setMemberships] = useState([]);
  const [renewals, setRenewals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    status: '',
    payment_method: ''
  });

  // Formulaire de creation
  const [createForm, setCreateForm] = useState({
    user_email: '',
    first_name: '',
    last_name: '',
    phone: '',
    membership_type: 'individual',
    amount: 50,
    payment_method: 'cheque',
    payment_reference: '',
    status: 'paid',
    notes: ''
  });

  // Formulaire d'edition
  const [editForm, setEditForm] = useState({
    status: '',
    payment_method: '',
    payment_reference: '',
    notes: '',
    membership_end_date: '',
    role: ''
  });

  // Fonction pour récupérer les headers avec le token actuel
  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.year) params.append('year', filters.year);
      if (filters.status) params.append('status', filters.status);
      if (filters.payment_method) params.append('payment_method', filters.payment_method);

      const response = await fetch(`${API_URL}/admin/memberships?${params}`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setMemberships(data.memberships || []);
      }
    } catch (error) {
      console.error('Error fetching memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRenewals = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/memberships/renewals?days=60`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setRenewals(data);
      }
    } catch (error) {
      console.error('Error fetching renewals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchMemberships();
    } else if (activeTab === 'renewals') {
      fetchRenewals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters]);

  const handleCreateMembership = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/admin/memberships`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(createForm)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Adhesion creee avec succes pour ${createForm.user_email}`);
        setShowCreateModal(false);
        setCreateForm({
          user_email: '',
          first_name: '',
          last_name: '',
          phone: '',
          membership_type: 'individual',
          amount: 50,
          payment_method: 'cheque',
          payment_reference: '',
          status: 'paid',
          notes: ''
        });
        fetchMemberships();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error creating membership:', error);
      alert('Erreur lors de la creation');
    }
  };

  const handleEditMembership = async (e) => {
    e.preventDefault();
    if (!selectedMembership) return;

    try {
      const updateData = {};
      if (editForm.status) updateData.status = editForm.status;
      if (editForm.payment_method) updateData.payment_method = editForm.payment_method;
      if (editForm.payment_reference) updateData.payment_reference = editForm.payment_reference;
      if (editForm.notes !== undefined) updateData.notes = editForm.notes;
      if (editForm.membership_end_date) updateData.membership_end_date = editForm.membership_end_date;
      if (editForm.role) updateData.role = editForm.role;

      const response = await fetch(`${API_URL}/admin/memberships/${selectedMembership.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        alert('Adhesion mise a jour');
        setShowEditModal(false);
        setSelectedMembership(null);
        fetchMemberships();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error updating membership:', error);
      alert('Erreur lors de la mise a jour');
    }
  };

  const openEditModal = (membership) => {
    setSelectedMembership(membership);
    setEditForm({
      status: membership.status || '',
      payment_method: membership.payment_method || '',
      payment_reference: membership.payment_reference || '',
      notes: membership.notes || '',
      membership_end_date: '',
      role: membership.role || 'user'
    });
    setShowEditModal(true);
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: <Badge className="bg-red-100 text-red-800">Admin</Badge>,
      vip: <Badge className="bg-amber-100 text-amber-800">VIP</Badge>,
      user: <Badge className="bg-blue-100 text-blue-800">Membre</Badge>
    };
    return badges[role] || <Badge variant="outline">{role || 'Membre'}</Badge>;
  };

  const getStatusBadge = (status) => {
    const badges = {
      paid: <Badge className="bg-green-100 text-green-800">Paye</Badge>,
      pending: <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>,
      cancelled: <Badge className="bg-red-100 text-red-800">Annule</Badge>,
      expired: <Badge className="bg-gray-100 text-gray-800">Expire</Badge>
    };
    return badges[status] || <Badge variant="outline">{status}</Badge>;
  };

  const getPaymentMethodBadge = (method) => {
    const badges = {
      helloasso: <Badge variant="outline" className="border-blue-300 text-blue-700">HelloAsso</Badge>,
      cheque: <Badge variant="outline" className="border-orange-300 text-orange-700">Cheque</Badge>,
      virement: <Badge variant="outline" className="border-purple-300 text-purple-700">Virement</Badge>,
      especes: <Badge variant="outline" className="border-green-300 text-green-700">Especes</Badge>
    };
    return badges[method] || <Badge variant="outline">{method}</Badge>;
  };

  const getMembershipTypeLabel = (type) => {
    const labels = {
      individual: 'Particulier',
      professional: 'Commercant/Artisan',
      professional_plus: 'Entreprise',
      association: 'Association',
      medium_store: 'Commercant 300m²+',
      large_store: 'Commercant 1 500-2 500m²',
      hypermarket: 'Commercant 2 500m²+'
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Adhesions</h1>
          <p className="text-gray-600 mt-1">Creez et gerez les adhesions manuellement</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Adhesion
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        {[
          { id: 'list', label: 'Toutes les adhesions', icon: CreditCard },
          { id: 'renewals', label: 'Renouvellements', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
          {/* Liste des adhesions */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {/* Filtres */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex gap-4 items-end">
                    <div>
                      <label className="text-sm text-gray-500">Annee</label>
                      <select
                        value={filters.year}
                        onChange={(e) => setFilters({...filters, year: e.target.value})}
                        className="block w-full mt-1 border rounded-md px-3 py-2"
                      >
                        <option value="">Toutes</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Statut</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="block w-full mt-1 border rounded-md px-3 py-2"
                      >
                        <option value="">Tous</option>
                        <option value="paid">Paye</option>
                        <option value="pending">En attente</option>
                        <option value="cancelled">Annule</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Mode de paiement</label>
                      <select
                        value={filters.payment_method}
                        onChange={(e) => setFilters({...filters, payment_method: e.target.value})}
                        className="block w-full mt-1 border rounded-md px-3 py-2"
                      >
                        <option value="">Tous</option>
                        <option value="helloasso">HelloAsso</option>
                        <option value="cheque">Cheque</option>
                        <option value="virement">Virement</option>
                        <option value="especes">Especes</option>
                      </select>
                    </div>
                    <Button variant="outline" onClick={fetchMemberships}>
                      <Filter className="h-4 w-4 mr-2" />
                      Filtrer
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card>
                <CardContent className="pt-4">
                  {memberships.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Adherent</TableHead>
                          <TableHead>Rôle</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Annee</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Paiement</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {memberships.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{m.user_name}</p>
                                <p className="text-sm text-gray-500">{m.user_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(m.role)}</TableCell>
                            <TableCell>{getMembershipTypeLabel(m.membership_type)}</TableCell>
                            <TableCell>{m.year}</TableCell>
                            <TableCell className="font-medium">{m.amount} EUR</TableCell>
                            <TableCell>
                              {getPaymentMethodBadge(m.payment_method)}
                              {m.payment_reference && (
                                <p className="text-xs text-gray-500 mt-1">Ref: {m.payment_reference}</p>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(m.status)}</TableCell>
                            <TableCell>{formatDate(m.created_at)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => openEditModal(m)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Aucune adhesion trouvee</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Renouvellements */}
          {activeTab === 'renewals' && renewals && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expirant bientot */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Clock className="h-5 w-5" />
                    Expirant bientot ({renewals.stats?.expiring_count || 0})
                  </CardTitle>
                  <CardDescription>Adhesions expirant dans les 60 prochains jours</CardDescription>
                </CardHeader>
                <CardContent>
                  {renewals.expiring_soon?.length > 0 ? (
                    <div className="space-y-3">
                      {renewals.expiring_soon.map((user) => (
                        <div key={user.user_id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-orange-100 text-orange-800">
                              {user.days_left}j restants
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              Expire le {formatDate(user.end_date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucune adhesion a renouveler</p>
                  )}
                </CardContent>
              </Card>

              {/* Expires */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Expires ({renewals.stats?.expired_count || 0})
                  </CardTitle>
                  <CardDescription>Adhesions deja expirees</CardDescription>
                </CardHeader>
                <CardContent>
                  {renewals.expired?.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {renewals.expired.map((user) => (
                        <div key={user.user_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-red-100 text-red-800">
                              Expire depuis {user.days_expired}j
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(user.end_date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucune adhesion expiree</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Modal Creation */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nouvelle Adhesion Manuelle</h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateMembership} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prenom *</label>
                  <Input
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({...createForm, first_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom *</label>
                  <Input
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm({...createForm, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <Input
                  type="email"
                  value={createForm.user_email}
                  onChange={(e) => setCreateForm({...createForm, user_email: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Telephone</label>
                <Input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type d adhesion *</label>
                  <select
                    value={createForm.membership_type}
                    onChange={(e) => {
                      const type = e.target.value;
                      const amounts = {
                        individual: 50,
                        professional: 100,
                        professional_plus: 200,
                        association: 150,
                        medium_store: 304.90,
                        large_store: 609.80,
                        hypermarket: 904.69
                      };
                      setCreateForm({...createForm, membership_type: type, amount: amounts[type] || 50});
                    }}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="individual">Particulier (50 EUR)</option>
                    <option value="professional">Commercant/Artisan (100 EUR)</option>
                    <option value="professional_plus">Entreprise (200 EUR)</option>
                    <option value="association">Association (150 EUR)</option>
                    <option value="medium_store">Commercant 300m²+ (304.90 EUR)</option>
                    <option value="large_store">Commercant 1 500-2 500m² (609.80 EUR)</option>
                    <option value="hypermarket">Commercant 2 500m²+ (904.69 EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Montant (EUR) *</label>
                  <Input
                    type="number"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm({...createForm, amount: parseFloat(e.target.value)})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mode de paiement *</label>
                  <select
                    value={createForm.payment_method}
                    onChange={(e) => setCreateForm({...createForm, payment_method: e.target.value})}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="cheque">Cheque</option>
                    <option value="virement">Virement</option>
                    <option value="especes">Especes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reference paiement</label>
                  <Input
                    value={createForm.payment_reference}
                    onChange={(e) => setCreateForm({...createForm, payment_reference: e.target.value})}
                    placeholder="N cheque, ref virement..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({...createForm, status: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="paid">Paye</option>
                  <option value="pending">En attente de paiement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({...createForm, notes: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                  rows={2}
                  placeholder="Notes internes..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  Creer l adhesion
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edition */}
      {showEditModal && selectedMembership && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Modifier l adhesion</h2>
              <button onClick={() => setShowEditModal(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{selectedMembership.user_name}</p>
              <p className="text-sm text-gray-500">{selectedMembership.user_email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">Rôle actuel:</span>
                {getRoleBadge(selectedMembership.role)}
              </div>
            </div>

            <form onSubmit={handleEditMembership} className="space-y-4">
              {/* Rôle utilisateur - Accès Chat IA */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <label className="block text-sm font-medium text-amber-800 mb-2">
                  🌟 Rôle utilisateur (Accès Chat IA)
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  className="w-full border border-amber-300 rounded-md px-3 py-2 bg-white"
                >
                  <option value="">Ne pas modifier</option>
                  <option value="user">👤 Membre standard</option>
                  <option value="vip">⭐ VIP (Chat IA gratuit)</option>
                  <option value="admin">🔐 Admin (Accès complet)</option>
                </select>
                <p className="text-xs text-amber-700 mt-1">
                  Les VIP et Admins ont accès au chat IA sans abonnement MaBoiteDigitale
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">Ne pas modifier</option>
                  <option value="paid">Paye</option>
                  <option value="pending">En attente</option>
                  <option value="cancelled">Annule</option>
                  <option value="expired">Expire</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mode de paiement</label>
                <select
                  value={editForm.payment_method}
                  onChange={(e) => setEditForm({...editForm, payment_method: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">Ne pas modifier</option>
                  <option value="helloasso">HelloAsso</option>
                  <option value="cheque">Cheque</option>
                  <option value="virement">Virement</option>
                  <option value="especes">Especes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reference paiement</label>
                <Input
                  value={editForm.payment_reference}
                  onChange={(e) => setEditForm({...editForm, payment_reference: e.target.value})}
                  placeholder="N cheque, ref virement..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Prolonger jusqu au</label>
                <Input
                  type="date"
                  value={editForm.membership_end_date}
                  onChange={(e) => setEditForm({...editForm, membership_end_date: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Laissez vide pour ne pas modifier la date de fin</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" className="flex-1">
                  Enregistrer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMemberships;
