"""
Service de Chat en Direct - WebSocket
ETF - En Toute Franchise
"""

from datetime import datetime
from typing import Optional, List, Dict, Set
from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import WebSocket
import json
import logging
import asyncio

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Gestionnaire des connexions WebSocket"""
    
    def __init__(self):
        # Connexions des visiteurs: {visitor_id: WebSocket}
        self.visitor_connections: Dict[str, WebSocket] = {}
        # Connexions des admins: {admin_id: WebSocket}
        self.admin_connections: Dict[str, WebSocket] = {}
        # Mapping conversation -> participants
        self.conversation_participants: Dict[str, Set[str]] = {}
    
    async def connect_visitor(self, websocket: WebSocket, visitor_id: str):
        """Connecter un visiteur"""
        await websocket.accept()
        self.visitor_connections[visitor_id] = websocket
        logger.info(f"Visitor {visitor_id} connected")
        # Notifier les admins
        await self.notify_admins({
            "type": "visitor_online",
            "visitor_id": visitor_id,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    async def connect_admin(self, websocket: WebSocket, admin_id: str):
        """Connecter un admin"""
        await websocket.accept()
        self.admin_connections[admin_id] = websocket
        logger.info(f"Admin {admin_id} connected")
    
    def disconnect_visitor(self, visitor_id: str):
        """Déconnecter un visiteur"""
        if visitor_id in self.visitor_connections:
            del self.visitor_connections[visitor_id]
            logger.info(f"Visitor {visitor_id} disconnected")
    
    def disconnect_admin(self, admin_id: str):
        """Déconnecter un admin"""
        if admin_id in self.admin_connections:
            del self.admin_connections[admin_id]
            logger.info(f"Admin {admin_id} disconnected")
    
    async def send_to_visitor(self, visitor_id: str, message: dict):
        """Envoyer un message à un visiteur"""
        if visitor_id in self.visitor_connections:
            try:
                await self.visitor_connections[visitor_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending to visitor {visitor_id}: {e}")
                self.disconnect_visitor(visitor_id)
    
    async def send_to_admin(self, admin_id: str, message: dict):
        """Envoyer un message à un admin"""
        if admin_id in self.admin_connections:
            try:
                await self.admin_connections[admin_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending to admin {admin_id}: {e}")
                self.disconnect_admin(admin_id)
    
    async def notify_admins(self, message: dict):
        """Notifier tous les admins connectés"""
        disconnected = []
        for admin_id, ws in self.admin_connections.items():
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Error notifying admin {admin_id}: {e}")
                disconnected.append(admin_id)
        
        for admin_id in disconnected:
            self.disconnect_admin(admin_id)
    
    async def broadcast_to_conversation(self, conversation_id: str, message: dict, exclude: Optional[str] = None):
        """Diffuser un message à tous les participants d'une conversation"""
        participants = self.conversation_participants.get(conversation_id, set())
        for participant_id in participants:
            if participant_id == exclude:
                continue
            if participant_id in self.visitor_connections:
                await self.send_to_visitor(participant_id, message)
            elif participant_id in self.admin_connections:
                await self.send_to_admin(participant_id, message)
    
    def get_online_visitors_count(self) -> int:
        """Nombre de visiteurs connectés"""
        return len(self.visitor_connections)
    
    def get_online_admins_count(self) -> int:
        """Nombre d'admins connectés"""
        return len(self.admin_connections)


