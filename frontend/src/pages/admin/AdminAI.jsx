import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { useToast } from '../../hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Bot,
  Sparkles,
  MessageCircle,
  TrendingUp,
  Clock,
  Users,
  Send,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Mail,
  Brain,
  Activity
} from 'lucide-react';
import { API_URL } from '../../config/api';

const AdminAI = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  
  // Test de chat
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testConversationId, setTestConversationId] = useState(`admin_test_${Date.now()}`);
  
  // Assistance email
  const [emailContent, setEmailContent] = useState('');
  const [emailContext, setEmailContext] = useState('');
  const [emailResponse, setEmailResponse] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  
  // Analyse de sentiment
  const [sentimentText, setSentimentText] = useState('');
  const [sentimentResult, setSentimentResult] = useState(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);

  const token = localStorage.getItem('token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Charger les statistiques
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/ai/stats`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching AI stats:', error);
    }
  }, []);

  // Vérifier la santé du service
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/ai/health`);
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (error) {
      console.error('Error checking AI health:', error);
      setHealth({ status: 'unhealthy', error: error.message });
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), checkHealth()]);
      setLoading(false);
    };
    load();
  }, [fetchStats, checkHealth]);

  // Tester le chat IA
  const handleTestChat = async () => {
    if (!testMessage.trim()) return;
    
    setTestLoading(true);
    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          conversation_id: testConversationId,
          user_type: 'admin',
          user_info: { name: 'Admin Test' }
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setTestResponse(data.response);
        toast({ title: 'Réponse générée', description: 'L\'IA a répondu avec succès.' });
      } else {
        throw new Error('Erreur API');
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de contacter l\'IA.', variant: 'destructive' });
    } finally {
      setTestLoading(false);
    }
  };

  // Nouvelle conversation de test
  const resetTestConversation = () => {
    setTestConversationId(`admin_test_${Date.now()}`);
    setTestMessage('');
    setTestResponse('');
    toast({ title: 'Conversation réinitialisée' });
  };

  // Assistance email
  const handleEmailAssist = async () => {
    if (!emailContent.trim()) return;
    
    setEmailLoading(true);
    try {
      const res = await fetch(`${API_URL}/ai/assist-email`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          original_email: emailContent,
          context: emailContext
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setEmailResponse(data.suggested_response);
        toast({ title: 'Réponse générée', description: 'Suggestion de réponse créée.' });
      } else {
        throw new Error('Erreur API');
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible de générer la réponse.', variant: 'destructive' });
    } finally {
      setEmailLoading(false);
    }
  };

  // Analyse de sentiment
  const handleSentimentAnalysis = async () => {
    if (!sentimentText.trim()) return;
    
    setSentimentLoading(true);
    try {
      const res = await fetch(`${API_URL}/ai/analyze-sentiment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text: sentimentText })
      });
      
      if (res.ok) {
        const data = await res.json();
        setSentimentResult(data);
      } else {
        throw new Error('Erreur API');
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Impossible d\'analyser le sentiment.', variant: 'destructive' });
    } finally {
      setSentimentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="h-8 w-8 text-blue-600" />
            Intelligence Artificielle
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez Franck, l'assistant IA d'En Toute Franchise
          </p>
        </div>
        <Button onClick={() => { fetchStats(); checkHealth(); }} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statut du service */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                health?.status === 'healthy' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {health?.status === 'healthy' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Statut</p>
                <p className={`text-lg font-semibold ${
                  health?.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {health?.status === 'healthy' ? 'Opérationnel' : 'Hors ligne'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Conversations actives</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.active_conversations || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Messages aujourd'hui</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.today_messages || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total messages</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total_messages?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs defaultValue="test" className="space-y-4">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="test" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Tester le chat
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Assistance email
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Analyse sentiment
          </TabsTrigger>
          <TabsTrigger value="instructions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Instructions IA
          </TabsTrigger>
        </TabsList>

        {/* Test du chat */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                Tester le chat IA
              </CardTitle>
              <CardDescription>
                Testez les réponses de Franck en tant qu'admin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Écrivez un message de test..."
                  onKeyPress={(e) => e.key === 'Enter' && handleTestChat()}
                />
                <Button onClick={handleTestChat} disabled={testLoading || !testMessage.trim()}>
                  {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
                <Button variant="outline" onClick={resetTestConversation}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              
              {testResponse && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-800 whitespace-pre-wrap">{testResponse}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                ID conversation : {testConversationId}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assistance email */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-600" />
                Assistance à la rédaction d'emails
              </CardTitle>
              <CardDescription>
                L'IA génère une suggestion de réponse basée sur l'email reçu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email original à traiter
                </label>
                <Textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Collez ici l'email auquel vous devez répondre..."
                  rows={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contexte supplémentaire (optionnel)
                </label>
                <Input
                  value={emailContext}
                  onChange={(e) => setEmailContext(e.target.value)}
                  placeholder="Ex: C'est un nouveau membre, refuser poliment, etc."
                />
              </div>
              
              <Button 
                onClick={handleEmailAssist} 
                disabled={emailLoading || !emailContent.trim()}
                className="w-full"
              >
                {emailLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer une réponse
                  </>
                )}
              </Button>
              
              {emailResponse && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suggestion de réponse
                  </label>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <pre className="whitespace-pre-wrap text-gray-800 font-sans text-sm">
                      {emailResponse}
                    </pre>
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => navigator.clipboard.writeText(emailResponse)}
                  >
                    Copier la réponse
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analyse de sentiment */}
        <TabsContent value="sentiment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-amber-600" />
                Analyse de sentiment
              </CardTitle>
              <CardDescription>
                Analysez le ton et l'émotion d'un message pour détecter les urgences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={sentimentText}
                onChange={(e) => setSentimentText(e.target.value)}
                placeholder="Collez un message à analyser..."
                rows={4}
              />
              
              <Button 
                onClick={handleSentimentAnalysis} 
                disabled={sentimentLoading || !sentimentText.trim()}
              >
                {sentimentLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Analyser
                  </>
                )}
              </Button>
              
              {sentimentResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Sentiment</p>
                      <Badge className={`mt-1 ${
                        sentimentResult.sentiment === 'positif' ? 'bg-green-100 text-green-800' :
                        sentimentResult.sentiment === 'négatif' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {sentimentResult.sentiment}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Score</p>
                      <p className="text-lg font-semibold">{(sentimentResult.score * 100).toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Urgence</p>
                      <Badge className={`mt-1 ${
                        sentimentResult.urgence === 'haute' ? 'bg-red-100 text-red-800' :
                        sentimentResult.urgence === 'moyenne' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {sentimentResult.urgence}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Émotions</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sentimentResult.emotions?.map((emotion, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {emotion}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instructions IA */}
        <TabsContent value="instructions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Instructions système de l'IA
              </CardTitle>
              <CardDescription>
                Voici les instructions données à Franck pour répondre aux utilisateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-6 border max-h-[600px] overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    Identité : Franck
                  </h2>
                  <p>
                    Franck est l'assistant virtuel d'En Toute Franchise Association, 
                    une association française qui accompagne les commerçants, artisans 
                    et franchisés depuis plus de 30 ans.
                  </p>
                  
                  <h3 className="text-md font-semibold text-gray-800 mt-4">Caractéristiques</h3>
                  <ul>
                    <li>Professionnel, bienveillant et expert du commerce</li>
                    <li>Parle en français, ton chaleureux mais professionnel</li>
                    <li>Tutoie naturellement pour créer une proximité</li>
                    <li>Proactif : propose des solutions, suggère des actions</li>
                  </ul>
                  
                  <h3 className="text-md font-semibold text-gray-800 mt-4">Connaissances de la plateforme</h3>
                  <ul>
                    <li><strong>Adhésion Individuelle</strong> : 150€/an</li>
                    <li><strong>Adhésion Entreprise</strong> : 350€/an (5 collaborateurs)</li>
                    <li><strong>Pages</strong> : Accueil, Blog, Événements, Partenaires, Adhésion, Espace Membre, Communauté</li>
                    <li><strong>Intégrations</strong> : HelloAsso, Resend, Cloudinary</li>
                  </ul>
                  
                  <h3 className="text-md font-semibold text-gray-800 mt-4">Règles de comportement</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded">
                      <p className="font-medium text-green-800">✅ Ce qu'il FAIT</p>
                      <ul className="text-sm">
                        <li>Répond en français</li>
                        <li>Est précis sur les infos ETF</li>
                        <li>Oriente vers les bonnes pages</li>
                        <li>Encourage l'adhésion</li>
                        <li>Propose un humain si besoin</li>
                      </ul>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <p className="font-medium text-red-800">❌ Ce qu'il NE FAIT PAS</p>
                      <ul className="text-sm">
                        <li>Inventer des informations</li>
                        <li>Promettre au nom d'ETF</li>
                        <li>Conseils juridiques précis</li>
                        <li>Partager des infos confidentielles</li>
                        <li>Critiquer des entreprises</li>
                      </ul>
                    </div>
                  </div>
                  
                  <h3 className="text-md font-semibold text-gray-800 mt-4">Modèle IA utilisé</h3>
                  <p>
                    <Badge className="bg-blue-100 text-blue-800">
                      {health?.model || 'llama-3.3-70b-versatile'}
                    </Badge>
                    <span className="ml-2 text-gray-500">via Groq API</span>
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Note :</strong> Les instructions complètes sont définies dans le fichier 
                  <code className="bg-yellow-100 px-1 mx-1 rounded">backend/groq_ai_service.py</code>. 
                  Pour modifier le comportement de l'IA, éditez la variable <code className="bg-yellow-100 px-1 mx-1 rounded">SYSTEM_INSTRUCTIONS</code>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Distribution par type d'utilisateur */}
      {stats?.user_type_distribution && Object.keys(stats.user_type_distribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Distribution par type d'utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(stats.user_type_distribution).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                  <Badge variant="outline">{type}</Badge>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminAI;
