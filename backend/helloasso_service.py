"""
Service d'intégration HelloAsso
Gère la synchronisation des adhérents, paiements et abonnements
"""

import os
import logging
import httpx
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from pathlib import Path

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Configuration HelloAsso
HELLOASSO_API_BASE = "https://api.helloasso.com/v5"
HELLOASSO_AUTH_URL = "https://api.helloasso.com/oauth2/token"
HELLOASSO_CLIENT_ID = os.environ.get('HELLOASSO_CLIENT_ID', '')
HELLOASSO_CLIENT_SECRET = os.environ.get('HELLOASSO_CLIENT_SECRET', '')
HELLOASSO_ORGANIZATION_SLUG = os.environ.get('HELLOASSO_ORGANIZATION_SLUG', 'en-toute-franchise')


class HelloAssoService:
    """
    Service pour interagir avec l'API HelloAsso
    Documentation: https://api.helloasso.com/v5/swagger/ui/index
    """
    
    def __init__(self):
        self.access_token: Optional[str] = None
        self.token_expires_at: Optional[datetime] = None
        self.refresh_token: Optional[str] = None
    
    async def _ensure_authenticated(self) -> bool:
        """S'assure qu'on a un token valide"""
        if not HELLOASSO_CLIENT_ID or not HELLOASSO_CLIENT_SECRET:
            logger.warning("HelloAsso credentials not configured")
            return False
        
        # Token encore valide ?
        if self.access_token and self.token_expires_at:
            if datetime.utcnow() < self.token_expires_at - timedelta(minutes=5):
                return True
        
        # Rafraîchir ou obtenir un nouveau token
        if self.refresh_token:
            return await self._refresh_access_token()
        else:
            return await self._get_access_token()
    
    async def _get_access_token(self) -> bool:
        """Obtient un nouveau token d'accès"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    HELLOASSO_AUTH_URL,
                    data={
                        "grant_type": "client_credentials",
                        "client_id": HELLOASSO_CLIENT_ID,
                        "client_secret": HELLOASSO_CLIENT_SECRET
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.access_token = data["access_token"]
                    self.refresh_token = data.get("refresh_token")
                    expires_in = data.get("expires_in", 3600)
                    self.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
                    logger.info("HelloAsso: Successfully authenticated")
                    return True
                else:
                    logger.error(f"HelloAsso auth failed: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"HelloAsso auth error: {str(e)}")
            return False
    
    async def _refresh_access_token(self) -> bool:
        """Rafraîchit le token d'accès"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    HELLOASSO_AUTH_URL,
                    data={
                        "grant_type": "refresh_token",
                        "client_id": HELLOASSO_CLIENT_ID,
                        "refresh_token": self.refresh_token
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.access_token = data["access_token"]
                    self.refresh_token = data.get("refresh_token", self.refresh_token)
                    expires_in = data.get("expires_in", 3600)
                    self.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
                    return True
                else:
                    # Token refresh failed, get new token
                    self.refresh_token = None
                    return await self._get_access_token()
                    
        except Exception as e:
            logger.error(f"HelloAsso token refresh error: {str(e)}")
            self.refresh_token = None
            return await self._get_access_token()
    
    def _get_headers(self) -> dict:
        """Retourne les headers pour les requêtes API"""
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
    
    async def get_organization_forms(self) -> List[Dict[str, Any]]:
        """
        Récupère tous les formulaires de l'organisation (adhésions, dons, etc.)
        """
        if not await self._ensure_authenticated():
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{HELLOASSO_API_BASE}/organizations/{HELLOASSO_ORGANIZATION_SLUG}/forms",
                    headers=self._get_headers(),
                    params={"pageSize": 100}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("data", [])
                else:
                    logger.error(f"HelloAsso get forms error: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"HelloAsso get forms error: {str(e)}")
            return []
    
    async def get_membership_forms(self) -> List[Dict[str, Any]]:
        """
        Récupère uniquement les formulaires d'adhésion
        """
        if not await self._ensure_authenticated():
            return []
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{HELLOASSO_API_BASE}/organizations/{HELLOASSO_ORGANIZATION_SLUG}/forms",
                    headers=self._get_headers(),
                    params={
                        "formTypes": "Membership",
                        "pageSize": 100
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data.get("data", [])
                else:
                    logger.error(f"HelloAsso get membership forms error: {response.status_code}")
                    return []
                    
        except Exception as e:
            logger.error(f"HelloAsso get membership forms error: {str(e)}")
            return []
    
    async def get_form_orders(
        self, 
        form_type: str, 
        form_slug: str,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        page_index: int = 1,
        page_size: int = 100
    ) -> Dict[str, Any]:
        """
        Récupère les commandes/paiements d'un formulaire spécifique
        """
        if not await self._ensure_authenticated():
            return {"data": [], "pagination": {}}
        
        try:
            params = {
                "pageIndex": page_index,
                "pageSize": page_size
            }
            
            if from_date:
                params["from"] = from_date.strftime("%Y-%m-%dT%H:%M:%S")
            if to_date:
                params["to"] = to_date.strftime("%Y-%m-%dT%H:%M:%S")
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{HELLOASSO_API_BASE}/organizations/{HELLOASSO_ORGANIZATION_SLUG}/forms/{form_type}/{form_slug}/orders",
                    headers=self._get_headers(),
                    params=params
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"HelloAsso get orders error: {response.status_code}")
                    return {"data": [], "pagination": {}}
                    
        except Exception as e:
            logger.error(f"HelloAsso get orders error: {str(e)}")
            return {"data": [], "pagination": {}}
    
    async def get_all_members(
        self,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Récupère tous les adhérents de tous les formulaires d'adhésion
        Utilisé pour la synchronisation initiale
        """
        all_members = []
        
        # 1. Récupérer les formulaires d'adhésion
        forms = await self.get_membership_forms()
        
        for form in forms:
            form_slug = form.get("formSlug")
            form_type = form.get("formType", "Membership")
            
            if not form_slug:
                continue
            
            logger.info(f"HelloAsso: Fetching members from form {form_slug}")
            
            # 2. Paginer à travers toutes les commandes
            page = 1
            while True:
                result = await self.get_form_orders(
                    form_type=form_type,
                    form_slug=form_slug,
                    from_date=from_date,
                    to_date=to_date,
                    page_index=page,
                    page_size=100
                )
                
                orders = result.get("data", [])
                if not orders:
                    break
                
                for order in orders:
                    # Extraire les infos du payeur
                    payer = order.get("payer", {})
                    
                    member_data = {
                        "email": payer.get("email", "").lower(),
                        "firstName": payer.get("firstName", ""),
                        "lastName": payer.get("lastName", ""),
                        "phone": payer.get("phone"),
                        "address": payer.get("address"),
                        "city": payer.get("city"),
                        "zipCode": payer.get("zipCode"),
                        "country": payer.get("country", "FR"),
                        "helloAssoOrderId": order.get("id"),
                        "formSlug": form_slug,
                        "amount": order.get("amount", {}).get("total", 0) / 100,
                        "paymentDate": order.get("date"),
                        "paymentState": order.get("paymentState"),
                        # Items pour déterminer le type d'adhésion
                        "items": order.get("items", [])
                    }
                    
                    # Ne garder que les paiements validés
                    if member_data["paymentState"] == "Authorized":
                        all_members.append(member_data)
                
                # Vérifier s'il y a plus de pages
                pagination = result.get("pagination", {})
                total_pages = pagination.get("totalPages", 1)
                
                if page >= total_pages:
                    break
                page += 1
        
        logger.info(f"HelloAsso: Found {len(all_members)} total members")
        return all_members
    
    async def get_payments(
        self,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        page_index: int = 1,
        page_size: int = 100
    ) -> Dict[str, Any]:
        """
        Récupère tous les paiements de l'organisation
        """
        if not await self._ensure_authenticated():
            return {"data": [], "pagination": {}}
        
        try:
            params = {
                "pageIndex": page_index,
                "pageSize": page_size
            }
            
            if from_date:
                params["from"] = from_date.strftime("%Y-%m-%dT%H:%M:%S")
            if to_date:
                params["to"] = to_date.strftime("%Y-%m-%dT%H:%M:%S")
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{HELLOASSO_API_BASE}/organizations/{HELLOASSO_ORGANIZATION_SLUG}/payments",
                    headers=self._get_headers(),
                    params=params
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"HelloAsso get payments error: {response.status_code}")
                    return {"data": [], "pagination": {}}
                    
        except Exception as e:
            logger.error(f"HelloAsso get payments error: {str(e)}")
            return {"data": [], "pagination": {}}
    
    async def get_organization_info(self) -> Optional[Dict[str, Any]]:
        """
        Récupère les informations détaillées de l'organisation
        """
        if not await self._ensure_authenticated():
            return None
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{HELLOASSO_API_BASE}/organizations/{HELLOASSO_ORGANIZATION_SLUG}",
                    headers=self._get_headers()
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"HelloAsso get org info error: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"HelloAsso get org info error: {str(e)}")
            return None
    
    async def check_connection(self) -> Dict[str, Any]:
        """
        Vérifie la connexion à HelloAsso et retourne le statut
        """
        if not HELLOASSO_CLIENT_ID or not HELLOASSO_CLIENT_SECRET:
            return {
                "connected": False,
                "error": "HelloAsso credentials not configured",
                "config": {
                    "client_id_set": bool(HELLOASSO_CLIENT_ID),
                    "client_secret_set": bool(HELLOASSO_CLIENT_SECRET),
                    "organization_slug": HELLOASSO_ORGANIZATION_SLUG
                }
            }
        
        if await self._ensure_authenticated():
            # Essayer de récupérer les infos de l'organisation
            org_info = await self.get_organization_info()
            
            if org_info:
                return {
                    "connected": True,
                    "organization": org_info.get("name"),
                    "token_expires_at": self.token_expires_at.isoformat() if self.token_expires_at else None
                }
            else:
                return {
                    "connected": False,
                    "error": "Could not retrieve organization info"
                }
        else:
            return {
                "connected": False,
                "error": "Authentication failed"
            }


# Instance singleton du service
helloasso_service = HelloAssoService()
