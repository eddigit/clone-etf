"""
Routes API pour l'Intelligence Artificielle Groq + RAG
ETF - En Toute Franchise
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
import os

from groq_ai_service import (
    GroqAIService, 
    UserType, 
    ConversationContext,
    groq_ai_service,
    init_groq_ai
)
from knowledge_base import knowledge_base, init_knowledge_base

logger = logging.getLogger(__name__)


# =============================================================================
# MODÈLES PYDANTIC
# =============================================================================

class ChatRequest(BaseModel):
    """Requête de chat"""
    message: str = Field(..., min_length=1, max_length=4000, description="Message de l'utilisateur")
    conversation_id: Optional[str] = Field(None, description="ID de la conversation (généré si absent)")
    user_type: Optional[str] = Field("visitor", description="Type d'utilisateur: visitor, member, admin, prospect, vip")
    context: Optional[str] = Field(None, description="Contexte: general, adhesion, support, events, partners, legal, community")
    user_info: Optional[Dict[str, Any]] = Field(None, description="Informations sur l'utilisateur")


class ChatResponse(BaseModel):
    """Réponse du chat"""
    response: str
    conversation_id: str
    timestamp: str


class SentimentRequest(BaseModel):
    """Requête d'analyse de sentiment"""
    text: str = Field(..., min_length=1, max_length=2000)


class SentimentResponse(BaseModel):
    """Réponse d'analyse de sentiment"""
    sentiment: str
    score: float
    emotions: List[str]
    urgence: str


class EmailAssistRequest(BaseModel):
    """Requête d'assistance email"""
    original_email: str = Field(..., min_length=1, max_length=10000)
    context: Optional[str] = Field("", description="Contexte supplémentaire pour la réponse")


class EmailAssistResponse(BaseModel):
    """Réponse d'assistance email"""
    suggested_response: str


class ConversationSummaryResponse(BaseModel):
    """Résumé de conversation"""
    summary: str
    conversation_id: str


class ConversationHistoryResponse(BaseModel):
    """Historique de conversation"""
    conversation_id: str
    messages: List[Dict[str, Any]]
    message_count: int


# =============================================================================
# MODÈLES RAG
# =============================================================================

class RAGChatRequest(BaseModel):
    """Requête de chat avec RAG"""
    message: str = Field(..., min_length=1, max_length=2000, description="Question de l'utilisateur")
    conversation_history: Optional[List[Dict[str, str]]] = Field(None, description="Historique de conversation")
    use_rag: bool = Field(True, description="Utiliser la base de connaissances ETF")


class RAGChatResponse(BaseModel):
    """Réponse du chat RAG"""
    success: bool
    response: str
    sources: Optional[List[Dict[str, Any]]] = None
    tokens_used: Optional[int] = None
    error: Optional[str] = None


class RAGSearchRequest(BaseModel):
    """Requête de recherche dans la base"""
    query: str = Field(..., min_length=1, max_length=500, description="Recherche")
    top_k: int = Field(default=5, ge=1, le=10, description="Nombre de résultats")


# =============================================================================
# ROUTES API
# =============================================================================

