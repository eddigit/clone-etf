import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  User,
  Clock
} from 'lucide-react';
import { API_URL } from '../config/api';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [conversation, setConversation] = useState(null);
  const [visitorId, setVisitorId] = useState(null);
  const [visitorName, setVisitorName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  // Générer ou récupérer l'ID visiteur
  useEffect(() => {
    let storedId = localStorage.getItem('etf_visitor_id');
    if (!storedId) {
      storedId = 'visitor_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('etf_visitor_id', storedId);
    }
    setVisitorId(storedId);

    // Récupérer le nom s'il existe
    const storedName = localStorage.getItem('etf_visitor_name');
    if (storedName) {
      setVisitorName(storedName);
      setShowNameInput(false);
    }
  }, []);

  // Connexion WebSocket
  const connectWebSocket = useCallback(() => {
    if (!visitorId || wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = API_URL.replace(/^https?:\/\//, '').replace('/api', '');
    const wsUrl = `${wsProtocol}//${wsHost}/ws/visitor/${visitorId}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Chat WebSocket connected');
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          setMessages(prev => [...prev, {
            ...data.message,
            timestamp: new Date(data.message.timestamp)
          }]);
          
          if (!isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        } else if (data.type === 'admin_joined') {
          setMessages(prev => [...prev, {
            id: Date.now(),
            content: `${data.admin_name} a rejoint la conversation`,
            sender_type: 'system',
            timestamp: new Date()
          }]);
        } else if (data.type === 'conversation_closed') {
          setMessages(prev => [...prev, {
            id: Date.now(),
            content: 'La conversation a été fermée. Merci de nous avoir contactés !',
            sender_type: 'system',
            timestamp: new Date()
          }]);
          setConversation(null);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Chat WebSocket disconnected');
        setIsConnected(false);
        // Reconnecter après 5 secondes
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
    }
  }, [visitorId, isOpen]);

  useEffect(() => {
    if (isOpen && visitorId) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen, visitorId, connectWebSocket]);

  // Scroll vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset unread count quand on ouvre le chat
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const startConversation = async () => {
    if (!visitorName.trim()) return;

    localStorage.setItem('etf_visitor_name', visitorName);
    setShowNameInput(false);

    try {
      const response = await fetch(`${API_URL}/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_id: visitorId,
          visitor_name: visitorName,
          current_page: window.location.pathname
        })
      });

      if (response.ok) {
        const data = await response.json();
        setConversation(data.conversation);
        
        // Charger les messages existants si conversation existante
        if (data.existing && data.conversation?.id) {
          const messagesRes = await fetch(
            `${API_URL}/chat/conversations/${data.conversation.id}/messages`
          );
          if (messagesRes.ok) {
            const messagesData = await messagesRes.json();
            setMessages(messagesData.messages || []);
          }
        } else {
          // Message de bienvenue
          setMessages([{
            id: 'welcome',
            content: 'Bienvenue ! Un conseiller va vous répondre dans quelques instants. Comment pouvons-nous vous aider ?',
            sender_type: 'system',
            timestamp: new Date()
          }]);
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !conversation) return;

    const messageContent = inputValue.trim();
    setInputValue('');

    // Envoyer via WebSocket si connecté
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        conversation_id: conversation.id,
        content: messageContent,
        sender_name: visitorName
      }));
    }

    // Aussi envoyer via API pour persistence
    try {
      await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.id,
          sender_type: 'visitor',
          sender_id: visitorId,
          sender_name: visitorName,
          content: messageContent
        })
      });

      // Ajouter le message localement
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: messageContent,
        sender_type: 'visitor',
        sender_id: visitorId,
        sender_name: visitorName,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showNameInput) {
        startConversation();
      } else {
        sendMessage();
      }
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Bouton flottant */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-600 hover:bg-green-700 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 group"
        >
          <MessageCircle className="h-7 w-7 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
          <span className="absolute right-full mr-3 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Besoin d'aide ?
          </span>
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all ${
            isMinimized ? 'h-16' : 'h-[500px]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <img
                  src="https://aide.en-toutefranchise.com/lovable-uploads/19dabfce-86c9-4793-beb5-bcf6cb7b9e7b.png"
                  alt="ETF"
                  className="w-7 h-7 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h3 className="font-semibold">En Toute Franchise</h3>
                <div className="flex items-center gap-1 text-xs text-green-100">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-300' : 'bg-gray-400'}`} />
                  {isConnected ? 'En ligne' : 'Connexion...'}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Zone de messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {showNameInput ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-gray-600 mb-4">
                        👋 Bonjour ! Comment pouvons-nous vous aider aujourd'hui ?
                      </p>
                      <p className="text-sm text-gray-500 mb-3">
                        Entrez votre prénom pour démarrer la conversation :
                      </p>
                      <Input
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Votre prénom..."
                        className="mb-3"
                      />
                      <Button
                        onClick={startConversation}
                        disabled={!visitorName.trim()}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Démarrer la conversation
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_type === 'visitor' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.sender_type === 'system' ? (
                          <div className="bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg text-center w-full">
                            {message.content}
                          </div>
                        ) : (
                          <div
                            className={`max-w-[80%] ${
                              message.sender_type === 'visitor'
                                ? 'bg-green-600 text-white rounded-l-lg rounded-tr-lg'
                                : 'bg-white text-gray-800 rounded-r-lg rounded-tl-lg shadow-sm'
                            } px-4 py-2`}
                          >
                            {message.sender_type === 'admin' && (
                              <p className="text-xs text-gray-500 mb-1">
                                {message.sender_name}
                              </p>
                            )}
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_type === 'visitor' ? 'text-green-100' : 'text-gray-400'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Zone de saisie */}
              {!showNameInput && (
                <div className="p-4 bg-white border-t">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Votre message..."
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!inputValue.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Propulsé par En Toute Franchise
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
