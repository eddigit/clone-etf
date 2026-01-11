import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
  Filter,
  Mail,
  Send,
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import { API_URL } from '../../config/api';

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
  
  // Nouveaux états pour la création d'adhérent
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    user_email: '',
    phone: '',
    membership_type: 'individual',
    payment_method: 'pending',
    status: 'pending',
    send_email: true
  });

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
    console.log('fetchMemberDetails called with:', memberId);
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
        console.log('Member details:', data);
        setSelectedMember(data);
        setShowDetails(true);
      } else {
        console.error('Failed to fetch member:', response.status);
        alert('Erreur lors du chargement des détails du membre');
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const handleStatusChange = async (memberId, newStatus) => {
    console.log('handleStatusChange called:', memberId, newStatus);
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
        alert('Statut mis à jour avec succès');
        fetchMembers();
      } else {
        console.error('Failed to update status:', response.status);
        alert('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const handleGenerateCoupon = async (memberId) => {
    console.log('handleGenerateCoupon called:', memberId);
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
      } else {
        console.error('Failed to generate coupon:', response.status);
        alert('Erreur lors de la création du coupon');
      }
    } catch (error) {
      console.error('Error generating coupon:', error);
      alert('Erreur: ' + error.message);
    }
  };

  // Créer un nouvel adhérent
  const handleCreateMember = async (e) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/memberships`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...createForm,
          amount: createForm.status === 'paid' ? 30 : 0
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Envoyer l'email approprié si demandé
        if (createForm.send_email && data.user_id) {
          if (createForm.status === 'pending') {
            // Email d'invitation à adhérer via HelloAsso
            await handleSendInvitationEmail(data.user_id, createForm.user_email);
          } else {
            // Email de bienvenue (déjà payé)
            await handleSendWelcomeEmailSilent(data.user_id, createForm.user_email);
          }
        }
        
        alert(`Adhérent créé avec succès !${createForm.send_email ? '\nL\'email a été envoyé.' : ''}`);
        
        setShowCreateModal(false);
        setCreateForm({
          first_name: '',
          last_name: '',
          user_email: '',
          phone: '',
          membership_type: 'individual',
          payment_method: 'pending',
          status: 'pending',
          send_email: true
        });
        fetchMembers();
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.detail || 'Impossible de créer l\'adhérent'}`);
      }
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // Envoyer un email d'invitation à adhérer (pour les pending)
  const handleSendInvitationEmail = async (memberId, memberEmail) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/members/${memberId}/send-invitation-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to send invitation email:', data.detail);
      }
    } catch (error) {
      console.error('Error sending invitation email:', error);
    }
  };

  // Envoyer un email de bienvenue sans confirmation (appelé après création)
  const handleSendWelcomeEmailSilent = async (memberId, memberEmail) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/members/${memberId}/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to send welcome email:', data.detail);
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  };

  // Envoyer un email de renouvellement individuel
  const handleSendRenewalEmail = async (memberId, memberEmail, firstName) => {
    if (!window.confirm(`Envoyer un email de renouvellement à ${memberEmail} ?\n\nL'adhérent recevra un lien pour renouveler son adhésion via HelloAsso.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/members/${memberId}/send-renewal-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert(`Email de renouvellement envoyé à ${memberEmail}`);
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.detail || 'Impossible d\'envoyer l\'email'}`);
      }
    } catch (error) {
      console.error('Error sending renewal email:', error);
      alert('Erreur: ' + error.message);
    }
  };

  const handleSendWelcomeEmail = async (memberId, memberEmail) => {
    if (!window.confirm(`Envoyer un email de bienvenue a ${memberEmail} ?\n\nL'adherent recevra un lien pour creer son mot de passe.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/members/${memberId}/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert(`Email de bienvenue envoye a ${memberEmail}`);
      } else {
        const data = await response.json();
        alert(`Erreur: ${data.detail || 'Impossible d\'envoyer l\'email'}`);
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
      alert('Erreur lors de l\'envoi de l\'email');
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
          <Button onClick={() => setShowCreateModal(true)}>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Mail button clicked');
                              handleSendWelcomeEmail(member.id, member.email);
                            }}
                            title="Envoyer email de bienvenue"
                            className="text-blue-600"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Eye button clicked for member:', member.id);
                              fetchMemberDetails(member.id);
                            }}
                            title="Voir details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Edit button clicked');
                              setEditForm(member);
                              setShowEditModal(true);
                            }}
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {member.membershipStatus === 'active' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Deactivate button clicked');
                                handleStatusChange(member.id, 'expired');
                              }}
                              className="text-orange-600"
                              title="Desactiver"
                            >
                              Desactiver
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Activate button clicked');
                                handleStatusChange(member.id, 'active');
                              }}
                              className="text-green-600"
                              title="Activer"
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

              {/* Onboarding Data */}
              {selectedMember.onboarding?.onboarding_data && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center">
                    <span className="mr-2">📋</span> Profil Onboarding
                  </h4>
                  <div className="space-y-4 text-sm">
                    {/* Statut et profil */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-500">Type de membre</label>
                        <p className="font-medium capitalize">
                          {selectedMember.onboarding.onboarding_data.member_status?.replace('_', ' ') || '-'}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-500">Secteur d'activité</label>
                        <p className="font-medium">
                          {selectedMember.onboarding.onboarding_data.activity_sector || '-'}
                        </p>
                      </div>
                      {selectedMember.onboarding.onboarding_data.company_size && (
                        <div>
                          <label className="text-gray-500">Taille entreprise</label>
                          <p className="font-medium">
                            {selectedMember.onboarding.onboarding_data.company_size}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Motivations */}
                    {selectedMember.onboarding.onboarding_data.motivations?.length > 0 && (
                      <div>
                        <label className="text-gray-500">Motivations</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedMember.onboarding.onboarding_data.motivations.map((m, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {m === 'besoin_aide' && '🆘 Besoin d\'aide'}
                              {m === 'soutenir_cause' && '❤️ Soutenir la cause'}
                              {m === 'reseau' && '🤝 Réseau'}
                              {m === 'veille_juridique' && '⚖️ Veille juridique'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Défis */}
                    {selectedMember.onboarding.onboarding_data.main_challenges && (
                      <div>
                        <label className="text-gray-500">Situation / Défis</label>
                        <p className="mt-1 p-2 bg-gray-50 rounded text-gray-700 italic">
                          "{selectedMember.onboarding.onboarding_data.main_challenges}"
                        </p>
                      </div>
                    )}

                    {/* Attentes */}
                    {selectedMember.onboarding.onboarding_data.expectations?.length > 0 && (
                      <div>
                        <label className="text-gray-500">Attentes / Services souhaités</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedMember.onboarding.onboarding_data.expectations.map((e, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {e === 'ia_assistant' && '🤖 IA'}
                              {e === 'soutien_numerique' && '💻 Numérique'}
                              {e === 'dossiers' && '📁 Dossiers'}
                              {e === 'litiges' && '⚖️ Litiges'}
                              {e === 'formation' && '🎓 Formation'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comment découvert */}
                    {selectedMember.onboarding.onboarding_data.how_discovered && (
                      <div>
                        <label className="text-gray-500">Comment nous a connu</label>
                        <p className="font-medium capitalize">
                          {selectedMember.onboarding.onboarding_data.how_discovered.replace('_', ' ')}
                        </p>
                      </div>
                    )}

                    {/* Date de complétion */}
                    {selectedMember.onboarding.onboarding_data.completed_at && (
                      <div className="text-xs text-gray-400 pt-2 border-t">
                        Onboarding complété le {formatDate(selectedMember.onboarding.onboarding_data.completed_at)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message si pas d'onboarding */}
              {!selectedMember.onboarding?.is_completed && (
                <div className="border-t pt-4">
                  <div className="flex items-center p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                    <span className="mr-2">⚠️</span>
                    Cet adhérent n'a pas encore complété son profil d'onboarding
                  </div>
                </div>
              )}

              {/* Actions CTA */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSendWelcomeEmail(selectedMember.user?.id, selectedMember.user?.email)}
                    className="text-blue-600"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email de bienvenue
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSendRenewalEmail(selectedMember.user?.id, selectedMember.user?.email, selectedMember.user?.firstName)}
                    className="text-orange-600"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Demander renouvellement
                  </Button>
                  <a 
                    href="https://www.helloasso.com/associations/en-toute-franchise/adhesions/adhesion-en-toute-franchise-2025" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="text-green-600">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Page HelloAsso
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Création Adhérent */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un nouvel adhérent</DialogTitle>
            <DialogDescription>
              L'adhérent recevra un email pour créer son mot de passe et accéder à la plateforme.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMember}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({...createForm, first_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm({...createForm, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="user_email">Email *</Label>
                <Input
                  id="user_email"
                  type="email"
                  value={createForm.user_email}
                  onChange={(e) => setCreateForm({...createForm, user_email: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="membership_type">Type d'adhésion</Label>
                <Select 
                  value={createForm.membership_type} 
                  onValueChange={(value) => setCreateForm({...createForm, membership_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Particulier (30€)</SelectItem>
                    <SelectItem value="professional">Commerçant - Artisan (30€)</SelectItem>
                    <SelectItem value="professional_plus">Commerçant +100m² (50€)</SelectItem>
                    <SelectItem value="association">Association (50€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status">Statut de paiement</Label>
                <Select 
                  value={createForm.status} 
                  onValueChange={(value) => setCreateForm({...createForm, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente de paiement</SelectItem>
                    <SelectItem value="paid">Payé (chèque/virement/espèces)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="send_email"
                  checked={createForm.send_email}
                  onChange={(e) => setCreateForm({...createForm, send_email: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="send_email" className="text-sm font-normal">
                  Envoyer un email d'invitation à l'adhérent
                </Label>
              </div>

              {createForm.status === 'pending' && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  <strong>💡 Mode invitation :</strong> L'adhérent recevra un email l'invitant à 
                  finaliser son adhésion via HelloAsso.
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createLoading}>
                {createLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Créer l'adhérent
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMembers;
