from fastapi import APIRouter, HTTPException, Depends, Header, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from datetime import datetime, timedelta
import os
import secrets
import hashlib
import hmac
import logging
from models import (
    MaBoiteDigitaleConfig,
    MaBoiteDigitaleSSORequest,
    MaBoiteDigitaleSSOResponse,
    MaBoiteDigitaleSubscriptionStatus,
    MaBoiteDigitalePartnerStats,
    MaBoiteDigitaleMemberSync
)

logger = logging.getLogger(__name__)
security = HTTPBearer()

partner_router = APIRouter(prefix="/api/partners")

PARTNER_ID = os.environ.get('MABOITEDIGITALE_PARTNER_ID', 'etf')
PARTNER_SECRET = os.environ.get('MABOITEDIGITALE_SECRET', 'dev_secret_change_in_production')
API_BASE_URL = os.environ.get('MABOITEDIGITALE_API_URL', 'https://maboitedigitale.com/api')


def verify_partner_signature(
    partner_id: str,
    timestamp: str,
    signature: str,
    body: str = ""
) -> bool:
    """Vérifie la signature HMAC-SHA256 du partenaire"""
    message = f"{partner_id}{timestamp}{body}"
    expected_signature = hmac.new(
        PARTNER_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected_signature)


async def verify_partner_auth(
    x_partner_id: str = Header(..., alias="X-Partner-ID"),
    x_timestamp: str = Header(..., alias="X-Timestamp"),
    x_signature: str = Header(..., alias="X-Signature")
) -> bool:
    """Dépendance pour vérifier l'authentification partenaire"""
    if x_partner_id != PARTNER_ID:
        raise HTTPException(status_code=401, detail="Partner ID invalide")
    
    timestamp = int(x_timestamp)
    now = int(datetime.utcnow().timestamp())
    
    if abs(now - timestamp) > 300:
        raise HTTPException(status_code=401, detail="Timestamp expiré (5 min max)")
    
    if not verify_partner_signature(x_partner_id, x_timestamp, x_signature):
        raise HTTPException(status_code=401, detail="Signature invalide")
    
    return True


@partner_router.get("/health")
async def health_check():
    """Health check pour le partenaire"""
    return {
        "status": "ok",
        "partner": PARTNER_ID,
        "timestamp": datetime.utcnow().isoformat()
    }


@partner_router.get("/subscription/status")
async def get_subscription_status(
    email: str = Query(...),
    _: bool = Depends(verify_partner_auth)
):
    """
    Vérifie le statut d'abonnement d'un membre ETF
    (Appelé par MaBoiteDigitale pour vérifier l'éligibilité)
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    user = await db.users.find_one({"email": email.lower()})
    
    if not user:
        return {
            "is_member": False,
            "eligible": False
        }
    
    now = datetime.utcnow()
    is_active = user.get("membershipStatus") == "active"
    end_date = user.get("membershipEndDate")
    
    if end_date and end_date < now:
        is_active = False
    
    return {
        "is_member": is_active,
        "eligible": is_active,
        "membership_type": user.get("membershipType") if is_active else None,
        "membership_end_date": end_date.isoformat() if end_date else None,
        "discount_percentage": 20.0 if is_active else 0.0
    }


@partner_router.post("/members/register")
async def register_member(
    member_data: MaBoiteDigitaleMemberSync,
    _: bool = Depends(verify_partner_auth)
):
    """
    Enregistre un nouveau membre ETF
    (Appelé par MaBoiteDigitale lors de la première connexion SSO)
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    user = await db.users.find_one({"email": member_data.email.lower()})
    
    if not user:
        raise HTTPException(status_code=404, detail="Membre non trouvé")
    
    return {
        "success": True,
        "member_number": member_data.member_number,
        "message": "Membre enregistré avec succès"
    }


@partner_router.post("/sso/token")
async def generate_sso_token(
    email: str = Query(...),
    _: bool = Depends(verify_partner_auth)
):
    """
    Génère un token SSO pour connexion automatique
    (Appelé par le frontend ETF pour rediriger vers MaBoiteDigitale)
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    user = await db.users.find_one({"email": email.lower()})
    
    if not user:
        raise HTTPException(status_code=404, detail="Membre non trouvé")
    
    now = datetime.utcnow()
    is_active = user.get("membershipStatus") == "active"
    end_date = user.get("membershipEndDate")
    
    if end_date and end_date < now:
        is_active = False
    
    if not is_active:
        raise HTTPException(status_code=403, detail="Adhésion non active")
    
    token = secrets.token_urlsafe(32)
    expires_at = now + timedelta(minutes=5)
    
    await db.sso_tokens.insert_one({
        "token": token,
        "user_id": user["id"],
        "email": user["email"],
        "first_name": user["firstName"],
        "last_name": user["lastName"],
        "member_number": user.get("id"),
        "partner_id": PARTNER_ID,
        "membership_end_date": end_date,
        "created_at": now,
        "expires_at": expires_at,
        "used": False
    })
    
    logger.info(f"SSO token généré pour {email}")
    
    return {
        "success": True,
        "token": token,
        "expires_at": expires_at.isoformat(),
        "redirect_url": f"{API_BASE_URL}/auth/sso/callback?token={token}&partner={PARTNER_ID}"
    }


@partner_router.put("/members/{member_number}")
async def update_member(
    member_number: str,
    member_data: dict,
    _: bool = Depends(verify_partner_auth)
):
    """
    Met à jour les données d'un membre
    (Appelé par MaBoiteDigitale pour synchroniser les données)
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    result = await db.users.update_one(
        {"id": member_number},
        {"$set": {
            "updatedAt": datetime.utcnow(),
            **member_data
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Membre non trouvé")
    
    return {
        "success": True,
        "message": "Membre mis à jour"
    }


@partner_router.delete("/members/{member_number}")
async def delete_member(
    member_number: str,
    _: bool = Depends(verify_partner_auth)
):
    """
    Supprime un membre (soft delete ou RGPD)
    (Appelé par MaBoiteDigitale en cas de demande de suppression)
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    result = await db.users.update_one(
        {"id": member_number},
        {"$set": {
            "deletedAt": datetime.utcnow(),
            "membershipStatus": "deleted"
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Membre non trouvé")
    
    logger.info(f"Membre supprimé: {member_number}")
    
    return {
        "success": True,
        "message": "Membre supprimé"
    }
