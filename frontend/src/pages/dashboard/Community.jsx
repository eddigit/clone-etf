import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, MessageCircle, Send, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Input } from '../../components/ui/input';

const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8001' : 'https://etf-backend-t3j5.onrender.com');

const Community = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [commentContent, setCommentContent] = useState({});
  const [showComments, setShowComments] = useState({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data.posts);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des posts:', error);
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/posts`,
        { content: newPostContent, attachments: [] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewPostContent('');
      fetchPosts();
    } catch (error) {
      console.error('Erreur lors de la création du post:', error);
    }
  };

  const likePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/posts/${postId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Mettre à jour le post localement
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const likes = post.likes || [];
          const currentUserId = JSON.parse(atob(token.split('.')[1])).user_id;
          
          if (response.data.liked) {
            return { ...post, likes: [...likes, currentUserId] };
          } else {
            return { ...post, likes: likes.filter(id => id !== currentUserId) };
          }
        }
        return post;
      }));
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  const addComment = async (postId) => {
    const content = commentContent[postId];
    if (!content?.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/posts/${postId}/comments`,
        null,
        {
          params: { content },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setCommentContent({ ...commentContent, [postId]: '' });
      fetchPosts();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
    }
  };

  const toggleComments = (postId) => {
    setShowComments({ ...showComments, [postId]: !showComments[postId] });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Communauté</h1>
        <p className="text-gray-600">Partagez et échangez avec les autres membres</p>
      </div>

      {/* Créer un post */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quoi de neuf ?</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Partagez quelque chose avec la communauté..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="mb-4 min-h-[100px]"
          />
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" disabled>
              <ImageIcon className="h-4 w-4 mr-2" />
              Photo
            </Button>
            <Button onClick={createPost} disabled={!newPostContent.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Publier
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fil d'actualité */}
      <div className="space-y-6">
        {posts.map((post) => {
          const currentUserId = localStorage.getItem('token') 
            ? JSON.parse(atob(localStorage.getItem('token').split('.')[1])).user_id 
            : null;
          const isLiked = post.likes?.includes(currentUserId);
          const likesCount = post.likes?.length || 0;
          const commentsCount = post.comments?.length || 0;

          return (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start space-x-3">
                  <Avatar>
                    <AvatarImage src={post.userProfilePhoto} />
                    <AvatarFallback>
                      {getInitials(post.userFirstName, post.userLastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {post.userFirstName} {post.userLastName}
                        </h3>
                        <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>

                {/* Actions */}
                <div className="flex items-center space-x-6 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => likePost(post.id)}
                    className={isLiked ? 'text-red-500' : ''}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                    {likesCount} J'aime
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleComments(post.id)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {commentsCount} Commentaire{commentsCount > 1 ? 's' : ''}
                  </Button>
                </div>

                {/* Section commentaires */}
                {showComments[post.id] && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {/* Liste des commentaires */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-3">
                        {post.comments.map((comment) => (
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
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Écrivez un commentaire..."
                        value={commentContent[post.id] || ''}
                        onChange={(e) =>
                          setCommentContent({ ...commentContent, [post.id]: e.target.value })
                        }
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            addComment(post.id);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => addComment(post.id)}
                        disabled={!commentContent[post.id]?.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {posts.length === 0 && (
          <Card className="py-12">
            <CardContent className="text-center">
              <p className="text-gray-500">Aucun post pour le moment</p>
              <p className="text-sm text-gray-400 mt-2">Soyez le premier à partager quelque chose !</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Community;
