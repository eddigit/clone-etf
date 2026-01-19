"""
Service de logging détaillé pour les adhésions ETF
Traçabilité complète de chaque étape du parcours adhérent
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from enum import Enum
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
from dotenv import load_dotenv

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuration logging fichier
LOG_DIR = ROOT_DIR / 'logs'
LOG_DIR.mkdir(exist_ok=True)

# Fichier de log dédié aux adhésions
adhesion_file_handler = logging.FileHandler(
    LOG_DIR / 'adhesions.log',
    encoding='utf-8'
)
adhesion_file_handler.setFormatter(logging.Formatter(
    '%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
))

logger = logging.getLogger('adhesion')
logger.setLevel(logging.DEBUG)
logger.addHandler(adhesion_file_handler)
logger.addHandler(logging.StreamHandler())  # Console aussi


class AdhesionStep(str, Enum):
    """Étapes du parcours d'adhésion"""
    # Frontend - Formulaire
    FORM_STARTED = "form_started"           # L'utilisateur a commencé le formulaire
    FORM_TYPE_SELECTED = "form_type_selected"  # Type d'adhésion choisi
    FORM_SUBMITTED = "form_submitted"       # Formulaire soumis
    FORM_VALIDATION_ERROR = "form_validation_error"  # Erreur de validation
    
    # Backend - Création adhésion
    MEMBERSHIP_CREATED = "membership_created"    # Adhésion créée en base
    MEMBERSHIP_CREATE_ERROR = "membership_create_error"  # Erreur création
    PDF_GENERATED = "pdf_generated"              # PDF bordereau généré
    PDF_ERROR = "pdf_error"                      # Erreur génération PDF
    
    # HelloAsso
    HELLOASSO_REDIRECT = "helloasso_redirect"    # Redirection vers HelloAsso
    HELLOASSO_WEBHOOK = "helloasso_webhook"      # Webhook reçu
    HELLOASSO_PAYMENT_SUCCESS = "helloasso_payment_success"  # Paiement confirmé
    HELLOASSO_PAYMENT_ERROR = "helloasso_payment_error"      # Erreur paiement
    
    # Compte utilisateur
    USER_CREATED = "user_created"                # Compte créé
    USER_CREATE_ERROR = "user_create_error"      # Erreur création compte
    USER_UPDATED = "user_updated"                # Compte mis à jour
    USER_ALREADY_EXISTS = "user_already_exists"  # Compte existant
    
    # Emails
    EMAIL_WELCOME_SENT = "email_welcome_sent"    # Email bienvenue envoyé
    EMAIL_WELCOME_ERROR = "email_welcome_error"  # Erreur envoi email
    EMAIL_ADMIN_NOTIFIED = "email_admin_notified"  # Admin notifié
    
    # Synchronisation
    SYNC_STARTED = "sync_started"
    SYNC_COMPLETED = "sync_completed"
    SYNC_ERROR = "sync_error"


class AdhesionStatus(str, Enum):
    """Statuts des logs"""
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


