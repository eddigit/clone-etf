"""
Service d'intégration MaBoiteDigitale.com
Gère la connexion API entre ETF et la plateforme d'outils IA
"""

import os
import logging
import httpx
import secrets
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Configuration MaBoiteDigitale
MABOITEDIGITALE_API_URL = os.environ.get('MABOITEDIGITALE_API_URL', 'https://maboitedigitale.com/api')
MABOITEDIGITALE_API_KEY = os.environ.get('MABOITEDIGITALE_API_KEY', '')
MABOITEDIGITALE_SECRET = os.environ.get('MABOITEDIGITALE_SECRET', '')
MABOITEDIGITALE_PARTNER_ID = os.environ.get('MABOITEDIGITALE_PARTNER_ID', 'etf')


class MaBoiteDigitaleService:
    """
    Service pour interagir avec l'API MaBoiteDigitale.com
    Gère:
    - Génération de tokens SSO pour connexion transparente
    - Vérification du statut d'abonnement IA
    - Synchronisation des avantages adhérents
    """
    
    def __init__(self):
        self.api_url = MABOITEDIGITALE_API_URL
        self.api_key = MABOITEDIGITALE_API_KEY
        self.secret = MABOITEDIGITALE_SECRET
        self.partner_id = MABOITEDIGITALE_PARTNER_ID
    
    def is_configured(self) -> bool:
        """Vérifie si le service est configuré"""
        return bool(self.api_key and self.secret)
    
    def _generate_signature(self, data: Dict[str, Any]) -> str:
        """Génère une signature HMAC pour sécuriser les requêtes"""
        if not self.secret:
            return ""
        
        # Créer une chaîne à signer
        sorted_data = "&".join(f"{k}={v}" for k, v in sorted(data.items()))
        signature = hmac.new(
            self.secret.encode(),
            sorted_data.encode(),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    async def generate_sso_token(
        self,
        user_id: str,
        email: str,
        member_number: str,
        first_name: str,
        last_name: str,
        membership_type: str,
        membership_end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Génère un token SSO pour connexion transparente à MaBoiteDigitale
        
        Returns:
            {
                "success": bool,
                "token": str (JWT ou token temporaire),
                "redirect_url": str (URL complète avec token),
                "expires_at": datetime
            }
        """
        if not self.is_configured():
            # Mode développement : générer un token local
            token = secrets.token_urlsafe(32)
            return {
                "success": True,
                "token": token,
                "redirect_url": f"https://maboitedigitale.com/sso?token={token}&partner={self.partner_id}",
                "expires_at": datetime.utcnow() + timedelta(minutes=10),
                "dev_mode": True,
                "message": "Mode développement - API MaBoiteDigitale non configurée"
            }
        
        try:
            payload = {
                "partner_id": self.partner_id,
                "user_id": user_id,
                "email": email,
                "member_number": member_number,
                "first_name": first_name,
                "last_name": last_name,
                "membership_type": membership_type,
                "membership_end_date": membership_end_date.isoformat() if membership_end_date else None,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            signature = self._generate_signature(payload)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_url}/partners/sso/token",
                    json=payload,
                    headers={
                        "X-API-Key": self.api_key,
                        "X-Signature": signature,
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"SSO token generated for {email}")
                    return {
                        "success": True,
                        "token": data.get("token"),
                        "redirect_url": data.get("redirect_url"),
                        "expires_at": datetime.fromisoformat(data.get("expires_at"))
                    }
                else:
                    logger.error(f"MaBoiteDigitale SSO error: {response.status_code} - {response.text}")
                    return {
                        "success": False,
                        "error": f"Erreur API: {response.status_code}",
                        "message": "Impossible de générer le token SSO"
                    }
                    
        except Exception as e:
            logger.error(f"MaBoiteDigitale SSO exception: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Erreur de connexion à MaBoiteDigitale"
            }
    
    async def check_subscription_status(
        self,
        email: str,
        member_number: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Vérifie le statut d'abonnement IA sur MaBoiteDigitale
        
        Returns:
            {
                "has_subscription": bool,
                "plan_name": str,
                "plan_type": str (free, pro, premium),
                "tokens_remaining": int,
                "subscription_end_date": datetime,
                "discount_applied": bool
            }
        """
        if not self.is_configured():
            # Mode développement : retourner un statut fictif
            return {
                "has_subscription": False,
                "plan_name": None,
                "plan_type": None,
                "tokens_remaining": 0,
                "subscription_end_date": None,
                "discount_applied": False,
                "dev_mode": True,
                "message": "Mode développement - API MaBoiteDigitale non configurée"
            }
        
        try:
            params = {"email": email, "partner_id": self.partner_id}
            if member_number:
                params["member_number"] = member_number
            
            signature = self._generate_signature(params)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.api_url}/partners/subscription/status",
                    params=params,
                    headers={
                        "X-API-Key": self.api_key,
                        "X-Signature": signature
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "has_subscription": data.get("active", False),
                        "plan_name": data.get("plan_name"),
                        "plan_type": data.get("plan_type"),
                        "tokens_remaining": data.get("tokens_remaining", 0),
                        "subscription_end_date": datetime.fromisoformat(data["end_date"]) if data.get("end_date") else None,
                        "discount_applied": data.get("etf_discount", False)
                    }
                elif response.status_code == 404:
                    return {
                        "has_subscription": False,
                        "plan_name": None,
                        "plan_type": None,
                        "tokens_remaining": 0,
                        "subscription_end_date": None,
                        "discount_applied": False
                    }
                else:
                    logger.error(f"MaBoiteDigitale status error: {response.status_code}")
                    return {
                        "has_subscription": False,
                        "error": f"Erreur API: {response.status_code}"
                    }
                    
        except Exception as e:
            logger.error(f"MaBoiteDigitale status exception: {str(e)}")
            return {
                "has_subscription": False,
                "error": str(e)
            }
    
    async def register_etf_member(
        self,
        email: str,
        member_number: str,
        first_name: str,
        last_name: str,
        membership_type: str,
        membership_end_date: datetime,
        discount_percentage: float = 20.0
    ) -> Dict[str, Any]:
        """
        Enregistre ou met à jour un membre ETF sur MaBoiteDigitale
        pour lui attribuer sa réduction partenaire
        
        Returns:
            {
                "success": bool,
                "discount_code": str,
                "discount_percentage": float,
                "message": str
            }
        """
        if not self.is_configured():
            return {
                "success": True,
                "discount_code": f"ETF-{member_number}",
                "discount_percentage": discount_percentage,
                "dev_mode": True,
                "message": "Mode développement - Membre enregistré localement"
            }
        
        try:
            payload = {
                "partner_id": self.partner_id,
                "email": email,
                "member_number": member_number,
                "first_name": first_name,
                "last_name": last_name,
                "membership_type": membership_type,
                "membership_end_date": membership_end_date.isoformat(),
                "discount_percentage": discount_percentage
            }
            
            signature = self._generate_signature(payload)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_url}/partners/members/register",
                    json=payload,
                    headers={
                        "X-API-Key": self.api_key,
                        "X-Signature": signature,
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    logger.info(f"Member {email} registered on MaBoiteDigitale")
                    return {
                        "success": True,
                        "discount_code": data.get("discount_code"),
                        "discount_percentage": data.get("discount_percentage", discount_percentage),
                        "message": "Membre enregistré avec succès"
                    }
                else:
                    logger.error(f"MaBoiteDigitale register error: {response.status_code}")
                    return {
                        "success": False,
                        "error": f"Erreur API: {response.status_code}",
                        "message": "Impossible d'enregistrer le membre"
                    }
                    
        except Exception as e:
            logger.error(f"MaBoiteDigitale register exception: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "message": "Erreur de connexion à MaBoiteDigitale"
            }
    
    async def check_connection(self) -> Dict[str, Any]:
        """
        Vérifie le statut de la connexion à MaBoiteDigitale
        
        Returns:
            {
                "connected": bool,
                "api_url": str,
                "partner_id": str,
                "configured": bool,
                "message": str
            }
        """
        if not self.is_configured():
            return {
                "connected": False,
                "api_url": self.api_url,
                "partner_id": self.partner_id,
                "configured": False,
                "message": "Credentials API non configurés"
            }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.api_url}/partners/health",
                    headers={"X-API-Key": self.api_key}
                )
                
                if response.status_code == 200:
                    return {
                        "connected": True,
                        "api_url": self.api_url,
                        "partner_id": self.partner_id,
                        "configured": True,
                        "message": "Connexion établie"
                    }
                else:
                    return {
                        "connected": False,
                        "api_url": self.api_url,
                        "partner_id": self.partner_id,
                        "configured": True,
                        "message": f"Erreur API: {response.status_code}"
                    }
                    
        except httpx.ConnectError:
            return {
                "connected": False,
                "api_url": self.api_url,
                "partner_id": self.partner_id,
                "configured": True,
                "message": "Impossible de joindre le serveur"
            }
        except Exception as e:
            return {
                "connected": False,
                "api_url": self.api_url,
                "partner_id": self.partner_id,
                "configured": True,
                "message": f"Erreur: {str(e)}"
            }
    
    async def get_partner_stats(self) -> Dict[str, Any]:
        """
        Récupère les statistiques du partenariat ETF
        
        Returns:
            {
                "total_members_registered": int,
                "active_subscriptions": int,
                "total_revenue_shared": float,
                "discount_usage": int
            }
        """
        if not self.is_configured():
            return {
                "total_members_registered": 0,
                "active_subscriptions": 0,
                "total_revenue_shared": 0.0,
                "discount_usage": 0,
                "dev_mode": True,
                "message": "Mode développement - Statistiques non disponibles"
            }
        
        try:
            params = {"partner_id": self.partner_id}
            signature = self._generate_signature(params)
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.api_url}/partners/stats",
                    params=params,
                    headers={
                        "X-API-Key": self.api_key,
                        "X-Signature": signature
                    }
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {
                        "error": f"Erreur API: {response.status_code}",
                        "total_members_registered": 0,
                        "active_subscriptions": 0
                    }
                    
        except Exception as e:
            logger.error(f"MaBoiteDigitale stats exception: {str(e)}")
            return {
                "error": str(e),
                "total_members_registered": 0,
                "active_subscriptions": 0
            }


# Instance singleton
maboitedigitale_service = MaBoiteDigitaleService()
