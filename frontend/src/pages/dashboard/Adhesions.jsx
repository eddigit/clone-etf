import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Plus,
  AlertCircle 
} from 'lucide-react';
import API from '../../config/api';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

const STATUS_CONFIG = {
  pending: {
    label: 'En attente de paiement',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Votre adhésion est en attente de paiement'
  },
  paid: {
    label: 'Payée',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-800',
    description: 'Votre adhésion est active'
  },
  cancelled: {
    label: 'Annulée',
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    description: 'Cette adhésion a été annulée'
  }
};

const MEMBERSHIP_TYPE_LABELS = {
  individual: 'Particulier',
  professional: 'Commerçant - Artisan',
  professional_plus: 'Commerçant +100m²',
  association: 'Association'
};

export default function Adhesions() {
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(null);
  const [generatingPayment, setGeneratingPayment] = useState(null);

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await API.get('/api/memberships/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMemberships(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des adhésions:', err);
      setError('Impossible de charger vos adhésions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (membershipId) => {
    try {
      setDownloadingPdf(membershipId);
      const token = localStorage.getItem('token');

      const response = await API.get(`/api/memberships/${membershipId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob'
      });

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bordereau_adhesion_${membershipId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Erreur lors du téléchargement du PDF:', err);
      alert('Impossible de télécharger le PDF. Veuillez réessayer.');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handlePayment = async (membershipId) => {
    try {
      setGeneratingPayment(membershipId);
      const token = localStorage.getItem('token');

      const response = await API.get(`/api/memberships/${membershipId}/payment-url`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const { payment_url } = response.data;

      if (payment_url) {
        // Rediriger vers HelloAsso pour le paiement
        window.location.href = payment_url;
      } else {
        alert('Impossible de générer le lien de paiement. Veuillez réessayer.');
      }

    } catch (err) {
      console.error('Erreur lors de la génération du lien de paiement:', err);
      alert('Impossible de générer le lien de paiement. Veuillez réessayer.');
    } finally {
      setGeneratingPayment(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de vos adhésions...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes adhésions</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos adhésions et téléchargez vos bordereaux
          </p>
        </div>
        <Button onClick={() => navigate('/adhesion')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle adhésion
        </Button>
      </div>

      {/* Erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Liste des adhésions */}
      {memberships.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucune adhésion
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Vous n'avez pas encore d'adhésion. Créez votre première adhésion pour bénéficier de tous nos services.
            </p>
            <Button onClick={() => navigate('/adhesion')}>
              <Plus className="h-4 w-4 mr-2" />
              Créer mon adhésion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {memberships.map((membership) => {
            const statusConfig = STATUS_CONFIG[membership.status];
            const StatusIcon = statusConfig.icon;
            const typeLabel = MEMBERSHIP_TYPE_LABELS[membership.membership_type];

            return (
              <Card key={membership.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">
                        Adhésion {membership.year}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {typeLabel} • {membership.amount}€
                      </CardDescription>
                    </div>
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Informations du membre */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm text-gray-700">Informations</h4>
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Nom :</span>{' '}
                        <span className="font-medium">
                          {membership.member_data.prenom} {membership.member_data.nom}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email :</span>{' '}
                        <span className="font-medium">{membership.member_data.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Téléphone :</span>{' '}
                        <span className="font-medium">{membership.member_data.telephone}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Ville :</span>{' '}
                        <span className="font-medium">{membership.member_data.ville}</span>
                      </div>
                    </div>

                    {/* Informations professionnelles si applicable */}
                    {(membership.membership_type === 'professional' || 
                      membership.membership_type === 'professional_plus') && 
                      membership.member_data.activite_detail && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-gray-600 text-sm">Activité :</span>{' '}
                        <span className="font-medium text-sm">
                          {membership.member_data.activite_detail}
                        </span>
                        {membership.member_data.is_franchise && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Franchisé
                          </span>
                        )}
                      </div>
                    )}

                    {/* Informations association si applicable */}
                    {membership.membership_type === 'association' && 
                      membership.member_data.nom_association && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-gray-600 text-sm">Association :</span>{' '}
                        <span className="font-medium text-sm">
                          {membership.member_data.nom_association}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-gray-600">
                      Créée le {new Date(membership.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>

                    <div className="flex gap-2">
                      {membership.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePayment(membership.id)}
                          disabled={generatingPayment === membership.id}
                        >
                          {generatingPayment === membership.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                              Génération...
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 mr-2" />
                              Payer maintenant
                            </>
                          )}
                        </Button>
                      )}

                      {membership.pdf_available && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleDownloadPdf(membership.id)}
                          disabled={downloadingPdf === membership.id}
                        >
                          {downloadingPdf === membership.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Téléchargement...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger le bordereau
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Message selon le statut */}
                  {membership.status === 'pending' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Votre adhésion est en attente de paiement. Une fois le paiement effectué,
                        vous pourrez télécharger votre bordereau d'adhésion.
                      </AlertDescription>
                    </Alert>
                  )}

                  {membership.status === 'paid' && !membership.pdf_available && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Le bordereau PDF est en cours de génération. Il sera disponible dans quelques instants.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Information supplémentaire */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-blue-900">
                À propos de votre adhésion
              </h3>
              <p className="mt-1 text-sm text-blue-800">
                Votre bordereau d'adhésion est un document officiel qui atteste de votre adhésion
                à l'association En Toute Franchise Association. Conservez-le précieusement, il peut vous être
                demandé lors de l'accès à certains services.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