class AdhesionLogger:
    """
    Service de logging centralisé pour les adhésions
    Stocke en base MongoDB ET en fichier log
    """
    
    def __init__(self, db=None):
        self.db = db
        self._collection_name = "adhesion_logs"
    
    def set_db(self, db):
        """Configure la connexion DB"""
        self.db = db
    
    async def log(
        self,
        step: AdhesionStep,
        status: AdhesionStatus,
        email: Optional[str] = None,
        user_id: Optional[str] = None,
        membership_id: Optional[str] = None,
        message: str = "",
        details: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        source: str = "backend"
    ) -> str:
        """
        Enregistre un log d'adhésion
        
        Args:
            step: Étape du parcours
            status: Statut (info, success, warning, error)
            email: Email de l'adhérent
            user_id: ID utilisateur si disponible
            membership_id: ID adhésion si disponible
            message: Message descriptif
            details: Données additionnelles
            error: Message d'erreur si applicable
            source: Source du log (frontend/backend/webhook)
        
        Returns:
            ID du log créé
        """
        now = datetime.now(timezone.utc)
        
        log_entry = {
            "id": f"log_{now.strftime('%Y%m%d%H%M%S')}_{step.value[:10]}",
            "timestamp": now,
            "step": step.value,
            "status": status.value,
            "email": email,
            "user_id": user_id,
            "membership_id": membership_id,
            "message": message,
            "details": details or {},
            "error": error,
            "source": source,
            "ip_address": details.get("ip_address") if details else None,
            "user_agent": details.get("user_agent") if details else None
        }
        
        # Log en fichier
        log_level = {
            AdhesionStatus.INFO: logging.INFO,
            AdhesionStatus.SUCCESS: logging.INFO,
            AdhesionStatus.WARNING: logging.WARNING,
            AdhesionStatus.ERROR: logging.ERROR
        }.get(status, logging.INFO)
        
        log_msg = f"[{step.value}] {status.value.upper()} | {email or 'N/A'} | {message}"
        if error:
            log_msg += f" | ERROR: {error}"
        logger.log(log_level, log_msg)
        
        # Log en base MongoDB
        if self.db:
            try:
                await self.db[self._collection_name].insert_one(log_entry)
            except Exception as e:
                logger.error(f"Erreur insertion log en base: {e}")
        
        return log_entry["id"]
    
    async def log_error(
        self,
        step: AdhesionStep,
        email: Optional[str],
        error: str,
        details: Optional[Dict[str, Any]] = None
    ) -> str:
        """Raccourci pour logger une erreur"""
        return await self.log(
            step=step,
            status=AdhesionStatus.ERROR,
            email=email,
            message=f"Erreur lors de {step.value}",
            error=error,
            details=details
        )
    
    async def log_success(
        self,
        step: AdhesionStep,
        email: Optional[str],
        message: str,
        details: Optional[Dict[str, Any]] = None
    ) -> str:
        """Raccourci pour logger un succès"""
        return await self.log(
            step=step,
            status=AdhesionStatus.SUCCESS,
            email=email,
            message=message,
            details=details
        )
    
    async def get_logs(
        self,
        email: Optional[str] = None,
        step: Optional[AdhesionStep] = None,
        status: Optional[AdhesionStatus] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Récupère les logs avec filtres
        """
        if not self.db:
            return []
        
        query = {}
        
        if email:
            query["email"] = {"$regex": email, "$options": "i"}
        if step:
            query["step"] = step.value
        if status:
            query["status"] = status.value
        if from_date:
            query["timestamp"] = {"$gte": from_date}
        if to_date:
            if "timestamp" in query:
                query["timestamp"]["$lte"] = to_date
            else:
                query["timestamp"] = {"$lte": to_date}
        
        logs = await self.db[self._collection_name].find(query)\
            .sort("timestamp", -1)\
            .skip(offset)\
            .limit(limit)\
            .to_list(length=limit)
        
        # Convertir ObjectId en string
        for log in logs:
            if "_id" in log:
                log["_id"] = str(log["_id"])
            if "timestamp" in log and isinstance(log["timestamp"], datetime):
                log["timestamp"] = log["timestamp"].isoformat()
        
        return logs
    
    async def get_user_journey(self, email: str) -> List[Dict[str, Any]]:
        """
        Récupère le parcours complet d'un utilisateur
        """
        return await self.get_logs(email=email, limit=500)
    
    async def get_errors(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Récupère les dernières erreurs
        """
        return await self.get_logs(status=AdhesionStatus.ERROR, limit=limit)
    
    async def get_stats(self, days: int = 30) -> Dict[str, Any]:
        """
        Statistiques des adhésions sur les N derniers jours
        """
        if not self.db:
            return {}
        
        from_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)
        from_date = from_date.replace(day=from_date.day - days)
        
        pipeline = [
            {"$match": {"timestamp": {"$gte": from_date}}},
            {"$group": {
                "_id": {"step": "$step", "status": "$status"},
                "count": {"$sum": 1}
            }}
        ]
        
        results = await self.db[self._collection_name].aggregate(pipeline).to_list(None)
        
        stats = {
            "period_days": days,
            "total_logs": 0,
            "by_step": {},
            "by_status": {},
            "errors": []
        }
        
        for r in results:
            step = r["_id"]["step"]
            status = r["_id"]["status"]
            count = r["count"]
            
            stats["total_logs"] += count
            
            if step not in stats["by_step"]:
                stats["by_step"][step] = {}
            stats["by_step"][step][status] = count
            
            if status not in stats["by_status"]:
                stats["by_status"][status] = 0
            stats["by_status"][status] += count
        
        # Dernières erreurs
        stats["errors"] = await self.get_errors(limit=10)
        
        return stats


# Instance singleton
adhesion_logger = AdhesionLogger()


def init_adhesion_logger(db):
    """Initialise le logger avec la connexion DB"""
    adhesion_logger.set_db(db)
    logger.info("AdhesionLogger initialisé avec connexion MongoDB")
    return adhesion_logger
