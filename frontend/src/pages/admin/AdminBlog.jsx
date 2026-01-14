import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  FileText,
  Image,
  Upload,
  X,
  ExternalLink,
  Calendar,
  Clock,
  User,
  Tag,
  RefreshCw,
  Share2,
  Facebook,
  Linkedin,
  Twitter,
  Instagram
} from 'lucide-react';
import API from '../../config/api';
import RichTextEditor from '../../components/admin/RichTextEditor';

const API_URL = process.env.REACT_APP_API_URL || 'https://clone-etf.onrender.com';

const AdminBlog = () => {
  const { toast } = useToast();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // Modal states
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    category: '',
    tags: '',
    author: '',
    status: 'draft',
    publishTo: ['public'],  // Canaux de diffusion
    metaTitle: '',
    metaDescription: '',
    shareToSocial: false,
    socialPlatforms: ['facebook', 'linkedin', 'twitter']
  });

  // Social media platforms state
  const [socialPlatforms, setSocialPlatforms] = useState([]);
  const [loadingSocialPlatforms, setLoadingSocialPlatforms] = useState(false);

  // Fetch social media platforms configuration
  const fetchSocialPlatforms = useCallback(async () => {
    try {
      setLoadingSocialPlatforms(true);
      const response = await API.get('/api/admin/social-media/platforms');
      setSocialPlatforms(response.data.platforms || []);
    } catch (error) {
      console.error('Error fetching social platforms:', error);
    } finally {
      setLoadingSocialPlatforms(false);
    }
  }, []);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await API.get(`/api/admin/articles?${params.toString()}`);
      setArticles(response.data.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les articles',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, categoryFilter, toast]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await API.get('/api/articles/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchCategories();
    fetchSocialPlatforms();
  }, [fetchArticles, fetchSocialPlatforms]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      category: '',
      tags: '',
      author: '',
      status: 'draft',
      publishTo: ['public'],
      metaTitle: '',
      metaDescription: '',
      shareToSocial: false,
      socialPlatforms: ['facebook', 'linkedin', 'twitter']
    });
    setEditingArticle(null);
  };

  // Open editor for new article
  const handleNewArticle = () => {
    resetForm();
    setShowEditor(true);
  };

  // Open editor for existing article
  const handleEdit = async (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title || '',
      slug: article.slug || '',
      excerpt: article.excerpt || '',
      content: article.content || '',
      featuredImage: article.featuredImage || '',
      category: article.category || '',
      tags: article.tags ? article.tags.join(', ') : '',
      author: article.author || '',
      status: article.status || 'draft',
      publishTo: article.publishTo || ['public'],
      metaTitle: article.metaTitle || '',
      metaDescription: article.metaDescription || ''
    });
    setShowEditor(true);
  };

  // Save article (create or update)
  const handleSave = async () => {
    if (!formData.title || !formData.excerpt || !formData.content || !formData.category) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir le titre, le resume, le contenu et la categorie',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : []
      };

      if (editingArticle) {
        await API.put(`/api/admin/articles/${editingArticle.id}`, payload);
        toast({
          title: 'Article mis a jour',
          description: 'Les modifications ont ete enregistrees'
        });
      } else {
        await API.post('/api/admin/articles', payload);
        toast({
          title: 'Article cree',
          description: 'L\'article a ete cree avec succes'
        });
      }

      setShowEditor(false);
      resetForm();
      fetchArticles();
      fetchCategories();
    } catch (error) {
      console.error('Error saving article:', error);
      console.error('Error details:', error.response?.data);
      
      let errorMessage = 'Impossible de sauvegarder l\'article';
      
      if (error.response?.status === 403) {
        errorMessage = 'Accès refusé. Vérifiez que vous êtes bien administrateur.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete article
  const handleDelete = async (article) => {
    if (!window.confirm(`Supprimer l'article "${article.title}" ?`)) return;

    try {
      await API.delete(`/api/admin/articles/${article.id}`);
      toast({
        title: 'Article supprime',
        description: 'L\'article a ete supprime'
      });
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'article',
        variant: 'destructive'
      });
    }
  };

  // Publish/Unpublish article
  const handleTogglePublish = async (article) => {
    try {
      if (article.status === 'published') {
        await API.post(`/api/admin/articles/${article.id}/unpublish`);
        toast({ title: 'Article depublie' });
      } else {
        await API.post(`/api/admin/articles/${article.id}/publish`);
        toast({ title: 'Article publie' });
      }
      fetchArticles();
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive'
      });
    }
  };

  // Duplicate article
  const handleDuplicate = async (article) => {
    try {
      await API.post(`/api/admin/articles/${article.id}/duplicate`);
      toast({
        title: 'Article duplique',
        description: 'Une copie de l\'article a ete creee'
      });
      fetchArticles();
    } catch (error) {
      console.error('Error duplicating article:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de dupliquer l\'article',
        variant: 'destructive'
      });
    }
  };

  // Share to social media
  const [sharingArticle, setSharingArticle] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedSharePlatforms, setSelectedSharePlatforms] = useState(['facebook', 'linkedin', 'twitter']);
  const [sharing, setSharing] = useState(false);

  const handleShareToSocial = async () => {
    if (!sharingArticle) return;
    
    try {
      setSharing(true);
      const response = await API.post(`/api/admin/articles/${sharingArticle.id}/share-social`, {
        platforms: selectedSharePlatforms
      });
      
      const results = response.data.results;
      const successCount = Object.values(results).filter(r => r.success).length;
      const failCount = Object.values(results).filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast({
          title: 'Article partagé !',
          description: `Publié sur ${successCount} réseau(x)${failCount > 0 ? `, ${failCount} échec(s)` : ''}`
        });
      } else {
        toast({
          title: 'Échec du partage',
          description: 'Vérifiez la configuration des réseaux sociaux',
          variant: 'destructive'
        });
      }
      
      setShowShareModal(false);
      setSharingArticle(null);
    } catch (error) {
      console.error('Error sharing to social media:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de partager sur les réseaux sociaux',
        variant: 'destructive'
      });
    } finally {
      setSharing(false);
    }
  };

  const openShareModal = (article) => {
    setSharingArticle(article);
    setShowShareModal(true);
  };

  // Upload image
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await API.post('/api/admin/articles/upload-image', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData(prev => ({ ...prev, featuredImage: response.data.url }));
      toast({ title: 'Image uploadee' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader l\'image',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: <Badge variant="secondary">Brouillon</Badge>,
      published: <Badge className="bg-green-600">Publie</Badge>,
      archived: <Badge variant="outline">Archive</Badge>
    };
    return badges[status] || <Badge variant="secondary">{status}</Badge>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion du Blog</h1>
          <p className="text-gray-600">Creez et gerez les articles du blog</p>
        </div>
        <Button onClick={handleNewArticle} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouvel article
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-gray-900"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md min-w-[150px] text-gray-900 bg-white"
            >
              <option value="">Tous les statuts</option>
              <option value="draft">Brouillons</option>
              <option value="published">Publies</option>
              <option value="archived">Archives</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-md min-w-[150px] text-gray-900 bg-white"
            >
              <option value="">Toutes les categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter(''); setCategoryFilter(''); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Articles ({articles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Aucun article trouve</p>
              <Button onClick={handleNewArticle} className="mt-4">
                Creer votre premier article
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Image */}
                  <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {article.featuredImage ? (
                      <img
                        src={article.featuredImage}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 truncate">{article.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-1">{article.excerpt}</p>
                      </div>
                      {getStatusBadge(article.status)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {article.category}
                      </span>
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {article.author}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(article.publishedAt || article.createdAt)}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {article.readTime}
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {article.views || 0} vues
                      </span>
                    </div>
                    {/* Canaux de diffusion */}
                    <div className="flex items-center gap-1 mt-2">
                      {article.publishTo?.includes('public') && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Public</Badge>
                      )}
                      {article.publishTo?.includes('members') && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Adherents</Badge>
                      )}
                      {article.publishTo?.includes('featured') && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Accueil</Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(article)}
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTogglePublish(article)}
                      title={article.status === 'published' ? 'Depublier' : 'Publier'}
                    >
                      {article.status === 'published' ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDuplicate(article)}
                      title="Dupliquer"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {article.status === 'published' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/blog/${article.slug}`, '_blank')}
                        title="Voir"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    {article.status === 'published' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openShareModal(article)}
                        title="Partager sur les réseaux sociaux"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(article)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor Modal */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? 'Modifier l\'article' : 'Nouvel article'}
            </DialogTitle>
            <DialogDescription>
              {editingArticle ? 'Modifiez les informations de l\'article' : 'Créez un nouvel article pour votre blog'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Titre *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre de l'article"
                className="text-gray-900"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Slug (URL)</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="mon-article (genere automatiquement si vide)"
                className="text-gray-900"
              />
              <p className="text-xs text-gray-600 mt-1">
                URL: /blog/{formData.slug || 'mon-article'}
              </p>
            </div>

            {/* Category & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Categorie *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
                  required
                >
                  <option value="">Selectionner une categorie</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Statut</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md text-gray-900 bg-white"
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publie</option>
                  <option value="archived">Archive</option>
                </select>
              </div>
            </div>

            {/* Canaux de diffusion */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="block text-sm font-medium mb-3 text-blue-900">
                Ou diffuser cet article ? (selectionnez un ou plusieurs)
              </label>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.publishTo.includes('public')}
                    onChange={(e) => {
                      const newChannels = e.target.checked
                        ? [...formData.publishTo, 'public']
                        : formData.publishTo.filter(c => c !== 'public');
                      setFormData(prev => ({ ...prev, publishTo: newChannels }));
                    }}
                    className="mt-1 h-4 w-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Blog public (visiteurs)</span>
                    <p className="text-xs text-gray-500">Visible par tous sur la page /blog</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.publishTo.includes('members')}
                    onChange={(e) => {
                      const newChannels = e.target.checked
                        ? [...formData.publishTo, 'members']
                        : formData.publishTo.filter(c => c !== 'members');
                      setFormData(prev => ({ ...prev, publishTo: newChannels }));
                    }}
                    className="mt-1 h-4 w-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Espace adherents uniquement</span>
                    <p className="text-xs text-gray-500">Reserve aux membres connectes avec adhesion active</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.publishTo.includes('featured')}
                    onChange={(e) => {
                      const newChannels = e.target.checked
                        ? [...formData.publishTo, 'featured']
                        : formData.publishTo.filter(c => c !== 'featured');
                      setFormData(prev => ({ ...prev, publishTo: newChannels }));
                    }}
                    className="mt-1 h-4 w-4 text-blue-600 rounded"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Mise en avant (page d'accueil)</span>
                    <p className="text-xs text-gray-500">Affiche dans la section "Actualites" de la page d'accueil</p>
                  </div>
                </label>
              </div>
              {formData.publishTo.length === 0 && (
                <p className="text-xs text-orange-600 mt-2">
                  Attention: Aucun canal selectionne. L'article ne sera visible nulle part.
                </p>
              )}
            </div>

            {/* Partage Réseaux Sociaux */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="h-5 w-5 text-blue-600" />
                <label className="block text-sm font-medium text-gray-900">
                  Partager sur les réseaux sociaux
                </label>
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={formData.shareToSocial}
                  onChange={(e) => setFormData(prev => ({ ...prev, shareToSocial: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">
                  Publier automatiquement sur les réseaux sociaux à la publication
                </span>
              </label>

              {formData.shareToSocial && (
                <div className="space-y-2 pl-7">
                  <p className="text-xs text-gray-500 mb-2">Sélectionnez les plateformes :</p>
                  <div className="grid grid-cols-2 gap-2">
                    {socialPlatforms.map((platform) => (
                      <label 
                        key={platform.id} 
                        className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                          formData.socialPlatforms.includes(platform.id)
                            ? 'bg-blue-100 border-blue-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        } ${!platform.configured ? 'opacity-50' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.socialPlatforms.includes(platform.id)}
                          onChange={(e) => {
                            const newPlatforms = e.target.checked
                              ? [...formData.socialPlatforms, platform.id]
                              : formData.socialPlatforms.filter(p => p !== platform.id);
                            setFormData(prev => ({ ...prev, socialPlatforms: newPlatforms }));
                          }}
                          disabled={!platform.configured}
                          className="h-3 w-3 text-blue-600 rounded"
                        />
                        {platform.id === 'facebook' && <Facebook className="h-4 w-4 text-blue-600" />}
                        {platform.id === 'instagram' && <Instagram className="h-4 w-4 text-pink-600" />}
                        {platform.id === 'linkedin' && <Linkedin className="h-4 w-4 text-blue-700" />}
                        {platform.id === 'twitter' && <Twitter className="h-4 w-4 text-sky-500" />}
                        <span className="text-sm">{platform.name}</span>
                        {!platform.configured && (
                          <span className="text-xs text-orange-500">(non configuré)</span>
                        )}
                      </label>
                    ))}
                  </div>
                  {formData.status !== 'published' && (
                    <p className="text-xs text-orange-600 mt-2">
                      ⚠️ Le partage se fera uniquement si le statut est "Publié"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Image principale</label>
              <div className="flex gap-2">
                <Input
                  value={formData.featuredImage}
                  onChange={(e) => setFormData(prev => ({ ...prev, featuredImage: e.target.value }))}
                  placeholder="URL de l'image ou uploader"
                  className="flex-1 text-gray-900"
                />
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </span>
                  </Button>
                </label>
              </div>
              {formData.featuredImage && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={formData.featuredImage.startsWith('http') ? formData.featuredImage : `${API_URL}${formData.featuredImage}`}
                    alt="Preview"
                    className="h-24 rounded-lg object-cover"
                    onError={(e) => {
                      console.error('Error loading preview image:', formData.featuredImage);
                      e.target.style.display = 'none';
                    }}
                  />
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, featuredImage: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Resume *</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Court resume de l'article (affiche dans les listes)"
                className="w-full px-3 py-2 border rounded-md min-h-[80px] text-gray-900 bg-white"
                maxLength={300}
              />
              <p className="text-xs text-gray-600 mt-1">
                {formData.excerpt.length}/300 caracteres
              </p>
            </div>

            {/* Content - Éditeur Riche Premium */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900">Contenu de l'article *</label>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                placeholder="Rédigez votre article ici... Utilisez la barre d'outils pour mettre en forme votre texte, ajouter des liens, des images, etc."
                minHeight="450px"
              />
            </div>

            {/* Author & Tags */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Auteur</label>
                <Input
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Nom de l'auteur (defaut: vous)"
                  className="text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Tags (separes par virgule)</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="franchise, juridique, conseil..."
                  className="text-gray-900"
                />
              </div>
            </div>

            {/* SEO */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 text-gray-900">SEO (optionnel)</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">Meta titre</label>
                  <Input
                    value={formData.metaTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                    placeholder="Titre pour les moteurs de recherche"
                    maxLength={70}
                    className="text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">Meta description</label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                    placeholder="Description pour les moteurs de recherche"
                    className="w-full px-3 py-2 border rounded-md min-h-[60px] text-gray-900 bg-white"
                    maxLength={160}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement...' : (editingArticle ? 'Mettre a jour' : 'Creer l\'article')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de partage réseaux sociaux */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-600" />
              Partager sur les réseaux sociaux
            </DialogTitle>
            <DialogDescription>
              {sharingArticle && `Partager "${sharingArticle.title}" sur les réseaux sociaux`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">Sélectionnez les plateformes :</p>
            
            <div className="grid grid-cols-2 gap-3">
              {socialPlatforms.map((platform) => (
                <label 
                  key={platform.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSharePlatforms.includes(platform.id)
                      ? 'bg-blue-50 border-blue-400'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } ${!platform.configured ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSharePlatforms.includes(platform.id)}
                    onChange={(e) => {
                      const newPlatforms = e.target.checked
                        ? [...selectedSharePlatforms, platform.id]
                        : selectedSharePlatforms.filter(p => p !== platform.id);
                      setSelectedSharePlatforms(newPlatforms);
                    }}
                    disabled={!platform.configured}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    {platform.id === 'facebook' && <Facebook className="h-5 w-5 text-blue-600" />}
                    {platform.id === 'instagram' && <Instagram className="h-5 w-5 text-pink-600" />}
                    {platform.id === 'linkedin' && <Linkedin className="h-5 w-5 text-blue-700" />}
                    {platform.id === 'twitter' && <Twitter className="h-5 w-5 text-sky-500" />}
                    <span className="font-medium">{platform.name}</span>
                  </div>
                  {!platform.configured && (
                    <span className="text-xs text-orange-500 ml-auto">Non configuré</span>
                  )}
                </label>
              ))}
            </div>

            {selectedSharePlatforms.length === 0 && (
              <p className="text-sm text-orange-600">
                Veuillez sélectionner au moins une plateforme
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleShareToSocial} 
              disabled={sharing || selectedSharePlatforms.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sharing ? 'Publication...' : 'Publier maintenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlog;
