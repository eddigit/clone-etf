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
  X,
  ExternalLink,
  Activity
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

  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  const currentUser = {
    id: localStorage.getItem('userId'),
    firstName: localStorage.getItem('userFirstName') || 'Admin',
    lastName: localStorage.getItem('userLastName') || ''
  };

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
        setOnlineVisitors(data.visitors || []);
      }
    } catch (error) {
      console.error('Error fetching online visitors:', error);
    }
  }, []);

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
        } else if (data.type === 'new_conversation') {
          // Nouvelle conversation
          fetchConversations();
          // Notification sonore (optionnel)
          try {
            new Audio('/notification.mp3').play().catch(() => {});
          } catch (e) {}
        } else if (data.type === 'visitor_online') {
          fetchOnlineVisitors();
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
  }, [currentUser.id, selectedConversation, fetchConversations, fetchOnlineVisitors]);

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
            <div className="p-3 border-b bg-green-50">
              <div className="flex items-center gap-2 text-sm text-green-700 font-medium mb-2">
                <Activity className="h-4 w-4" />
                {onlineVisitors.length} visiteur(s) en ligne
              </div>
              <div className="space-y-1">
                {onlineVisitors.slice(0, 3).map((visitor, index) => (
                  <div key={index} className="text-xs text-green-600 truncate">
                    • {visitor.current_page || 'Page inconnue'}
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
