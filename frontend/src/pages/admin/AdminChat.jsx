import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  MessageCircle,
  Users,
  Clock,
  Send,
  RefreshCw,
  User,
  Check,
  CheckCheck,
  Bell,
  BellOff,
  X,
  ExternalLink,
  Activity,
  UserPlus,
  Volume2,
  VolumeX,
  Eye,
  MapPin
} from 'lucide-react';
import { API_URL } from '../../config/api';

const AdminChat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineVisitors, setOnlineVisitors] = useState([]);
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newVisitorAlert, setNewVisitorAlert] = useState(null);
  const [previousVisitorCount, setPreviousVisitorCount] = useState(0);
  const [inviteMessage, setInviteMessage] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(null);

  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const audioRef = useRef(null);

  const currentUser = {
    id: localStorage.getItem('userId'),
    firstName: localStorage.getItem('userFirstName') || 'Admin',
    lastName: localStorage.getItem('userLastName') || ''
  };

  // Jouer un son de notification
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      // Créer un son de notification avec l'API Web Audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      
      // Double bip
      setTimeout(() => {
        oscillator.frequency.value = 1000;
      }, 150);
      
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 300);
    } catch (e) {
      console.log('Audio notification not supported');
    }
  }, [soundEnabled]);

  // Charger les conversations
  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filter === 'all' 
        ? `${API_URL}/admin/chat/conversations`
        : `${API_URL}/admin/chat/conversations?status=${filter}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Charger les visiteurs en ligne
  const fetchOnlineVisitors = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/analytics/visitors/online`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const visitors = data.visitors || [];
        
        // Détecter les nouveaux visiteurs
        if (visitors.length > previousVisitorCount && previousVisitorCount > 0) {
          const newCount = visitors.length - previousVisitorCount;
          setNewVisitorAlert({
            count: newCount,
            timestamp: new Date()
          });
          playNotificationSound();
          
          // Masquer l'alerte après 10 secondes
          setTimeout(() => setNewVisitorAlert(null), 10000);
        }
        
        setPreviousVisitorCount(visitors.length);
        setOnlineVisitors(visitors);
      }
    } catch (error) {
      console.error('Error fetching online visitors:', error);
    }
  }, [previousVisitorCount, playNotificationSound]);

  // Connexion WebSocket admin
  const connectWebSocket = useCallback(() => {
    if (!currentUser.id || wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = API_URL.replace(/^https?:\/\//, '').replace('/api', '');
    const wsUrl = `${wsProtocol}//${wsHost}/ws/admin/${currentUser.id}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Admin WebSocket connected');
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          // Ajouter le message si c'est la conversation sélectionnée
          if (selectedConversation?.id === data.conversation_id) {
            setMessages(prev => [...prev, {
              ...data.message,
              timestamp: new Date(data.message.timestamp)
            }]);
          }
          // Rafraîchir la liste des conversations
          fetchConversations();
          // Son pour nouveau message
          playNotificationSound();
        } else if (data.type === 'new_conversation') {
          // Nouvelle conversation
          fetchConversations();
          // Notification sonore
          playNotificationSound();
        } else if (data.type === 'visitor_online') {
          // Nouveau visiteur en ligne
          fetchOnlineVisitors();
          playNotificationSound();
          setNewVisitorAlert({
            count: 1,
            visitor: data.visitor_id,
            timestamp: new Date()
          });
          setTimeout(() => setNewVisitorAlert(null), 10000);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Admin WebSocket disconnected');
        setIsConnected(false);
        setTimeout(connectWebSocket, 5000);
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
    }
  }, [currentUser.id, selectedConversation, fetchConversations, fetchOnlineVisitors, playNotificationSound]);

  // Inviter un visiteur à chatter
  const inviteVisitor = async (visitorId) => {
    try {
      const token = localStorage.getItem('token');
      const message = inviteMessage || "Bonjour ! Je suis conseiller chez En Toute Franchise. Puis-je vous aider dans vos recherches sur la franchise ?";
      
      const response = await fetch(`${API_URL}/admin/chat/invite/${visitorId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });
      
      if (response.ok) {
        const data = await response.json();
        setShowInviteModal(null);
        setInviteMessage('');
        fetchConversations();
        
        // Sélectionner automatiquement la nouvelle conversation
        if (data.conversation) {
          setSelectedConversation(data.conversation);
        }
      }
    } catch (error) {
      console.error('Error inviting visitor:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchOnlineVisitors();
    connectWebSocket();

    const interval = setInterval(() => {
      fetchConversations();
      fetchOnlineVisitors();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchConversations, fetchOnlineVisitors, connectWebSocket]);

  // Charger les messages quand on sélectionne une conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) return;

      try {
        const response = await fetch(
          `${API_URL}/chat/conversations/${selectedConversation.id}/messages`
        );
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();
  }, [selectedConversation]);

  // Scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const assignConversation = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/admin/chat/conversations/${conversationId}/assign`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      if (response.ok) {
        fetchConversations();
      }
    } catch (error) {
      console.error('Error assigning conversation:', error);
    }
  };

  const closeConversation = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(
        `${API_URL}/admin/chat/conversations/${conversationId}/close`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      setSelectedConversation(null);
      fetchConversations();
    } catch (error) {
      console.error('Error closing conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedConversation) return;

    const messageContent = inputValue.trim();
    setInputValue('');

    // Envoyer via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        conversation_id: selectedConversation.id,
        content: messageContent,
        sender_name: `${currentUser.firstName} ${currentUser.lastName}`
      }));
    }

    // Aussi via API
    try {
      await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConversation.id,
          sender_type: 'admin',
          sender_id: currentUser.id,
          sender_name: `${currentUser.firstName} ${currentUser.lastName}`,
          content: messageContent
        })
      });

      setMessages(prev => [...prev, {
        id: Date.now(),
        content: messageContent,
        sender_type: 'admin',
        sender_id: currentUser.id,
        sender_name: `${currentUser.firstName} ${currentUser.lastName}`,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'closed':
        return <Badge variant="secondary">Fermé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const waitingCount = conversations.filter(c => c.status === 'waiting').length;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col">
      {/* Alerte nouveau visiteur */}
      {newVisitorAlert && (
        <div className="absolute top-20 right-4 z-50 animate-bounce">
          <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">
                {newVisitorAlert.count === 1 ? 'Nouveau visiteur !' : `${newVisitorAlert.count} nouveaux visiteurs !`}
              </p>
              <p className="text-sm text-green-100">Cliquez pour voir et inviter à chatter</p>
            </div>
            <button onClick={() => setNewVisitorAlert(null)} className="ml-2 hover:bg-white/20 p-1 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal d'invitation */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Inviter le visiteur à chatter
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Ce visiteur consulte : <strong>{showInviteModal.current_page || 'Page inconnue'}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message d'invitation (optionnel)
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Bonjour ! Je suis conseiller chez En Toute Franchise. Puis-je vous aider dans vos recherches sur la franchise ?"
                className="w-full border rounded-lg p-3 text-sm min-h-[100px] focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setShowInviteModal(null); setInviteMessage(''); }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => inviteVisitor(showInviteModal.id)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Inviter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link to="/admin" className="hover:text-blue-600">Admin</Link>
              <span>/</span>
              <span>Chat en direct</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              Chat en direct
              {waitingCount > 0 && (
                <Badge className="bg-red-500 text-white ml-2">
                  {waitingCount} en attente
                </Badge>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Toggle son */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={soundEnabled ? 'Désactiver les notifications sonores' : 'Activer les notifications sonores'}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </div>
            <Button variant="outline" onClick={() => { fetchConversations(); fetchOnlineVisitors(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Liste des conversations */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          {/* Filtres */}
          <div className="p-3 border-b bg-white">
            <div className="flex gap-1">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'waiting', label: 'En attente' },
                { id: 'active', label: 'Actifs' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex-1 px-3 py-1.5 text-sm rounded ${
                    filter === f.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visiteurs en ligne */}
          {onlineVisitors.length > 0 && (
            <div className="border-b bg-green-50 max-h-64 overflow-y-auto">
              <div className="p-3 sticky top-0 bg-green-50 border-b border-green-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                    <Activity className="h-4 w-4 animate-pulse" />
                    {onlineVisitors.length} visiteur(s) en ligne
                  </div>
                  <Badge className="bg-green-600 text-white text-xs">LIVE</Badge>
                </div>
              </div>
              <div className="divide-y divide-green-100">
                {onlineVisitors.map((visitor, index) => (
                  <div 
                    key={visitor.id || index} 
                    className="p-3 hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center">
                            <Eye className="h-3 w-3 text-green-700" />
                          </div>
                          <span className="text-xs font-medium text-green-800">
                            Visiteur {(visitor.id || '').slice(0, 6)}...
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-600 truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{visitor.current_page || 'Page inconnue'}</span>
                        </div>
                        {visitor.device_type && (
                          <div className="text-xs text-green-500 mt-1">
                            {visitor.device_type} • {visitor.browser || 'Navigateur inconnu'}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowInviteModal(visitor);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-auto"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Inviter
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>Aucune conversation</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-3 border-b cursor-pointer hover:bg-white transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-white border-l-4 border-l-blue-600' : ''
                  } ${conv.status === 'waiting' ? 'bg-yellow-50' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{conv.visitor_name || 'Visiteur'}</p>
                        <p className="text-xs text-gray-500">
                          {conv.visitor_page || 'Page inconnue'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(conv.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(conv.started_at)}
                    </span>
                    <span>{conv.messages_count} msg</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zone de chat */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Header conversation */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.visitor_name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      {selectedConversation.visitor_page}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedConversation.status === 'waiting' && (
                    <Button 
                      onClick={() => assignConversation(selectedConversation.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Prendre en charge
                    </Button>
                  )}
                  {selectedConversation.status !== 'closed' && (
                    <Button 
                      variant="outline"
                      onClick={() => closeConversation(selectedConversation.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Fermer
                    </Button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id || message._id}
                    className={`flex ${
                      message.sender_type === 'admin' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.sender_type === 'system' ? (
                      <div className="bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg text-center w-full">
                        {message.content}
                      </div>
                    ) : (
                      <div
                        className={`max-w-[70%] ${
                          message.sender_type === 'admin'
                            ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg'
                            : 'bg-white text-gray-800 rounded-r-lg rounded-tl-lg shadow-sm'
                        } px-4 py-2`}
                      >
                        {message.sender_type === 'visitor' && (
                          <p className="text-xs text-gray-500 mb-1">
                            {message.sender_name}
                          </p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 flex items-center gap-1 ${
                          message.sender_type === 'admin' ? 'text-blue-100' : 'text-gray-400'
                        }`}>
                          {formatTime(message.timestamp)}
                          {message.sender_type === 'admin' && (
                            message.is_read ? 
                              <CheckCheck className="h-3 w-3" /> : 
                              <Check className="h-3 w-3" />
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {selectedConversation.status !== 'closed' && (
                <div className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Votre réponse..."
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!inputValue.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Sélectionnez une conversation</p>
                <p className="text-sm text-gray-400 mt-1">
                  ou attendez qu'un visiteur démarre un chat
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChat;