class LiveChatService:
    """Service pour le chat en direct"""
    
    def __init__(self, db: AsyncIOMotorDatabase, connection_manager: ConnectionManager):
        self.db = db
        self.conversations = db.live_chat_conversations
        self.messages = db.live_chat_messages
        self.manager = connection_manager
    
    async def init_indexes(self):
        """Créer les index"""
        try:
            await self.conversations.create_index("visitor_id")
            await self.conversations.create_index("status")
            await self.conversations.create_index("started_at")
            await self.messages.create_index("conversation_id")
            await self.messages.create_index("timestamp")
            logger.info("Live chat indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating live chat indexes: {e}")
    
    async def start_conversation(
        self,
        visitor_id: str,
        visitor_name: Optional[str] = None,
        visitor_email: Optional[str] = None,
        current_page: Optional[str] = None
    ) -> Dict:
        """Démarrer une nouvelle conversation"""
        try:
            # Vérifier s'il y a déjà une conversation active
            existing = await self.conversations.find_one({
                "visitor_id": visitor_id,
                "status": {"$in": ["waiting", "active"]}
            })
            
            if existing:
                return {"success": True, "conversation": existing, "existing": True}
            
            conversation = {
                "id": f"chat_{visitor_id}_{int(datetime.utcnow().timestamp())}",
                "visitor_id": visitor_id,
                "visitor_name": visitor_name or f"Visiteur",
                "visitor_email": visitor_email,
                "admin_id": None,
                "admin_name": None,
                "status": "waiting",
                "started_at": datetime.utcnow(),
                "last_message_at": datetime.utcnow(),
                "closed_at": None,
                "messages_count": 0,
                "visitor_page": current_page,
                "visitor_info": {}
            }
            
            await self.conversations.insert_one(conversation)
            
            # Notifier les admins
            await self.manager.notify_admins({
                "type": "new_conversation",
                "conversation": conversation,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            return {"success": True, "conversation": conversation, "existing": False}
            
        except Exception as e:
            logger.error(f"Error starting conversation: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_message(
        self,
        conversation_id: str,
        sender_type: str,  # visitor, admin
        sender_id: str,
        sender_name: str,
        content: str
    ) -> Dict:
        """Envoyer un message dans une conversation"""
        try:
            message = {
                "id": f"msg_{int(datetime.utcnow().timestamp() * 1000)}",
                "conversation_id": conversation_id,
                "sender_type": sender_type,
                "sender_id": sender_id,
                "sender_name": sender_name,
                "content": content,
                "is_read": False,
                "timestamp": datetime.utcnow()
            }
            
            await self.messages.insert_one(message)
            
            # Mettre à jour la conversation
            await self.conversations.update_one(
                {"id": conversation_id},
                {
                    "$set": {"last_message_at": datetime.utcnow()},
                    "$inc": {"messages_count": 1}
                }
            )
            
            # Récupérer la conversation pour le broadcast
            conversation = await self.conversations.find_one({"id": conversation_id})
            
            # Diffuser le message
            broadcast_msg = {
                "type": "new_message",
                "message": {
                    **message,
                    "timestamp": message["timestamp"].isoformat()
                },
                "conversation_id": conversation_id
            }
            
            # Envoyer au visiteur si le message vient d'un admin
            if sender_type == "admin" and conversation:
                await self.manager.send_to_visitor(conversation["visitor_id"], broadcast_msg)
            
            # Notifier tous les admins
            await self.manager.notify_admins(broadcast_msg)
            
            return {"success": True, "message": message}
            
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            return {"success": False, "error": str(e)}
    
    async def assign_admin(
        self,
        conversation_id: str,
        admin_id: str,
        admin_name: str
    ) -> Dict:
        """Assigner un admin à une conversation"""
        try:
            result = await self.conversations.update_one(
                {"id": conversation_id},
                {
                    "$set": {
                        "admin_id": admin_id,
                        "admin_name": admin_name,
                        "status": "active"
                    }
                }
            )
            
            if result.modified_count:
                conversation = await self.conversations.find_one({"id": conversation_id})
                
                # Notifier le visiteur
                if conversation:
                    await self.manager.send_to_visitor(conversation["visitor_id"], {
                        "type": "admin_joined",
                        "admin_name": admin_name,
                        "conversation_id": conversation_id,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                # Notifier les autres admins
                await self.manager.notify_admins({
                    "type": "conversation_assigned",
                    "conversation_id": conversation_id,
                    "admin_id": admin_id,
                    "admin_name": admin_name,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
                return {"success": True, "conversation": conversation}
            
            return {"success": False, "error": "Conversation not found"}
            
        except Exception as e:
            logger.error(f"Error assigning admin: {e}")
            return {"success": False, "error": str(e)}
    
    async def close_conversation(self, conversation_id: str) -> Dict:
        """Fermer une conversation"""
        try:
            result = await self.conversations.update_one(
                {"id": conversation_id},
                {
                    "$set": {
                        "status": "closed",
                        "closed_at": datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count:
                conversation = await self.conversations.find_one({"id": conversation_id})
                
                # Notifier le visiteur
                if conversation:
                    await self.manager.send_to_visitor(conversation["visitor_id"], {
                        "type": "conversation_closed",
                        "conversation_id": conversation_id,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                return {"success": True}
            
            return {"success": False, "error": "Conversation not found"}
            
        except Exception as e:
            logger.error(f"Error closing conversation: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_conversation_messages(self, conversation_id: str) -> List[Dict]:
        """Récupérer les messages d'une conversation"""
        try:
            messages = await self.messages.find(
                {"conversation_id": conversation_id}
            ).sort("timestamp", 1).to_list(500)
            
            return messages
            
        except Exception as e:
            logger.error(f"Error getting messages: {e}")
            return []
    
    async def get_waiting_conversations(self) -> List[Dict]:
        """Récupérer les conversations en attente"""
        try:
            conversations = await self.conversations.find(
                {"status": "waiting"}
            ).sort("started_at", 1).to_list(100)
            
            return conversations
            
        except Exception as e:
            logger.error(f"Error getting waiting conversations: {e}")
            return []
    
    async def get_active_conversations(self, admin_id: Optional[str] = None) -> List[Dict]:
        """Récupérer les conversations actives"""
        try:
            query = {"status": "active"}
            if admin_id:
                query["admin_id"] = admin_id
            
            conversations = await self.conversations.find(query).sort("last_message_at", -1).to_list(100)
            
            return conversations
            
        except Exception as e:
            logger.error(f"Error getting active conversations: {e}")
            return []
    
    async def get_all_conversations(self, limit: int = 50) -> List[Dict]:
        """Récupérer toutes les conversations récentes"""
        try:
            conversations = await self.conversations.find().sort("started_at", -1).to_list(limit)
            return conversations
        except Exception as e:
            logger.error(f"Error getting all conversations: {e}")
            return []


# Instances globales
connection_manager = ConnectionManager()
live_chat_service: Optional[LiveChatService] = None


def init_live_chat_service(db: AsyncIOMotorDatabase) -> LiveChatService:
    """Initialiser le service de chat"""
    global live_chat_service
    live_chat_service = LiveChatService(db, connection_manager)
    return live_chat_service
