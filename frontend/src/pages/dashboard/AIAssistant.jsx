import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Bot, Send, User, Loader2, AlertCircle } from 'lucide-react';
import { mockConversations, mockMessages } from '../../mockData';

const AIAssistant = () => {
  const [conversations, setConversations] = useState(mockConversations);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewConversation = () => {
    const newConv = {
      id: Date.now(),
      title: 'Nouvelle conversation',
      date: new Date().toISOString().split('T')[0],
      messagesCount: 0,
      lastMessage: ''
    };
    setConversations([newConv, ...conversations]);
    setCurrentConversation(newConv.id);
    setMessages([]);
  };

  const handleSelectConversation = (convId) => {
    setCurrentConversation(convId);
    // Load mock messages for demo
    if (convId === 1) {
      setMessages(mockMessages);
    } else {
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      conversationId: currentConversation,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        conversationId: currentConversation,
        role: 'assistant',
        content: "Bonjour ! Je suis l'assistant juridique IA d'En Toute Franchise. Je suis là pour répondre à vos questions juridiques et administratives. Comment puis-je vous aider aujourd'hui ? (Note : Pour le moment, les réponses sont mockées, l'intégration IA sera ajoutée avec les API).",
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, aiMessage]);
      setLoading(false);
    }, 1500);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-64px)] md:h-screen flex">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200 hidden lg:flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <Button onClick={handleNewConversation} className="w-full bg-blue-600 hover:bg-blue-700">
              <Bot className="mr-2 h-4 w-4" />
              Nouvelle conversation
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  currentConversation === conv.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                }`}
              >
                <h3 className="font-medium text-gray-900 text-sm mb-1">{conv.title}</h3>
                <p className="text-xs text-gray-500">{conv.messagesCount} messages</p>
                <p className="text-xs text-gray-400 mt-1">{conv.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Bot className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">Assistant IA Juridique</h2>
                      <p className="text-xs text-gray-500">Disponible 24/7</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">En ligne</Badge>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Assistant IA d'Orientation
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Outil d'information basé sur 30 ans d'expérience
                    </p>
                    <div className="max-w-md mx-auto bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
                      <p className="text-sm text-amber-900">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        <strong>Important :</strong> Cet assistant fournit des informations et orientations basées sur l'expérience de l'association. 
                        Il ne constitue pas un conseil juridique professionnel et ne remplace pas la consultation d'un avocat.
                      </p>
                    </div>
                    <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        <strong>Note technique :</strong> Les réponses IA sont actuellement mockées. L'intégration complète sera
                        ajoutée lors de la configuration des API.
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-2xl ${
                        message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user' ? 'bg-blue-600' : 'bg-purple-100'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="h-5 w-5 text-white" />
                        ) : (
                          <Bot className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      <div
                        className={`rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Bot className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-end space-x-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Posez votre question juridique..."
                    className="flex-1 min-h-[60px] max-h-32 resize-none"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || loading}
                    className="bg-blue-600 hover:bg-blue-700 h-[60px]"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Appuyez sur Entrée pour envoyer, Shift + Entrée pour une nouvelle ligne
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-10 w-10 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Assistant IA Juridique</h2>
                <p className="text-gray-600 mb-6">Sélectionnez ou créez une conversation pour commencer</p>
                <Button onClick={handleNewConversation} className="bg-blue-600 hover:bg-blue-700">
                  <Bot className="mr-2 h-4 w-4" />
                  Nouvelle conversation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIAssistant;
