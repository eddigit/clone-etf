import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, MessageCircle, Filter, Plus, Heart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

const Cases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    category: '',
  });
  const [commentContent, setCommentContent] = useState('');
  const [showNewCaseDialog, setShowNewCaseDialog] = useState(false);

  useEffect(() => {
    fetchCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter]);

  const fetchCases = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      
      const response = await axios.get(`${API_URL}/api/cases?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCases(response.data.cases);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
      setLoading(false);
    }
  };

  const createCase = async () => {
    if (!newCase.title.trim() || !newCase.description.trim() || !newCase.category) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/cases`,
        newCase,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewCase({ title: '', description: '', category: '' });
      setShowNewCaseDialog(false);
      fetchCases();
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
    }
  };

  const viewCase = async (caseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCase(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du dossier:', error);
    }
  };

  const addComment = async () => {
    if (!commentContent.trim() || !selectedCase) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/cases/${selectedCase.id}/comments`,
        null,
        {
          params: { content: commentContent },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setCommentContent('');
      viewCase(selectedCase.id); // Recharger le dossier
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      en_cours: { label: 'En cours', className: 'bg-blue-100 text-blue-800' },
      historique: { label: 'Historique', className: 'bg-gray-100 text-gray-800' },
      gagne: { label: 'Gagné', className: 'bg-green-100 text-green-800' },
    };
    const variant = variants[status] || { label: status, className: '' };
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const getCategoryLabel = (category) => {
    const categories = {
      litige: 'Litige',
      conseil: 'Conseil',
      administratif: 'Administratif',
      juridique: 'Juridique',
      gestion: 'Gestion',
    };
    return categories[category] || category;
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dossiers Collectifs</h1>
          <p className="text-gray-600">Partagez et suivez les cas de la communauté</p>
        </div>
        <Dialog open={showNewCaseDialog} onOpenChange={setShowNewCaseDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau dossier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un nouveau dossier</DialogTitle>
              <DialogDescription>
                Partagez un cas avec la communauté pour obtenir de l'aide et des conseils
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Titre</label>
                <Input
                  placeholder="Ex: Litige avec mon bailleur"
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Catégorie</label>
                <Select
                  value={newCase.category}
                  onValueChange={(value) => setNewCase({ ...newCase, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="litige">Litige</SelectItem>
                    <SelectItem value="conseil">Conseil</SelectItem>
                    <SelectItem value="administratif">Administratif</SelectItem>
                    <SelectItem value="juridique">Juridique</SelectItem>
                    <SelectItem value="gestion">Gestion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Décrivez votre situation en détail..."
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  className="min-h-[150px]"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewCaseDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={createCase}>Créer le dossier</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="historique">Historique</SelectItem>
                <SelectItem value="gagne">Gagné</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les catégories</SelectItem>
                <SelectItem value="litige">Litige</SelectItem>
                <SelectItem value="conseil">Conseil</SelectItem>
                <SelectItem value="administratif">Administratif</SelectItem>
                <SelectItem value="juridique">Juridique</SelectItem>
                <SelectItem value="gestion">Gestion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des dossiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((caseItem) => (
          <Card
            key={caseItem.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => viewCase(caseItem.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                {getStatusBadge(caseItem.status)}
                <Badge variant="outline">{getCategoryLabel(caseItem.category)}</Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2">{caseItem.title}</CardTitle>
              <CardDescription className="line-clamp-2">{caseItem.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(caseItem.userFirstName, caseItem.userLastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">
                    {caseItem.userFirstName} {caseItem.userLastName}
                  </p>
                  <p className="text-gray-500">{formatDate(caseItem.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {caseItem.comments?.length || 0}
                  </span>
                  <span className="flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    {caseItem.likes?.length || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {cases.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Aucun dossier trouvé</p>
            <p className="text-sm text-gray-400 mt-2">Créez le premier dossier de la communauté</p>
          </CardContent>
        </Card>
      )}

      {/* Modal détail dossier */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusBadge(selectedCase.status)}
                    <Badge variant="outline">{getCategoryLabel(selectedCase.category)}</Badge>
                  </div>
                  <CardTitle className="text-2xl mb-2">{selectedCase.title}</CardTitle>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(selectedCase.userFirstName, selectedCase.userLastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium">
                        {selectedCase.userFirstName} {selectedCase.userLastName}
                      </p>
                      <p className="text-gray-500">{formatDate(selectedCase.createdAt)}</p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => setSelectedCase(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedCase.description}</p>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">
                  Commentaires ({selectedCase.comments?.length || 0})
                </h3>
                
                {/* Liste des commentaires */}
                {selectedCase.comments && selectedCase.comments.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {selectedCase.comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(comment.userFirstName, comment.userLastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm">
                              {comment.userFirstName} {comment.userLastName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ajouter un commentaire */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Partagez votre expérience ou vos conseils..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end">
                    <Button onClick={addComment} disabled={!commentContent.trim()}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Commenter
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Cases;
