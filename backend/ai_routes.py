"""
Routes API pour l'Intelligence Artificielle Groq
ETF - En Toute Franchise
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from groq_ai_service import (
    GroqAIService, 
    UserType, 
    ConversationContext,
    groq_ai_service,
    init_groq_ai
)

logger = logging.getLogger(__name__)


# =============================================================================
# MODÈLES PYDANTIC
# =============================================================================

class ChatRequest(BaseModel):
    """Requête de chat"""
    message: str = Field(..., min_length=1, max_length=4000, description="Message de l'utilisateur")
    conversation_id: Optional[str] = Field(None, description="ID de la conversation (généré si absent)")
    user_type: Optional[str] = Field("visitor", description="Type d'utilisateur: visitor, member, admin, prospect")
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
    
    return router
