import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import {
  Facebook,
  Linkedin,
  Twitter,
  Instagram,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Settings,
  TestTube,
  AlertTriangle,
  Info
} from 'lucide-react';
import API from '../../config/api';

const AdminSocialMedia = () => {
  const { toast } = useToast();
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});

  const fetchPlatforms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/admin/social-media/platforms');
      setPlatforms(response.data.platforms || []);
    } catch (error) {
      console.error('Error fetching platforms:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les plateformes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const testPlatform = async (platformId) => {
    setTesting(prev => ({ ...prev, [platformId]: true }));
    setTestResults(prev => ({ ...prev, [platformId]: null }));

    try {
      const response = await API.post('/api/admin/social-media/test', {
        platform: platformId
      });
      
      setTestResults(prev => ({
        ...prev,
        [platformId]: response.data
      }));

      if (response.data.success) {
        toast({
          title: 'Test réussi !',
          description: response.data.message
        });
      } else {
        toast({
          title: 'Test échoué',
          description: response.data.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Erreur lors du test';
      setTestResults(prev => ({
        ...prev,
        [platformId]: { success: false, message: errorMessage }
      }));
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setTesting(prev => ({ ...prev, [platformId]: false }));
    }
  };

  const getPlatformIcon = (id) => {
    const icons = {
      facebook: <Facebook className="h-8 w-8 text-blue-600" />,
      instagram: <Instagram className="h-8 w-8 text-pink-600" />,
      linkedin: <Linkedin className="h-8 w-8 text-blue-700" />,
      twitter: <Twitter className="h-8 w-8 text-sky-500" />
    };
    return icons[id] || null;
  };

  const getPlatformColor = (id) => {
    const colors = {
      facebook: 'bg-blue-50 border-blue-200',
      instagram: 'bg-gradient-to-r from-purple-50 to-pink-50 border-pink-200',
      linkedin: 'bg-blue-50 border-blue-300',
      twitter: 'bg-sky-50 border-sky-200'
    };
    return colors[id] || 'bg-gray-50';
  };

  const getPlatformDocs = (id) => {
    const docs = {
      facebook: 'https://developers.facebook.com/docs/pages/publishing',
      instagram: 'https://developers.facebook.com/docs/instagram-api',
      linkedin: 'https://docs.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/share-api',
      twitter: 'https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets'
    };
    return docs[id];
  };

  const configuredCount = platforms.filter(p => p.configured).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réseaux Sociaux</h1>
          <p className="text-gray-600">
            Configurez la publication automatique sur les réseaux sociaux
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={configuredCount > 0 ? 'default' : 'secondary'}>
            {configuredCount}/4 plateformes configurées
          </Badge>
          <Button variant="outline" onClick={fetchPlatforms} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Comment ça marche ?</h3>
              <p className="text-sm text-blue-800 mt-1">
                Lorsque vous publiez un article sur le blog et cochez "Partager sur les réseaux sociaux",
                l'article sera automatiquement posté sur les plateformes configurées.
                Vous pouvez également partager manuellement un article déjà publié.
              </p>
              <a 
                href="/SOCIAL_MEDIA_INTEGRATION.md" 
                target="_blank"
                className="text-sm text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
              >
                Voir la documentation complète
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platforms Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-gray-500">
            Chargement des plateformes...
          </div>
        ) : (
          platforms.map((platform) => (
            <Card 
              key={platform.id} 
              className={`${getPlatformColor(platform.id)} transition-all hover:shadow-md`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getPlatformIcon(platform.id)}
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      <CardDescription>
                        {platform.id === 'instagram' && 'Nécessite un compte Business lié à Facebook'}
                        {platform.id === 'facebook' && 'Publication sur la page En Toute Franchise'}
                        {platform.id === 'linkedin' && 'Publication sur la page entreprise'}
                        {platform.id === 'twitter' && 'Publication sur le compte X'}
                      </CardDescription>
                    </div>
                  </div>
                  <div>
                    {platform.configured ? (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Configuré
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        <XCircle className="h-3 w-3 mr-1" />
                        Non configuré
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Test Result */}
                {testResults[platform.id] && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    testResults[platform.id].success 
                      ? 'bg-green-100 border border-green-200' 
                      : 'bg-red-100 border border-red-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      {testResults[platform.id].success ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${
                          testResults[platform.id].success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {testResults[platform.id].message}
                        </p>
                        {testResults[platform.id].details && (
                          <pre className="text-xs mt-1 text-gray-600 overflow-auto">
                            {JSON.stringify(testResults[platform.id].details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testPlatform(platform.id)}
                    disabled={!platform.configured || testing[platform.id]}
                  >
                    {testing[platform.id] ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Test en cours...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Tester la connexion
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(getPlatformDocs(platform.id), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Documentation API
                  </Button>
                </div>

                {/* Configuration Instructions */}
                {!platform.configured && (
                  <div className="mt-4 p-3 bg-white rounded-lg border">
                    <h4 className="font-medium text-sm text-gray-900 mb-2 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Comment configurer {platform.name}
                    </h4>
                    <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                      {platform.id === 'facebook' && (
                        <>
                          <li>Créer une application sur Facebook Developers</li>
                          <li>Récupérer le Page ID depuis les paramètres de la page</li>
                          <li>Générer un Access Token avec les permissions pages_manage_posts</li>
                          <li>Ajouter FACEBOOK_PAGE_ID et FACEBOOK_ACCESS_TOKEN dans .env</li>
                        </>
                      )}
                      {platform.id === 'linkedin' && (
                        <>
                          <li>Créer une application sur LinkedIn Developers</li>
                          <li>Demander le produit "Share on LinkedIn"</li>
                          <li>Récupérer l'Organization ID depuis l'URL de la page</li>
                          <li>Générer un Access Token OAuth 2.0</li>
                          <li>Ajouter LINKEDIN_ORGANIZATION_ID et LINKEDIN_ACCESS_TOKEN dans .env</li>
                        </>
                      )}
                      {platform.id === 'twitter' && (
                        <>
                          <li>Créer un compte développeur sur Twitter</li>
                          <li>Créer une application avec permissions Read & Write</li>
                          <li>Générer les clés API et tokens d'accès</li>
                          <li>Ajouter TWITTER_BEARER_TOKEN et autres clés dans .env</li>
                        </>
                      )}
                      {platform.id === 'instagram' && (
                        <>
                          <li>Convertir le compte Instagram en compte Business/Creator</li>
                          <li>Lier le compte à une Page Facebook</li>
                          <li>Récupérer l'Instagram Account ID via Graph API</li>
                          <li>Utiliser le même token que Facebook</li>
                        </>
                      )}
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Usage Statistics (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dernières publications</CardTitle>
          <CardDescription>
            Historique des partages sur les réseaux sociaux
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">
            Les statistiques de publication seront disponibles après la première publication.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSocialMedia;