def create_ai_router(db, get_current_admin_user=None):
    """
    Crée le routeur pour les routes IA
    
    Args:
        db: Instance de la base de données MongoDB
        get_current_admin_user: Dépendance pour vérifier l'admin (optionnel)
    """
    router = APIRouter(prefix="/ai", tags=["Intelligence Artificielle"])
    
    # Initialiser le service avec la DB
    ai_service = init_groq_ai(db)
    
    # ==================== CHAT PUBLIC ====================
    
    @router.post("/chat", response_model=ChatResponse)
    async def chat_with_ai(request: ChatRequest):
        """
        Envoie un message à l'IA et reçoit une réponse.
        
        Cette route est publique et peut être utilisée par :
        - Les visiteurs (widget de chat)
        - Les membres connectés
        - L'interface admin
        
        L'IA adapte ses réponses selon le type d'utilisateur et le contexte.
        """
        try:
            # Générer un ID de conversation si non fourni
            conversation_id = request.conversation_id
            if not conversation_id:
                conversation_id = f"conv_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{id(request)}"
            
            # Parser le type d'utilisateur
            try:
                user_type = UserType(request.user_type) if request.user_type else UserType.VISITOR
            except ValueError:
                user_type = UserType.VISITOR
            
            # Parser le contexte
            context = None
            if request.context:
                try:
                    context = ConversationContext(request.context)
                except ValueError:
                    pass
            
            # Appeler le service IA
            response = await ai_service.chat(
                user_message=request.message,
                conversation_id=conversation_id,
                user_type=user_type,
                user_info=request.user_info,
                context=context
            )
            
            return ChatResponse(
                response=response,
                conversation_id=conversation_id,
                timestamp=datetime.utcnow().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error in chat endpoint: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de la communication avec l'IA")
    
    # ==================== ROUTES ADMIN ====================
    
    @router.post("/analyze-sentiment", response_model=SentimentResponse)
    async def analyze_sentiment(
        request: SentimentRequest,
        current_user: dict = Depends(get_current_admin_user) if get_current_admin_user else None
    ):
        """
        Analyse le sentiment d'un texte.
        
        Utile pour :
        - Détecter les utilisateurs mécontents dans le chat
        - Analyser les retours et commentaires
        - Prioriser les demandes urgentes
        
        **Réservé aux administrateurs**
        """
        try:
            result = await ai_service.analyze_sentiment(request.text)
            return SentimentResponse(**result)
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de l'analyse")
    
    @router.post("/assist-email", response_model=EmailAssistResponse)
    async def assist_email_response(
        request: EmailAssistRequest,
        current_user: dict = Depends(get_current_admin_user) if get_current_admin_user else None
    ):
        """
        Génère une suggestion de réponse à un email.
        
        L'IA analyse l'email original et propose une réponse 
        professionnelle et cohérente avec la communication ETF.
        
        **Réservé aux administrateurs**
        """
        try:
            suggested = await ai_service.generate_email_response(
                original_email=request.original_email,
                context=request.context
            )
            
            if not suggested:
                raise HTTPException(status_code=500, detail="Impossible de générer une réponse")
            
            return EmailAssistResponse(suggested_response=suggested)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in email assist: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de la génération")
    
    @router.get("/conversation/{conversation_id}/summary", response_model=ConversationSummaryResponse)
    async def get_conversation_summary(
        conversation_id: str,
        current_user: dict = Depends(get_current_admin_user) if get_current_admin_user else None
    ):
        """
        Génère un résumé d'une conversation.
        
        Utile pour les administrateurs qui reprennent une conversation
        ou veulent avoir un aperçu rapide.
        
        **Réservé aux administrateurs**
        """
        try:
            summary = await ai_service.summarize_conversation(conversation_id)
            return ConversationSummaryResponse(
                summary=summary,
                conversation_id=conversation_id
            )
        except Exception as e:
            logger.error(f"Error getting summary: {e}")
            raise HTTPException(status_code=500, detail="Erreur lors de la génération du résumé")
    
    @router.get("/conversation/{conversation_id}/history", response_model=ConversationHistoryResponse)
    async def get_conversation_history(
        conversation_id: str,
        current_user: dict = Depends(get_current_admin_user) if get_current_admin_user else None
    ):
        """
        Récupère l'historique complet d'une conversation.
        
        **Réservé aux administrateurs**
        """
        history = ai_service.get_conversation_history(conversation_id)
        return ConversationHistoryResponse(
            conversation_id=conversation_id,
            messages=history,
            message_count=len(history)
        )
    
    @router.delete("/conversation/{conversation_id}")
    async def clear_conversation(
        conversation_id: str,
        current_user: dict = Depends(get_current_admin_user) if get_current_admin_user else None
    ):
        """
        Efface l'historique d'une conversation.
        
        L'historique en mémoire est effacé, mais les logs en base sont conservés.
        
        **Réservé aux administrateurs**
        """
        ai_service.clear_conversation(conversation_id)
        return {"message": f"Conversation {conversation_id} effacée"}
    
    # ==================== STATISTIQUES ====================
    
    @router.get("/stats")
    async def get_ai_stats(
        current_user: dict = Depends(get_current_admin_user) if get_current_admin_user else None
    ):
        """
        Récupère les statistiques d'utilisation de l'IA.
        
        **Réservé aux administrateurs**
        """
        try:
            # Nombre de conversations actives en mémoire
            active_conversations = len(ai_service.conversations)
            
            # Stats depuis la base de données
            if db:
                total_messages = await db.ai_conversations.count_documents({})
                today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                today_messages = await db.ai_conversations.count_documents({
                    "timestamp": {"$gte": today_start}
                })
                
                # Distribution par type d'utilisateur
                pipeline = [
                    {"$group": {"_id": "$user_type", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}}
                ]
                user_type_stats = await db.ai_conversations.aggregate(pipeline).to_list(length=10)
            else:
                total_messages = 0
                today_messages = 0
                user_type_stats = []
            
            return {
                "active_conversations": active_conversations,
                "total_messages": total_messages,
                "today_messages": today_messages,
                "user_type_distribution": {
                    item["_id"]: item["count"] for item in user_type_stats
                },
                "model": ai_service.model,
                "status": "operational"
            }
        except Exception as e:
            logger.error(f"Error getting AI stats: {e}")
            return {
                "active_conversations": len(ai_service.conversations),
                "status": "operational",
                "error": str(e)
            }
    
    # ==================== SANTÉ DU SERVICE ====================
    
    @router.get("/health")
    async def ai_health_check():
        """
        Vérifie que le service IA est opérationnel.
        
        Teste la connexion à l'API Groq.
        """
        try:
            # Test simple de l'API
            response = await ai_service.chat(
                user_message="Test",
                conversation_id="health_check",
                user_type=UserType.VISITOR
            )
            
            # Nettoyer la conversation de test
            ai_service.clear_conversation("health_check")
            
            return {
                "status": "healthy",
                "model": ai_service.model,
                "api_connected": True,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"AI health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    # ==================== ENDPOINTS RAG ====================
    
    @router.post("/rag/chat", response_model=RAGChatResponse)
    async def rag_chat(request: RAGChatRequest):
        """
        Chat avec le système RAG.
        
        Utilise la base de connaissances ETF (30 ans d'articles)
        pour fournir des réponses contextualisées via Groq.
        """
        try:
            if not knowledge_base.is_loaded:
                return RAGChatResponse(
                    success=False,
                    response="",
                    error="Base de connaissances non chargée. Veuillez contacter l'administrateur."
                )
            
            # Rechercher le contexte pertinent dans la base
            context_data = knowledge_base.get_context_for_llm(
                query=request.message,
                top_k=3
            )
            
            # Construire le prompt avec le contexte RAG
            rag_prompt = f"""Tu es l'assistant IA de l'association ETF (En Toute Franchise), spécialiste du droit de la franchise depuis 1993.

CONTEXTE DE LA BASE DE CONNAISSANCES ETF :
{context_data['context']}

SOURCES UTILISÉES :
{', '.join([s['title'] for s in context_data['sources']]) if context_data['sources'] else 'Aucune source spécifique'}

RÈGLES :
1. Réponds en te basant sur le contexte fourni
2. Si le contexte ne contient pas l'information, dis-le clairement
3. Cite les sources quand c'est pertinent
4. Reste professionnel et précis sur les aspects juridiques
5. Propose de contacter ETF pour les cas complexes

QUESTION DE L'UTILISATEUR :
{request.message}"""

            # Appeler Groq avec le contexte RAG
            response = await ai_service.chat(
                user_message=rag_prompt,
                conversation_id=f"rag_{datetime.utcnow().timestamp()}",
                user_type=UserType.VISITOR
            )
            
            return RAGChatResponse(
                success=True,
                response=response,
                sources=context_data['sources']
            )
            
        except Exception as e:
            logger.error(f"RAG chat error: {e}")
            return RAGChatResponse(
                success=False,
                response="",
                error=str(e)
            )
    
    @router.post("/rag/search")
    async def rag_search(request: RAGSearchRequest):
        """
        Recherche dans la base de connaissances sans appeler le LLM.
        
        Retourne les articles les plus pertinents via TF-IDF.
        """
        try:
            if not knowledge_base.is_loaded:
                raise HTTPException(
                    status_code=503,
                    detail="Base de connaissances non chargée"
                )
            
            results = knowledge_base.search(
                query=request.query,
                top_k=request.top_k
            )
            
            return {
                "success": True,
                "query": request.query,
                "results": results,
                "total_found": len(results)
            }
            
        except Exception as e:
            logger.error(f"RAG search error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @router.get("/rag/stats")
    async def rag_stats():
        """
        Statistiques de la base de connaissances.
        
        Retourne le nombre d'articles, les catégories, etc.
        """
        try:
            stats = knowledge_base.get_stats()
            return {
                "success": True,
                **stats
            }
        except Exception as e:
            logger.error(f"RAG stats error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @router.get("/rag/suggestions")
    async def rag_suggestions():
        """
        Retourne des questions suggérées basées sur la base de connaissances.
        """
        try:
            suggestions = knowledge_base.get_suggested_questions()
            return {
                "success": True,
                "suggestions": suggestions
            }
        except Exception as e:
            logger.error(f"RAG suggestions error: {e}")
            return {
                "success": False,
                "suggestions": [
                    "Qu'est-ce que la Directive 2006 ?",
                    "Comment fonctionne la CDAC ?",
                    "Quels sont les avantages d'adhérer à ETF ?",
                    "Qu'est-ce que le DIP en franchise ?",
                    "Comment fonctionne la clause de non-concurrence ?"
                ]
            }
    
    @router.post("/rag/reload")
    async def rag_reload():
        """
        Recharge la base de connaissances depuis le fichier JSON.
        
        Nécessite les droits admin.
        """
        try:
            success = knowledge_base.load_articles()
            if success:
                stats = knowledge_base.get_stats()
                return {
                    "success": True,
                    "message": "Base de connaissances rechargée avec succès",
                    **stats
                }
            else:
                return {
                    "success": False,
                    "error": "Échec du rechargement de la base de connaissances"
                }
        except Exception as e:
            logger.error(f"RAG reload error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    return router
