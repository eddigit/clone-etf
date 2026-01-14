import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  Search,
  RefreshCw,
  Upload,
  Trash2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Mail,
  Send,
  Tag,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Copy,
  Eye,
  Play,
  Pause,
  BarChart3,
  Filter,
  Download,
  Settings,
  FolderOpen,
  Edit,
  Plus
} from 'lucide-react';
import { API_URL } from '../../config/api';
import { useToast } from '../../hooks/use-toast';

// Badges de statut
const STATUS_BADGES = {
  active: <Badge className="bg-green-100 text-green-800">Actif</Badge>,
  unsubscribed: <Badge className="bg-yellow-100 text-yellow-800">Désabonné</Badge>,
  bounced: <Badge className="bg-red-100 text-red-800">Bounced</Badge>,
  invalid: <Badge className="bg-gray-100 text-gray-800">Invalide</Badge>
};

const CAMPAIGN_STATUS_BADGES = {
  draft: <Badge variant="outline">Brouillon</Badge>,
  scheduled: <Badge className="bg-blue-100 text-blue-800">Programmée</Badge>,
  sending: <Badge className="bg-yellow-100 text-yellow-800">En cours</Badge>,
  sent: <Badge className="bg-green-100 text-green-800">Envoyée</Badge>,
  paused: <Badge className="bg-orange-100 text-orange-800">En pause</Badge>
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

// Composant ligne de contact
const ContactRow = memo(({ contact, selected, onSelect, onEdit, onDelete, categories }) => (
  <TableRow className="hover:bg-gray-50">
    <TableCell className="w-12">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(contact.id)}
        className="rounded border-gray-300"
      />
    </TableCell>
    <TableCell className="font-medium">{contact.email}</TableCell>
    <TableCell>
      {contact.firstName || contact.lastName 
        ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
        : '-'}
    </TableCell>
    <TableCell>{contact.company || '-'}</TableCell>
    <TableCell>
      {contact.categoryName ? (
        <Badge 
          style={{ 
            backgroundColor: categories?.find(c => c.id === contact.categoryId)?.color + '20',
            color: categories?.find(c => c.id === contact.categoryId)?.color || '#3B82F6',
            borderColor: categories?.find(c => c.id === contact.categoryId)?.color
          }}
          className="border"
        >
          {contact.categoryName}
        </Badge>
      ) : (
        <span className="text-gray-400">-</span>
      )}
    </TableCell>
    <TableCell>
      <div className="flex flex-wrap gap-1">
        {contact.tags?.slice(0, 3).map((tag, i) => (
          <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
        ))}
        {contact.tags?.length > 3 && (
          <Badge variant="outline" className="text-xs">+{contact.tags.length - 3}</Badge>
        )}
      </div>
    </TableCell>
    <TableCell>{STATUS_BADGES[contact.status] || STATUS_BADGES.active}</TableCell>
    <TableCell className="text-right">
      <Button variant="ghost" size="sm" onClick={() => onEdit(contact)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onDelete(contact.id)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </TableCell>
  </TableRow>
));

// Composant principal
const AdminCohesion = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('audiences'); // Vue par défaut = audiences
  const [loading, setLoading] = useState(true);
  
  // Navigation par audience
  const [selectedAudience, setSelectedAudience] = useState(null); // null = vue d'ensemble, object = audience sélectionnée
  const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'audience-detail'
  
  // État contacts
  const [contacts, setContacts] = useState([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsSearch, setContactsSearch] = useState('');
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  
  // État campagnes
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsTotal, setCampaignsTotal] = useState(0);
  const [campaignsPage, setCampaignsPage] = useState(1);
  
  // État tags
  const [tags, setTags] = useState([]);
  
  // État catégories
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  
  // État statistiques
  const [stats, setStats] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);
  
  // Modals
  const [showImportModal, setShowImportModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  
  // Formulaires
  const [currentContact, setCurrentContact] = useState(null);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importCategoryId, setImportCategoryId] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [selectAllMode, setSelectAllMode] = useState(false);
  const [allContactsCount, setAllContactsCount] = useState(0);
  const [noCategoryCount, setNoCategoryCount] = useState(0);
  
  // Pour la création rapide de campagne depuis une audience
  const [quickCampaignAudience, setQuickCampaignAudience] = useState(null);
  
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }), [token]);

  // Récupérer les contacts
  const fetchContacts = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: contactsPage,
        limit: 50
      });
      if (contactsSearch) params.append('search', contactsSearch);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedTag) params.append('tags', selectedTag);
      
      // Gestion de l'audience sélectionnée
      if (selectedAudience) {
        if (selectedAudience.id === '__uncategorized__') {
          params.append('hasCategory', 'false');
        } else {
          params.append('categoryId', selectedAudience.id);
        }
      } else if (selectedCategoryFilter) {
        params.append('categoryId', selectedCategoryFilter);
      }
      
      const res = await fetch(`${API_URL}/cohesion/contacts?${params}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts);
        setContactsTotal(data.total);
      }
    } catch (error) {
      console.error('Erreur chargement contacts:', error);
    }
  }, [contactsPage, contactsSearch, selectedStatus, selectedTag, selectedCategoryFilter, selectedAudience, headers]);

  // Récupérer les campagnes
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/cohesion/campaigns?page=${campaignsPage}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
        setCampaignsTotal(data.total);
      }
    } catch (error) {
      console.error('Erreur chargement campagnes:', error);
    }
  }, [campaignsPage, headers]);

  // Récupérer les tags
  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/cohesion/tags`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags);
      }
    } catch (error) {
      console.error('Erreur chargement tags:', error);
    }
  }, [headers]);

  // Récupérer les catégories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/cohesion/categories`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  }, [headers]);

  // Récupérer les statistiques
  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, emailRes, noCatRes] = await Promise.all([
        fetch(`${API_URL}/cohesion/stats`, { headers }),
        fetch(`${API_URL}/cohesion/email-status`, { headers }),
        fetch(`${API_URL}/cohesion/contacts/count?hasCategory=false`, { headers })
      ]);
      
      if (statsRes.ok) setStats(await statsRes.json());
      if (emailRes.ok) setEmailStatus(await emailRes.json());
      if (noCatRes.ok) {
        const data = await noCatRes.json();
        setNoCategoryCount(data.count);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  }, [headers]);

  // Chargement initial
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchContacts(),
        fetchCampaigns(),
        fetchTags(),
        fetchCategories(),
        fetchStats()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchContacts, fetchCampaigns, fetchTags, fetchCategories, fetchStats]);

  // Recharger les contacts quand l'audience sélectionnée change
  useEffect(() => {
    if (selectedAudience) {
      fetchContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAudience]);

  // Import CSV
  const handleImport = async () => {
    if (!importFile) return;
    
    const formData = new FormData();
    formData.append('file', importFile);
    
    // Construire l'URL avec la catégorie si sélectionnée
    let url = `${API_URL}/cohesion/import`;
    if (importCategoryId && importCategoryId !== '__none__') {
      url += `?category_id=${importCategoryId}`;
    }
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setImportResult(data.result);
        setImportFile(null);
        setImportCategoryId('');
        fetchContacts();
        fetchCategories();
        fetchStats();
        toast({
          title: "Import réussi",
          description: `${data.result.imported} contacts importés`
        });
      } else {
        const error = await res.json();
        toast({
          title: "Erreur d'import",
          description: error.detail,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'import",
        variant: "destructive"
      });
    }
  };

  // Créer/Modifier un contact
  const handleSaveContact = async () => {
    try {
      const method = currentContact?.id ? 'PUT' : 'POST';
      const url = currentContact?.id 
        ? `${API_URL}/cohesion/contacts/${currentContact.id}`
        : `${API_URL}/cohesion/contacts`;
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(currentContact)
      });
      
      if (res.ok) {
        toast({ title: "Contact enregistré" });
        setShowContactModal(false);
        setCurrentContact(null);
        fetchContacts();
      } else {
        const error = await res.json();
        toast({
          title: "Erreur",
          description: error.detail,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement",
        variant: "destructive"
      });
    }
  };

  // Supprimer un contact
  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Supprimer ce contact ?')) return;
    
    try {
      const res = await fetch(`${API_URL}/cohesion/contacts/${contactId}`, {
        method: 'DELETE',
        headers
      });
      
      if (res.ok) {
        toast({ title: "Contact supprimé" });
        fetchContacts();
        fetchStats();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  // Supprimer les contacts sélectionnés
  const handleDeleteSelected = async () => {
    if (!window.confirm(`Supprimer ${selectedContacts.size} contacts ?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/cohesion/contacts`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify(Array.from(selectedContacts))
      });
      
      if (res.ok) {
        toast({ title: `${selectedContacts.size} contacts supprimés` });
        setSelectedContacts(new Set());
        fetchContacts();
        fetchStats();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  // Supprimer les doublons
  const handleRemoveDuplicates = async () => {
    if (!window.confirm('Supprimer tous les doublons (garder le premier de chaque email) ?')) return;
    
    try {
      const res = await fetch(`${API_URL}/cohesion/remove-duplicates`, {
        method: 'POST',
        headers
      });
      
      if (res.ok) {
        const data = await res.json();
        toast({ title: data.message });
        fetchContacts();
        fetchStats();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression des doublons",
        variant: "destructive"
      });
    }
  };

  // Nettoyer les emails invalides
  const handleCleanInvalid = async () => {
    if (!window.confirm('Marquer tous les emails invalides ?')) return;
    
    try {
      const res = await fetch(`${API_URL}/cohesion/clean-invalid`, {
        method: 'POST',
        headers
      });
      
      if (res.ok) {
        const data = await res.json();
        toast({ title: data.message });
        fetchContacts();
        fetchStats();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du nettoyage",
        variant: "destructive"
      });
    }
  };

  // Créer/Modifier une catégorie
  const handleSaveCategory = async () => {
    if (!currentCategory?.name?.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la catégorie est requis",
        variant: "destructive"
      });
      return;
    }

    try {
      const method = currentCategory?.id ? 'PUT' : 'POST';
      const url = currentCategory?.id 
        ? `${API_URL}/cohesion/categories/${currentCategory.id}`
        : `${API_URL}/cohesion/categories`;
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(currentCategory)
      });
      
      if (res.ok) {
        toast({ title: currentCategory?.id ? "Catégorie modifiée" : "Catégorie créée" });
        setShowCategoryModal(false);
        setCurrentCategory(null);
        fetchCategories();
        fetchContacts();
      } else {
        const error = await res.json();
        toast({
          title: "Erreur",
          description: error.detail,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement",
        variant: "destructive"
      });
    }
  };

  // Supprimer une catégorie
  const handleDeleteCategory = async (categoryId, removeContacts = false) => {
    const message = removeContacts 
      ? 'Supprimer cette catégorie ET tous ses contacts ?' 
      : 'Supprimer cette catégorie ? Les contacts seront conservés sans catégorie.';
    
    if (!window.confirm(message)) return;
    
    try {
      const res = await fetch(
        `${API_URL}/cohesion/categories/${categoryId}?remove_contacts=${removeContacts}`, 
        {
          method: 'DELETE',
          headers
        }
      );
      
      if (res.ok) {
        toast({ title: "Catégorie supprimée" });
        fetchCategories();
        fetchContacts();
        fetchStats();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  // Assigner une catégorie aux contacts sélectionnés
  const handleAssignCategoryToSelected = async (categoryId) => {
    try {
      const res = await fetch(`${API_URL}/cohesion/contacts/bulk-category`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contact_ids: Array.from(selectedContacts),
          category_id: categoryId
        })
      });
      
      if (res.ok) {
        toast({ title: "Catégorie assignée" });
        setSelectedContacts(new Set());
        setSelectAllMode(false);
        fetchContacts();
        fetchCategories();
        fetchStats();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'assignation",
        variant: "destructive"
      });
    }
  };

  // Affecter une catégorie à tous les contacts sans catégorie
  const handleAssignCategoryToNoCategory = async (categoryId) => {
    if (!window.confirm(`Affecter cette catégorie à ${noCategoryCount} contacts sans catégorie ?`)) return;
    
    try {
      const res = await fetch(
        `${API_URL}/cohesion/contacts/bulk-assign-category?category_id=${categoryId}&filter_no_category=true`,
        {
          method: 'POST',
          headers
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        toast({ title: data.message });
        fetchContacts();
        fetchCategories();
        fetchStats();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'assignation",
        variant: "destructive"
      });
    }
  };

  // Supprimer tous les contacts sans catégorie
  const handleDeleteNoCategory = async () => {
    if (!window.confirm(`Supprimer définitivement ${noCategoryCount} contacts sans catégorie ?`)) return;
    
    try {
      const res = await fetch(
        `${API_URL}/cohesion/contacts/bulk-delete?filter_no_category=true`,
        {
          method: 'DELETE',
          headers
        }
      );
      
      if (res.ok) {
        const data = await res.json();
        toast({ title: data.message });
        fetchContacts();
        fetchCategories();
        fetchStats();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  // Sélectionner tous les contacts (pas juste la page)
  const handleSelectAll = async () => {
    try {
      // Construire les paramètres de filtre
      const params = new URLSearchParams();
      if (contactsSearch) params.append('search', contactsSearch);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedTag) params.append('tags', selectedTag);
      if (selectedCategoryFilter) params.append('categoryId', selectedCategoryFilter);
      
      const res = await fetch(`${API_URL}/cohesion/contacts/all-ids?${params}`, { headers });
      
      if (res.ok) {
        const data = await res.json();
        setSelectedContacts(new Set(data.ids));
        setAllContactsCount(data.count);
        setSelectAllMode(true);
        toast({ title: `${data.count} contacts sélectionnés` });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la sélection",
        variant: "destructive"
      });
    }
  };

  // Ajouter des tags aux sélectionnés
  const handleAddTagsToSelected = async () => {
    if (!newTag.trim()) return;
    
    try {
      const res = await fetch(`${API_URL}/cohesion/contacts/bulk-tags`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contact_ids: Array.from(selectedContacts),
          tags: [newTag.trim()]
        })
      });
      
      if (res.ok) {
        toast({ title: "Tags ajoutés" });
        setShowTagModal(false);
        setNewTag('');
        fetchContacts();
        fetchTags();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout des tags",
        variant: "destructive"
      });
    }
  };

  // Créer/Modifier une campagne
  const handleSaveCampaign = async () => {
    try {
      const method = currentCampaign?.id ? 'PUT' : 'POST';
      const url = currentCampaign?.id 
        ? `${API_URL}/cohesion/campaigns/${currentCampaign.id}`
        : `${API_URL}/cohesion/campaigns`;
      
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(currentCampaign)
      });
      
      if (res.ok) {
        toast({ title: "Campagne enregistrée" });
        setShowCampaignModal(false);
        setCurrentCampaign(null);
        fetchCampaigns();
      } else {
        const error = await res.json();
        toast({
          title: "Erreur",
          description: error.detail,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'enregistrement",
        variant: "destructive"
      });
    }
  };

  // Prévisualiser une campagne
  const handlePreviewCampaign = async (campaign) => {
    try {
      const res = await fetch(`${API_URL}/cohesion/campaigns/${campaign.id}/preview`, {
        method: 'POST',
        headers
      });
      
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        setShowPreviewModal(true);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la prévisualisation",
        variant: "destructive"
      });
    }
  };

  // Envoyer un email de test
  const handleTestCampaign = async (campaignId) => {
    const testEmail = prompt('Email de test :');
    if (!testEmail) return;
    
    try {
      const res = await fetch(`${API_URL}/cohesion/campaigns/${campaignId}/test?test_email=${encodeURIComponent(testEmail)}`, {
        method: 'POST',
        headers
      });
      
      if (res.ok) {
        toast({ title: "Email de test envoyé" });
      } else {
        const error = await res.json();
        toast({
          title: "Erreur",
          description: error.detail,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi du test",
        variant: "destructive"
      });
    }
  };

  // Lancer une campagne
  const handleSendCampaign = async (campaign) => {
    // Compter les destinataires d'abord
    try {
      const countRes = await fetch(`${API_URL}/cohesion/campaigns/${campaign.id}/count-recipients`, {
        method: 'POST',
        headers
      });
      
      if (!countRes.ok) {
        toast({
          title: "Erreur",
          description: "Impossible de compter les destinataires",
          variant: "destructive"
        });
        return;
      }
      
      const { recipientCount } = await countRes.json();
      
      if (!window.confirm(`Envoyer cette campagne à ${recipientCount} destinataires ?`)) return;
      
      const res = await fetch(`${API_URL}/cohesion/campaigns/${campaign.id}/send`, {
        method: 'POST',
        headers
      });
      
      if (res.ok) {
        const data = await res.json();
        toast({ title: data.message });
        fetchCampaigns();
      } else {
        const error = await res.json();
        toast({
          title: "Erreur",
          description: error.detail,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi",
        variant: "destructive"
      });
    }
  };

  // Supprimer une campagne
  const handleDeleteCampaign = async (campaignId) => {
    if (!window.confirm('Supprimer cette campagne ?')) return;
    
    try {
      const res = await fetch(`${API_URL}/cohesion/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers
      });
      
      if (res.ok) {
        toast({ title: "Campagne supprimée" });
        fetchCampaigns();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  // Navigation vers une audience spécifique
  const openAudience = (audience) => {
    setSelectedAudience(audience);
    setViewMode('audience-detail');
    setContactsPage(1);
    setContactsSearch('');
    setSelectedContacts(new Set());
    setSelectAllMode(false);
  };

  // Retour à la vue d'ensemble des audiences
  const backToOverview = () => {
    setSelectedAudience(null);
    setViewMode('overview');
    setContactsPage(1);
    setContactsSearch('');
    setSelectedCategoryFilter('');
    setSelectedContacts(new Set());
    setSelectAllMode(false);
  };

  // Créer une campagne rapide depuis une audience
  const createQuickCampaign = (audience) => {
    setCurrentCampaign({
      name: `Campagne - ${audience.name}`,
      subject: '',
      bodyHtml: '',
      recipientCategoryId: audience.id,
      recipientTags: []
    });
    setQuickCampaignAudience(audience);
    setShowCampaignModal(true);
  };

  // Toggle sélection contact
  const toggleContactSelection = (contactId) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  // Sélectionner tous (page courante uniquement)
  const selectAllContacts = () => {
    if (selectedContacts.size === contacts.length && !selectAllMode) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
      setSelectAllMode(false);
    }
  };

  // Désélectionner tout
  const clearSelection = () => {
    setSelectedContacts(new Set());
    setSelectAllMode(false);
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
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cohésion</h1>
          <p className="text-gray-600 mt-1">Gestion de la communauté et des communications</p>
        </div>
        <div className="flex items-center gap-4">
          {emailStatus?.configured ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-4 w-4 mr-1" />
              Resend configuré
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">
              <XCircle className="h-4 w-4 mr-1" />
              Email non configuré
            </Badge>
          )}
          <Button onClick={() => {
            fetchContacts();
            fetchCampaigns();
            fetchStats();
          }} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Contacts actifs</p>
                  <p className="text-2xl font-bold">{stats.activeContacts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Désabonnés</p>
                  <p className="text-2xl font-bold">{stats.unsubscribed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Invalides</p>
                  <p className="text-2xl font-bold">{stats.invalid + stats.bounced}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Campagnes</p>
                  <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Emails envoyés</p>
                  <p className="text-2xl font-bold">{stats.totalEmailsSent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); if (val === 'audiences') backToOverview(); }}>
        <TabsList className="mb-6">
          <TabsTrigger value="audiences">
            <FolderOpen className="h-4 w-4 mr-2" />
            Audiences
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Mail className="h-4 w-4 mr-2" />
            Campagnes
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Settings className="h-4 w-4 mr-2" />
            Outils
          </TabsTrigger>
        </TabsList>

        {/* Onglet Audiences - Vue principale style Mailchimp */}
        <TabsContent value="audiences">
          {viewMode === 'overview' ? (
            // Vue d'ensemble des audiences
            <div className="space-y-6">
              {/* En-tête avec actions */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Vos Audiences</h2>
                  <p className="text-gray-600">Gérez vos listes de contacts par audience</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowImportModal(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer CSV
                  </Button>
                  <Button onClick={() => {
                    setCurrentCategory({ name: '', description: '', color: '#3B82F6' });
                    setShowCategoryModal(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle audience
                  </Button>
                </div>
              </div>

              {/* Alerte contacts sans audience */}
              {noCategoryCount > 0 && (
                <Card className="border-2 border-yellow-300 bg-yellow-50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-yellow-200 flex items-center justify-center">
                          <AlertCircle className="h-6 w-6 text-yellow-700" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-yellow-900">Contacts sans audience</h3>
                          <p className="text-yellow-700">{noCategoryCount} contact(s) n'appartiennent à aucune audience</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => openAudience({ id: '__uncategorized__', name: 'Sans audience', color: '#EAB308', contactsCount: noCategoryCount })}>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir les contacts
                        </Button>
                        <Select onValueChange={handleAssignCategoryToNoCategory}>
                          <SelectTrigger className="w-[200px]">
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Affecter à une audience
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                  {cat.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Grille des audiences */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(audience => (
                  <Card 
                    key={audience.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow border-t-4"
                    style={{ borderTopColor: audience.color }}
                    onClick={() => openAudience(audience)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: audience.color }}
                          >
                            {audience.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{audience.name}</h3>
                            {audience.description && (
                              <p className="text-gray-500 text-sm">{audience.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setCurrentCategory(audience);
                              setShowCategoryModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between py-4 border-t border-gray-100">
                        <div className="text-center flex-1">
                          <p className="text-3xl font-bold" style={{ color: audience.color }}>{audience.contactsCount}</p>
                          <p className="text-sm text-gray-500">contacts</p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => createQuickCampaign(audience)}
                          disabled={!emailStatus?.configured || audience.contactsCount === 0}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Envoyer un email
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => openAudience(audience)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Gérer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Carte "Ajouter une audience" */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center min-h-[200px]"
                  onClick={() => {
                    setCurrentCategory({ name: '', description: '', color: '#3B82F6' });
                    setShowCategoryModal(true);
                  }}
                >
                  <CardContent className="text-center">
                    <Plus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="font-medium text-gray-600">Créer une audience</p>
                    <p className="text-sm text-gray-400">Organisez vos contacts</p>
                  </CardContent>
                </Card>
              </div>

              {categories.length === 0 && noCategoryCount === 0 && (
                <Card className="py-16">
                  <CardContent className="text-center">
                    <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune audience créée</h3>
                    <p className="text-gray-500 mb-4">Commencez par créer une audience ou importer des contacts</p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => {
                        setCurrentCategory({ name: '', description: '', color: '#3B82F6' });
                        setShowCategoryModal(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Créer une audience
                      </Button>
                      <Button variant="outline" onClick={() => setShowImportModal(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Importer des contacts
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            // Vue détaillée d'une audience
            <div className="space-y-6">
              {/* Breadcrumb et en-tête */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={backToOverview}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Retour aux audiences
                  </Button>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: selectedAudience?.color || '#6B7280' }}
                    >
                      {selectedAudience?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedAudience?.name || 'Audience'}</h2>
                      <p className="text-gray-600">{contactsTotal} contact(s)</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => createQuickCampaign(selectedAudience)}
                    disabled={!emailStatus?.configured || contactsTotal === 0}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer un email à cette audience
                  </Button>
                  <Button onClick={() => setShowImportModal(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer
                  </Button>
                  <Button onClick={() => {
                    setCurrentContact({ 
                      email: '', 
                      firstName: '', 
                      lastName: '', 
                      company: '', 
                      tags: [],
                      categoryId: selectedAudience?.id !== '__uncategorized__' ? selectedAudience?.id : null
                    });
                    setShowContactModal(true);
                  }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter un contact
                  </Button>
                </div>
              </div>

              <Card>
                <CardContent className="pt-6">
                  {/* Barre de recherche */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex-1 min-w-[200px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Rechercher dans cette audience..."
                          value={contactsSearch}
                          onChange={(e) => setContactsSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={selectedStatus || '__all__'} onValueChange={(v) => setSelectedStatus(v === '__all__' ? '' : v)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Tous</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="unsubscribed">Désabonné</SelectItem>
                        <SelectItem value="bounced">Bounced</SelectItem>
                        <SelectItem value="invalid">Invalide</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedTag || '__all__'} onValueChange={(v) => setSelectedTag(v === '__all__' ? '' : v)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tag" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Tous les tags</SelectItem>
                        {tags.map(tag => (
                          <SelectItem key={tag.name} value={tag.name}>{tag.name} ({tag.count})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions groupées */}
                  {selectedContacts.size > 0 && (
                    <div className="mb-4 p-4 bg-blue-100 border-2 border-blue-300 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold">
                            {selectAllMode ? allContactsCount : selectedContacts.size}
                          </div>
                          <span className="font-semibold text-blue-900">
                            {selectAllMode ? `${allContactsCount} contacts sélectionnés` : `${selectedContacts.size} contact(s) sélectionné(s)`}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {selectedAudience?.id === '__uncategorized__' && (
                            <Select onValueChange={handleAssignCategoryToSelected}>
                              <SelectTrigger className="w-[200px]">
                                <FolderOpen className="h-4 w-4 mr-2" />
                                Affecter à une audience
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                      {cat.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button size="sm" variant="outline" onClick={() => setShowTagModal(true)}>
                            <Tag className="h-4 w-4 mr-1" />
                            Ajouter tag
                          </Button>
                          <Button size="sm" variant="destructive" onClick={handleDeleteSelected}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                          <Button variant="ghost" size="sm" onClick={clearSelection}>
                            <XCircle className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tableau des contacts */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <input
                              type="checkbox"
                              checked={selectedContacts.size === contacts.length && contacts.length > 0}
                              onChange={selectAllContacts}
                              className="rounded border-gray-300"
                            />
                          </TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Entreprise</TableHead>
                          <TableHead>Tags</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map(contact => (
                          <TableRow key={contact.id} className="hover:bg-gray-50">
                            <TableCell className="w-12">
                              <input
                                type="checkbox"
                                checked={selectedContacts.has(contact.id)}
                                onChange={() => toggleContactSelection(contact.id)}
                                className="rounded border-gray-300"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{contact.email}</TableCell>
                            <TableCell>
                              {contact.firstName || contact.lastName 
                                ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                                : '-'}
                            </TableCell>
                            <TableCell>{contact.company || '-'}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {contact.tags?.slice(0, 3).map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                                ))}
                                {contact.tags?.length > 3 && (
                                  <Badge variant="outline" className="text-xs">+{contact.tags.length - 3}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{STATUS_BADGES[contact.status] || STATUS_BADGES.active}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setCurrentContact(contact);
                                setShowContactModal(true);
                              }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteContact(contact.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {contacts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                              Aucun contact dans cette audience
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      {contactsTotal} contact(s) au total
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={contactsPage === 1}
                        onClick={() => setContactsPage(p => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-3 py-1 text-sm">
                        Page {contactsPage}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={contacts.length < 50}
                        onClick={() => setContactsPage(p => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Onglet Contacts - SUPPRIMÉ, remplacé par la vue Audiences */}

        {/* Onglet Campagnes */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Campagnes d'emails</CardTitle>
                <Button onClick={() => {
                  setCurrentCampaign({
                    name: '',
                    subject: '',
                    bodyHtml: '',
                    recipientTags: []
                  });
                  setShowCampaignModal(true);
                }}>
                  <Mail className="h-4 w-4 mr-2" />
                  Nouvelle campagne
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <Card key={campaign.id} className="border">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          <p className="text-gray-600">{campaign.subject}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {CAMPAIGN_STATUS_BADGES[campaign.status]}
                            {campaign.recipientTags?.length > 0 && (
                              <span className="text-sm text-gray-500">
                                Tags: {campaign.recipientTags.join(', ')}
                              </span>
                            )}
                          </div>
                          {campaign.status === 'sent' && (
                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="text-green-600">
                                ✓ {campaign.sentCount} envoyés
                              </span>
                              {campaign.failedCount > 0 && (
                                <span className="text-red-600">
                                  ✗ {campaign.failedCount} échecs
                                </span>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Créée le {formatDate(campaign.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePreviewCampaign(campaign)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {campaign.status === 'draft' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleTestCampaign(campaign.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setCurrentCampaign(campaign);
                                  setShowCampaignModal(true);
                                }}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleSendCampaign(campaign)}
                                disabled={!emailStatus?.configured}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Envoyer
                              </Button>
                            </>
                          )}
                          {campaign.status !== 'sent' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {campaigns.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Aucune campagne créée
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Outils */}
        <TabsContent value="tools">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Nettoyage de la base</CardTitle>
                <CardDescription>
                  Outils pour maintenir une base de contacts propre
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleRemoveDuplicates}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Supprimer les doublons
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleCleanInvalid}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Détecter les emails invalides
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags populaires</CardTitle>
                <CardDescription>
                  Les tags les plus utilisés dans votre base
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stats?.topTags?.map(tag => (
                    <Badge 
                      key={tag.name} 
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setSelectedTag(tag.name);
                        setActiveTab('contacts');
                      }}
                    >
                      {tag.name} ({tag.count})
                    </Badge>
                  ))}
                  {(!stats?.topTags || stats.topTags.length === 0) && (
                    <p className="text-gray-500 text-sm">Aucun tag utilisé</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration Email</CardTitle>
                <CardDescription>
                  État de la configuration Resend
                </CardDescription>
              </CardHeader>
              <CardContent>
                {emailStatus?.configured ? (
                  <div className="space-y-2">
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Resend API configuré
                    </div>
                    <p className="text-sm text-gray-500">
                      Provider: {emailStatus.provider}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center text-red-600">
                      <XCircle className="h-5 w-5 mr-2" />
                      Resend non configuré
                    </div>
                    <p className="text-sm text-gray-500">
                      Définissez RESEND_API_KEY dans les variables d'environnement
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Créez un compte sur resend.com pour obtenir une clé API
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Variables disponibles</CardTitle>
                <CardDescription>
                  Variables utilisables dans les emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <code className="block bg-gray-100 px-2 py-1 rounded">{'{email}'}</code>
                  <code className="block bg-gray-100 px-2 py-1 rounded">{'{firstName}'}</code>
                  <code className="block bg-gray-100 px-2 py-1 rounded">{'{lastName}'}</code>
                  <code className="block bg-gray-100 px-2 py-1 rounded">{'{company}'}</code>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Import CSV */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importer des contacts</DialogTitle>
            <DialogDescription>
              Importez un fichier CSV contenant vos contacts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fichier CSV</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  setImportFile(e.target.files[0]);
                  setImportResult(null);
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Le fichier doit contenir une colonne "email". Colonnes optionnelles: nom, prenom, telephone, entreprise
              </p>
            </div>
            
            <div>
              <Label>Audience de destination</Label>
              <Select 
                value={importCategoryId || '__none__'} 
                onValueChange={(v) => setImportCategoryId(v === '__none__' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une audience (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucune audience</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Tous les contacts importés seront ajoutés à cette audience
              </p>
            </div>
            
            {importResult && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>{importResult.imported} contacts importés</span>
                </div>
                {importResult.duplicates > 0 && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="h-5 w-5" />
                    <span>{importResult.duplicates} doublons ignorés</span>
                  </div>
                )}
                {importResult.invalidEmails > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span>{importResult.invalidEmails} emails invalides</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowImportModal(false);
              setImportFile(null);
              setImportCategoryId('');
              setImportResult(null);
            }}>
              Fermer
            </Button>
            <Button onClick={handleImport} disabled={!importFile}>
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Contact */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentContact?.id ? 'Modifier le contact' : 'Ajouter un contact'}
            </DialogTitle>
          </DialogHeader>
          {currentContact && (
            <div className="space-y-4">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={currentContact.email}
                  onChange={(e) => setCurrentContact({...currentContact, email: e.target.value})}
                  disabled={!!currentContact.id}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prénom</Label>
                  <Input
                    value={currentContact.firstName || ''}
                    onChange={(e) => setCurrentContact({...currentContact, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={currentContact.lastName || ''}
                    onChange={(e) => setCurrentContact({...currentContact, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Entreprise</Label>
                <Input
                  value={currentContact.company || ''}
                  onChange={(e) => setCurrentContact({...currentContact, company: e.target.value})}
                />
              </div>
              <div>
                <Label>Tags (séparés par des virgules)</Label>
                <Input
                  value={currentContact.tags?.join(', ') || ''}
                  onChange={(e) => setCurrentContact({
                    ...currentContact, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                  })}
                />
              </div>
              <div>
                <Label>Audience</Label>
                <Select 
                  value={currentContact.categoryId || '__none__'} 
                  onValueChange={(value) => setCurrentContact({
                    ...currentContact, 
                    categoryId: value === '__none__' ? null : value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucune audience</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveContact}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Campagne */}
      <Dialog open={showCampaignModal} onOpenChange={(open) => {
        setShowCampaignModal(open);
        if (!open) setQuickCampaignAudience(null);
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {currentCampaign?.id ? 'Modifier la campagne' : 'Nouvelle campagne'}
            </DialogTitle>
            {quickCampaignAudience && (
              <DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: quickCampaignAudience.color }}
                  />
                  <span>Destinataires : <strong>{quickCampaignAudience.name}</strong> ({quickCampaignAudience.contactsCount} contacts)</span>
                </div>
              </DialogDescription>
            )}
          </DialogHeader>
          {currentCampaign && (
            <div className="space-y-4">
              <div>
                <Label>Nom de la campagne *</Label>
                <Input
                  value={currentCampaign.name}
                  onChange={(e) => setCurrentCampaign({...currentCampaign, name: e.target.value})}
                  placeholder="Ex: Newsletter Janvier"
                />
              </div>
              <div>
                <Label>Sujet de l'email *</Label>
                <Input
                  value={currentCampaign.subject}
                  onChange={(e) => setCurrentCampaign({...currentCampaign, subject: e.target.value})}
                  placeholder="Ex: Les actualités du mois"
                />
              </div>
              
              {/* Sélection de l'audience */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <Label className="text-base font-medium">Destinataires</Label>
                <p className="text-sm text-gray-500 mb-3">Choisissez l'audience cible de cette campagne</p>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Audience</Label>
                    <Select 
                      value={currentCampaign.recipientCategoryId || '__all__'} 
                      onValueChange={(v) => setCurrentCampaign({
                        ...currentCampaign, 
                        recipientCategoryId: v === '__all__' ? null : v
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Tous les contacts actifs
                          </div>
                        </SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                              {cat.name} ({cat.contactsCount} contacts)
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm">Filtrer par tags (optionnel)</Label>
                    <Input
                      value={currentCampaign.recipientTags?.join(', ') || ''}
                      onChange={(e) => setCurrentCampaign({
                        ...currentCampaign, 
                        recipientTags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                      })}
                      placeholder="Ex: newsletter, actif (laisser vide pour tous)"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Contenu HTML *</Label>
                <Textarea
                  value={currentCampaign.bodyHtml}
                  onChange={(e) => setCurrentCampaign({...currentCampaign, bodyHtml: e.target.value})}
                  placeholder="<h1>Bonjour {firstName}!</h1>"
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variables disponibles: {'{email}'}, {'{firstName}'}, {'{lastName}'}, {'{company}'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCampaignModal(false);
              setQuickCampaignAudience(null);
            }}>
              Annuler
            </Button>
            <Button onClick={handleSaveCampaign}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Prévisualisation */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Prévisualisation de la campagne</DialogTitle>
            {previewData?.sampleContact && (
              <DialogDescription>
                Exemple avec: {previewData.sampleContact.email}
              </DialogDescription>
            )}
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <div>
                <Label>Sujet</Label>
                <div className="p-3 bg-gray-100 rounded">{previewData.subject}</div>
              </div>
              <div>
                <Label>Contenu</Label>
                <div 
                  className="p-4 bg-white border rounded max-h-96 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: previewData.body }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowPreviewModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ajout de tags */}
      <Dialog open={showTagModal} onOpenChange={setShowTagModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un tag</DialogTitle>
            <DialogDescription>
              Ajouter un tag à {selectedContacts.size} contact(s)
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Nouveau tag</Label>
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Ex: newsletter"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Label className="w-full">Tags existants:</Label>
            {tags.map(tag => (
              <Badge 
                key={tag.name}
                variant="outline"
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => setNewTag(tag.name)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddTagsToSelected}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Audience (catégorie) */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentCategory?.id ? 'Modifier l\'audience' : 'Nouvelle audience'}
            </DialogTitle>
            <DialogDescription>
              Les audiences permettent de regrouper vos contacts par thématique (ex: Journalistes, Partenaires, VIP...)
            </DialogDescription>
          </DialogHeader>
          {currentCategory && (
            <div className="space-y-4">
              <div>
                <Label>Nom de l'audience *</Label>
                <Input
                  value={currentCategory.name}
                  onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                  placeholder="Ex: Journalistes, Particuliers, Les Mousquetaires..."
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={currentCategory.description || ''}
                  onChange={(e) => setCurrentCategory({...currentCategory, description: e.target.value})}
                  placeholder="Description optionnelle de cette audience"
                  rows={2}
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentCategory.color || '#3B82F6'}
                    onChange={(e) => setCurrentCategory({...currentCategory, color: e.target.value})}
                    className="w-12 h-10 rounded cursor-pointer border"
                  />
                  <div className="flex gap-2">
                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#6B7280'].map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${currentCategory.color === color ? 'border-gray-800' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setCurrentCategory({...currentCategory, color})}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveCategory}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCohesion;
