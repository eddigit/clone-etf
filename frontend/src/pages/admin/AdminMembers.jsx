import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { 
  Search, 
  RefreshCw, 
  Eye, 
  Edit, 
  Trash2, 
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter
} from 'lucide-react';
import API_URL from '../../config/api';

const AdminMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});

  const limit = 20;

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString()
      });
      
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('membership_type', typeFilter);

      const response = await fetch(`${API_URL}/admin/members?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchMembers();
  };

  const fetchMemberDetails = async (memberId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/members/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedMember(data);
        setShowDetails(true);
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
    }
  };

  const handleStatusChange = async (memberId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/members/${memberId}/status?status=${newStatus}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleGenerateCoupon = async (memberId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/members/${memberId}/generate-coupon`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          discountType: 'percentage',
          discountValue: 20,
          applicableTo: ['website', 'coaching'],
          maxUses: 10
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Coupon créé: ${data.coupon.code}`);
        fetchMembers();
      }
    } catch (error) {
      console.error('Error generating coupon:', error);
    }
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800">Actif</Badge>
    ) : (
      <Badge variant="secondary">Expiré</Badge>
    );
  };

  const getMembershipTypeBadge = (type) => {
    const types = {
      individual: { label: 'Particulier', color: 'bg-blue-100 text-blue-800' },
      professional: { label: 'Commerçant', color: 'bg-purple-100 text-purple-800' },
      professional_plus: { label: 'Entreprise', color: 'bg-orange-100 text-orange-800' },
      association: { label: 'Association', color: 'bg-teal-100 text-teal-800' }
    };
    const t = types[type] || { label: type, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={t.color}>{t.label}</Badge>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/admin" className="hover:text-blue-600">Admin</Link>
            <span>/</span>
            <span>Adhérents</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Adhérents</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchMembers()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="expired">Expirés</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type adhésion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="individual">Particuliers</SelectItem>
                <SelectItem value="professional">Commerçants</SelectItem>
                <SelectItem value="professional_plus">Entreprises</SelectItem>
                <SelectItem value="association">Associations</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Fin adhésion</TableHead>
                    <TableHead>Coupon</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.firstName} {member.lastName}</p>
                          {member.businessName && (
                            <p className="text-sm text-gray-500">{member.businessName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{getMembershipTypeBadge(member.membershipType)}</TableCell>
                      <TableCell>{getStatusBadge(member.membershipStatus)}</TableCell>
                      <TableCell>{formatDate(member.membershipEndDate)}</TableCell>
                      <TableCell>
                        {member.couponCode ? (
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{member.couponCode}</code>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleGenerateCoupon(member.id)}
                          >
                            Créer
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => fetchMemberDetails(member.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditForm(member);
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {member.membershipStatus === 'active' ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleStatusChange(member.id, 'expired')}
                              className="text-orange-600"
                            >
                              Désactiver
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleStatusChange(member.id, 'active')}
                              className="text-green-600"
                            >
                              Activer
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {members.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Aucun adhérent trouvé
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-gray-500">
                  Page {page + 1} • {members.length} résultats
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={members.length < limit}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Member Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'adhérent</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Nom complet</label>
                  <p className="font-medium">{selectedMember.user?.firstName} {selectedMember.user?.lastName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{selectedMember.user?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Téléphone</label>
                  <p className="font-medium">{selectedMember.user?.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Entreprise</label>
                  <p className="font-medium">{selectedMember.user?.businessName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Type adhésion</label>
                  <p>{getMembershipTypeBadge(selectedMember.user?.membershipType)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Statut</label>
                  <p>{getStatusBadge(selectedMember.user?.membershipStatus)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Début adhésion</label>
                  <p className="font-medium">{formatDate(selectedMember.user?.membershipStartDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Fin adhésion</label>
                  <p className="font-medium">{formatDate(selectedMember.user?.membershipEndDate)}</p>
                </div>
              </div>

              {/* Coupons */}
              {selectedMember.coupons?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Coupons</h4>
                  <div className="space-y-2">
                    {selectedMember.coupons.map((coupon, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <code className="font-mono font-bold">{coupon.code}</code>
                          <p className="text-sm text-gray-500">
                            {coupon.discountValue}% • {coupon.currentUses || 0}/{coupon.maxUses} utilisations
                          </p>
                        </div>
                        <Badge className={coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>
                          {coupon.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HelloAsso Payments */}
              {selectedMember.payments?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Paiements HelloAsso</h4>
                  <div className="space-y-2">
                    {selectedMember.payments.map((payment, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium">{payment.amount} €</p>
                          <p className="text-sm text-gray-500">{payment.formSlug}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(payment.processedAt || payment.syncedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMembers;
