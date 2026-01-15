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
  Bot,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { API_URL } from '../config/api';
import ReactMarkdown from 'react-markdown';

/**
 * ChatAIWidget - Widget de chat intelligent avec IA Groq
 * 
 * Ce widget permet aux visiteurs et membres de discuter avec Franck,
 * l'assistant IA d'En Toute Franchise.
 * 
 * Props:
 * - userType: 'visitor' | 'member' | 'admin' - Type d'utilisateur
 * - userInfo: { name, email, ... } - Infos utilisateur (optionnel)
 * - defaultOpen: boolean - Ouvrir le chat par défaut
 */
const ChatAIWidget = ({ 
  userType = 'visitor', 
  userInfo = null,
  defaultOpen = false 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Générer ou récupérer l'ID de conversation
  useEffect(() => {
    let storedId = sessionStorage.getItem('etf_ai_conversation_id');
    if (!storedId) {
      storedId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('etf_ai_conversation_id', storedId);
    }
    setConversationId(storedId);
    
    // Récupérer les messages stockés en session
    const storedMessages = sessionStorage.getItem('etf_ai_messages');
    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages));
      } catch (e) {
        console.error('Error parsing stored messages:', e);
      }
    }
  }, []);

  // Sauvegarder les messages en session
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('etf_ai_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset unread count quand on ouvre le chat
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Message de bienvenue au premier affichage
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = userInfo?.name 
        ? `Bonjour ${userInfo.name} ! 👋 Je suis Franck, l'assistant virtuel d'En Toute Franchise. Comment puis-je t'aider aujourd'hui ?`
        : `Bonjour ! 👋 Je suis Franck, l'assistant virtuel d'En Toute Franchise. Que tu sois commerçant, artisan ou franchisé, je suis là pour répondre à tes questions. Comment puis-je t'aider ?`;
      
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, messages.length, userInfo?.name]);

  // Jouer un son de notification
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.15;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.frequency.value = 1000;
      }, 80);
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 150);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  // Envoyer un message à l'IA
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setError(null);

    // Ajouter le message utilisateur
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);
    
    // Afficher l'indicateur de chargement
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: conversationId,
          user_type: userType,
          user_info: userInfo,
          context: detectContext(userMessage)
        })
      });

      if (!response.ok) {
        throw new Error('Erreur de communication avec l\'IA');
      }

      const data = await response.json();
      
      // Ajouter la réponse de l'IA
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(data.timestamp)
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Notification si chat fermé
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Désolé, je rencontre un problème. Réessaie dans quelques instants.');
      
      // Ajouter un message d'erreur
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Désolé, je rencontre un petit problème technique. 😅 Tu peux réessayer ou nous contacter à contact@intoutefranchise.com',
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Détecter le contexte de la question
  const detectContext = (message) => {
    const lower = message.toLowerCase();
    
    if (lower.includes('adhésion') || lower.includes('adherer') || lower.includes('membre') || lower.includes('prix') || lower.includes('tarif') || lower.includes('inscription')) {
      return 'adhesion';
    }
    if (lower.includes('événement') || lower.includes('formation') || lower.includes('webinaire') || lower.includes('rencontre')) {
      return 'events';
    }
    if (lower.includes('partenaire') || lower.includes('réduction') || lower.includes('offre')) {
      return 'partners';
    }
    if (lower.includes('problème') || lower.includes('bug') || lower.includes('marche pas') || lower.includes('erreur') || lower.includes('connexion')) {
      return 'support';
    }
    if (lower.includes('forum') || lower.includes('communauté') || lower.includes('mousquetaire') || lower.includes('discussion')) {
      return 'community';
    }
    if (lower.includes('juridique') || lower.includes('contrat') || lower.includes('avocat') || lower.includes('litige')) {
      return 'legal';
    }
    
    return 'general';
  };

  // Nouvelle conversation
  const resetConversation = () => {
    const newId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('etf_ai_conversation_id', newId);
    sessionStorage.removeItem('etf_ai_messages');
    setConversationId(newId);
    setMessages([]);
    setError(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 group"
          title="Discuter avec Franck, notre assistant IA"
        >
          <div className="relative">
            <MessageCircle className="h-7 w-7 text-white" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-pulse" />
          </div>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-bounce">
              {unreadCount}
            </span>
          )}
          {/* Tooltip */}
          <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Besoin d'aide ? 💬
          </span>
        </button>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div 
          className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${
            isMinimized 
              ? 'w-80 h-16' 
              : 'w-96 h-[600px] max-h-[80vh]'
          }`}
          style={{ 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)' 
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-2xl cursor-pointer"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
              </div>
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  Franck
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                </h3>
                <p className="text-xs text-blue-100">Assistant IA • En ligne</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); resetConversation(); }}
                className="text-white/80 hover:text-white hover:bg-white/10"
                title="Nouvelle conversation"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Corps du chat */}
          {!isMinimized && (
            <>
              {/* Zone de messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-blue-600' 
                          : message.isError 
                            ? 'bg-red-100' 
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className={`h-4 w-4 ${message.isError ? 'text-red-500' : 'text-white'}`} />
                        )}
                      </div>
                      
                      {/* Bulle de message */}
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : message.isError
                            ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-sm'
                            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                      }`}>
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                a: ({ href, children }) => (
                                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                                    {children}
                                  </a>
                                ),
                                ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                                li: ({ children }) => <li className="mb-1">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                        <span className={`text-xs mt-1 block ${
                          message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                        }`}>
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Indicateur de frappe */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-2 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Zone de saisie */}
              <div className="p-4 border-t bg-white rounded-b-2xl">
                {error && (
                  <div className="mb-2 p-2 bg-red-50 text-red-600 text-xs rounded-lg">
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Écris ton message..."
                    disabled={isLoading}
                    className="flex-1 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-4"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Propulsé par IA • <a href="/contact" className="text-blue-500 hover:underline">Contacter un humain</a>
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatAIWidget;
