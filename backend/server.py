from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, Query, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from typing import Optional, List
from datetime import datetime, timedelta
import os
import logging
import uuid
import secrets
import hashlib

from models import (
    UserCreate, UserLogin, User, UserProfile, TokenResponse, MessageResponse,
    ConversationCreate, Conversation, MessageCreate, Message, ConversationResponse,
    DocumentBase, Document, Resource, Subscription, Invoice, 
    ContactMessage, ContactMessageDB, Article,
    # New models for HelloAsso, Coupons, External API
    Coupon, CouponCreate, CouponValidation, CouponValidationResponse,
    ApiKey, HelloAssoPayment, HelloAssoMember, MembershipVerification,
    AdminStats, MemberListItem
)
from auth_utils import hash_password, verify_password, create_access_token, decode_access_token
from helloasso_service import helloasso_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Environment configuration
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')

# Create the main app without a prefix
app = FastAPI(title="En Toute Franchise API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================== EXTERNAL API CONFIG =====================
# Clé API pour la Boîte à Outils Digitale (à configurer dans .env)
EXTERNAL_API_KEY = os.environ.get('EXTERNAL_API_KEY', 'dev_external_key_change_in_production')
HELLOASSO_WEBHOOK_SECRET = os.environ.get('HELLOASSO_WEBHOOK_SECRET', '')

# ===================== UTILITY FUNCTIONS =====================
def generate_coupon_code(user_id: str) -> str:
    """Génère un code coupon unique pour un adhérent"""
    random_part = secrets.token_hex(4).upper()
    year = datetime.utcnow().year
    return f"ETF{year}-{random_part}"

def hash_api_key(key: str) -> str:
    """Hash une clé API"""
    return hashlib.sha256(key.encode()).hexdigest()

async def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")) -> bool:
    """Vérifie la clé API pour les requêtes externes"""
    if x_api_key == EXTERNAL_API_KEY:
        return True
    # Vérifier aussi dans la base de données
    hashed = hash_api_key(x_api_key)
    api_key = await db.api_keys.find_one({"key": hashed, "isActive": True})
    if api_key:
        await db.api_keys.update_one(
            {"_id": api_key["_id"]},
            {"$set": {"lastUsed": datetime.utcnow()}}
        )
        return True
    raise HTTPException(status_code=401, detail="Clé API invalide")

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Vérifie que l'utilisateur est admin"""
    user = await get_current_user(credentials)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return user

# ===================== AUTH DEPENDENCY =====================
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
    
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token invalide")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    
    return user

# ===================== AUTH ROUTES =====================
@api_router.post("/auth/register", response_model=MessageResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    # Create user
    user_dict = user_data.model_dump()
    user_dict["password"] = hash_password(user_data.password)
    
    user = User(**user_dict)
    
    # Set membership end date (1 year from now)
    user.membershipEndDate = user.membershipStartDate + timedelta(days=365)
    
    await db.users.insert_one(user.model_dump())
    
    logger.info(f"New user registered: {user.email}")
    return {"message": "Inscription réussie"}

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    # Create access token
    token = create_access_token({"user_id": user["id"]})
    
    logger.info(f"User logged in: {user['email']}")
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "firstName": user["firstName"],
            "lastName": user["lastName"],
            "role": user["role"]
        }
    }

# ===================== USER ROUTES =====================
@api_router.get("/users/profile", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return UserProfile(**current_user)

@api_router.put("/users/profile", response_model=UserProfile)
async def update_profile(
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile"""
    # Remove fields that shouldn't be updated
    update_data.pop("password", None)
    update_data.pop("id", None)
    update_data.pop("role", None)
    update_data["updatedAt"] = datetime.utcnow()
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one({"id": current_user["id"]})
    return UserProfile(**updated_user)

# ===================== AI ASSISTANT ROUTES =====================
@api_router.post("/ai/conversations", response_model=ConversationResponse)
async def create_conversation(
    conv_data: ConversationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new AI conversation"""
    conversation = Conversation(
        userId=current_user["id"],
        title=conv_data.title
    )
    
    await db.ai_conversations.insert_one(conversation.model_dump())
    
    return {
        "conversationId": conversation.id,
        "title": conversation.title,
        "createdAt": conversation.createdAt
    }

@api_router.get("/ai/conversations", response_model=List[Conversation])
async def get_conversations(current_user: dict = Depends(get_current_user)):
    """Get all user conversations"""
    conversations = await db.ai_conversations.find(
        {"userId": current_user["id"]}
    ).sort("updatedAt", -1).to_list(100)
    
    return [Conversation(**conv) for conv in conversations]

@api_router.post("/ai/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send a message and get AI response"""
    # Verify conversation belongs to user
    conversation = await db.ai_conversations.find_one({
        "id": conversation_id,
        "userId": current_user["id"]
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    # Save user message
    user_message = Message(
        conversationId=conversation_id,
        userId=current_user["id"],
        role="user",
        content=message_data.content
    )
    await db.ai_messages.insert_one(user_message.model_dump())
    
    # TODO: Call OpenAI API here when API key is configured
    # For now, return a mock response
    ai_response_content = """Bonjour ! Je suis l'assistant d'orientation d'En Toute Franchise.

⚠️ **IMPORTANT** : Je suis un outil d'information basé sur 30 ans d'expérience de l'association. Je ne suis pas un avocat et mes réponses ne constituent pas un conseil juridique professionnel.

**Ce que je peux faire :**
- Vous orienter sur la base de l'expérience de l'association
- Partager des informations sur des situations similaires rencontrées
- Vous aider à identifier les questions importantes à poser
- Vous orienter vers les bonnes ressources ou avocats partenaires si nécessaire

**Ce que je ne peux pas faire :**
- Fournir un conseil juridique officiel
- Remplacer un avocat dans votre situation
- Garantir un résultat juridique

Pour des conseils juridiques professionnels, nous vous orienterons vers nos avocats partenaires.

Comment puis-je vous aider aujourd'hui ?

📝 Note technique : Les réponses sont actuellement mockées. L'intégration OpenAI sera ajoutée avec la configuration des clés API."""
    
    ai_message = Message(
        conversationId=conversation_id,
        userId=current_user["id"],
        role="assistant",
        content=ai_response_content
    )
    await db.ai_messages.insert_one(ai_message.model_dump())
    
    # Update conversation
    await db.ai_conversations.update_one(
        {"id": conversation_id},
        {
            "$set": {"updatedAt": datetime.utcnow()},
            "$inc": {"messagesCount": 2}
        }
    )
    
    return {
        "userMessage": user_message.model_dump(),
        "aiMessage": ai_message.model_dump()
    }

@api_router.get("/ai/conversations/{conversation_id}/messages", response_model=List[Message])
async def get_messages(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get conversation messages"""
    # Verify conversation belongs to user
    conversation = await db.ai_conversations.find_one({
        "id": conversation_id,
        "userId": current_user["id"]
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    messages = await db.ai_messages.find(
        {"conversationId": conversation_id}
    ).sort("timestamp", 1).to_list(1000)
    
    return [Message(**msg) for msg in messages]

# ===================== DOCUMENTS ROUTES =====================
@api_router.post("/documents/upload", response_model=Document)
async def upload_document(
    file: UploadFile = File(...),
    type: str = "Administratif",
    current_user: dict = Depends(get_current_user)
):
    """Upload a document"""
    # Create uploads directory if it doesn't exist
    upload_dir = Path("/app/backend/uploads")
    upload_dir.mkdir(exist_ok=True)
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_dir / unique_filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Get file size
    file_size = len(content)
    size_str = f"{file_size / 1024:.0f} KB" if file_size < 1024 * 1024 else f"{file_size / (1024 * 1024):.1f} MB"
    
    # Create document record
    document = Document(
        userId=current_user["id"],
        name=file.filename,
        originalName=file.filename,
        size=size_str,
        type=type,
        filePath=str(file_path)
    )
    
    await db.documents.insert_one(document.model_dump())
    
    return document

@api_router.get("/documents", response_model=List[Document])
async def get_documents(current_user: dict = Depends(get_current_user)):
    """Get all user documents"""
    documents = await db.documents.find(
        {"userId": current_user["id"]}
    ).sort("uploadDate", -1).to_list(100)
    
    return [Document(**doc) for doc in documents]

@api_router.delete("/documents/{document_id}", response_model=MessageResponse)
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a document"""
    document = await db.documents.find_one({
        "id": document_id,
        "userId": current_user["id"]
    })
    
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    # Delete file
    try:
        Path(document["filePath"]).unlink(missing_ok=True)
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
    
    # Delete from database
    await db.documents.delete_one({"id": document_id})
    
    return {"message": "Document supprimé avec succès"}

# ===================== RESOURCES ROUTES =====================
@api_router.get("/resources", response_model=List[Resource])
async def get_resources(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get available resources"""
    query = {}
    
    if category:
        query["category"] = category
    
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    
    resources = await db.resources.find(query).to_list(100)
    
    return [Resource(**res) for res in resources]

# ===================== SUBSCRIPTION ROUTES =====================
@api_router.get("/subscriptions/current")
async def get_current_subscription(current_user: dict = Depends(get_current_user)):
    """Get current subscription"""
    subscription = await db.subscriptions.find_one({"userId": current_user["id"]})
    
    membership = {
        "type": current_user.get("membershipType", "individual"),
        "price": "50€",
        "status": current_user.get("membershipStatus", "active"),
        "startDate": current_user.get("membershipStartDate"),
        "endDate": current_user.get("membershipEndDate")
    }
    
    ai_plan = None
    if subscription and subscription.get("aiPlan"):
        ai_plan = subscription["aiPlan"]
    
    return {
        "membership": membership,
        "aiPlan": ai_plan
    }

@api_router.get("/subscriptions/invoices", response_model=List[Invoice])
async def get_invoices(current_user: dict = Depends(get_current_user)):
    """Get billing history"""
    invoices = await db.invoices.find(
        {"userId": current_user["id"]}
    ).sort("date", -1).to_list(100)
    
    return [Invoice(**inv) for inv in invoices]

# ===================== CONTACT ROUTES =====================
@api_router.post("/contact", response_model=MessageResponse)
async def send_contact_message(message_data: ContactMessage):
    """Send a contact message"""
    contact_message = ContactMessageDB(**message_data.model_dump())
    await db.contact_messages.insert_one(contact_message.model_dump())
    
    logger.info(f"New contact message from: {message_data.email}")
    return {"message": "Message envoyé avec succès"}

# ===================== ARTICLES ROUTES =====================
@api_router.get("/articles", response_model=List[Article])
async def get_articles(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category: Optional[str] = Query(None)
):
    """Get blog articles"""
    query = {}
    if category:
        query["category"] = category
    
    articles = await db.articles.find(query).sort("createdAt", -1).skip(offset).limit(limit).to_list(limit)
    
    return [Article(**article) for article in articles]

# ===================== HELLOASSO WEBHOOK =====================
@api_router.post("/webhooks/helloasso")
async def helloasso_webhook(request: Request):
    """
    Webhook pour recevoir les notifications HelloAsso
    Crée ou met à jour un adhérent lors d'un paiement
    """
    try:
        payload = await request.json()
        logger.info(f"HelloAsso webhook received: {payload.get('eventType', 'unknown')}")
        
        event_type = payload.get("eventType", "")
        data = payload.get("data", {})
        
        # Traiter uniquement les paiements validés
        if event_type not in ["Payment", "Order"]:
            return {"status": "ignored", "reason": "Event type not handled"}
        
        # Extraire les informations du payeur
        payer = data.get("payer", {})
        email = payer.get("email", "").lower()
        first_name = payer.get("firstName", "")
        last_name = payer.get("lastName", "")
        
        if not email:
            logger.warning("HelloAsso webhook: No email in payload")
            return {"status": "error", "reason": "No email provided"}
        
        # Déterminer le type d'adhésion selon le formulaire
        form_slug = data.get("formSlug", "")
        amount = data.get("amount", 0) / 100  # HelloAsso envoie en centimes
        
        # Mapper le formulaire au type d'adhésion
        membership_mapping = {
            "adhesion-2025-particuliers": "individual",
            "adhesion-2025-commercants-artisans": "professional",
            "adhesion-2025-entreprises": "professional_plus",
            "adhesion-2025-associations": "association",
            "adhesion-2026-particuliers": "individual",
            "adhesion-2026-commercants-artisans": "professional",
            "adhesion-2026-entreprises": "professional_plus",
            "adhesion-2026-associations": "association",
        }
        membership_type = membership_mapping.get(form_slug, "individual")
        
        # Vérifier si l'utilisateur existe déjà
        existing_user = await db.users.find_one({"email": email})
        
        now = datetime.utcnow()
        end_date = now + timedelta(days=365)
        
        if existing_user:
            # Mettre à jour l'adhésion existante
            await db.users.update_one(
                {"email": email},
                {
                    "$set": {
                        "membershipStatus": "active",
                        "membershipType": membership_type,
                        "membershipStartDate": now,
                        "membershipEndDate": end_date,
                        "updatedAt": now
                    }
                }
            )
            user_id = existing_user["id"]
            logger.info(f"HelloAsso: Updated membership for {email}")
        else:
            # Créer un nouvel utilisateur
            # Générer un mot de passe temporaire (l'utilisateur devra le réinitialiser)
            temp_password = secrets.token_urlsafe(12)
            
            new_user = User(
                email=email,
                firstName=first_name,
                lastName=last_name,
                password=hash_password(temp_password),
                membershipType=membership_type,
                membershipStatus="active",
                membershipStartDate=now,
                membershipEndDate=end_date
            )
            await db.users.insert_one(new_user.model_dump())
            user_id = new_user.id
            logger.info(f"HelloAsso: Created new user {email}")
            
            # TODO: Envoyer un email de bienvenue avec le mot de passe temporaire
        
        # Générer un coupon pour l'adhérent (Boîte à Outils)
        existing_coupon = await db.coupons.find_one({
            "userId": user_id,
            "isActive": True,
            "validUntil": {"$gt": now}
        })
        
        if not existing_coupon:
            coupon = Coupon(
                code=generate_coupon_code(user_id),
                userId=user_id,
                userEmail=email,
                discountType="percentage",
                discountValue=20.0,  # 20% de remise pour les adhérents
                applicableTo=["website", "coaching"],
                maxUses=10,  # Utilisable 10 fois par an
                validFrom=now,
                validUntil=end_date
            )
            await db.coupons.insert_one(coupon.model_dump())
            logger.info(f"Created coupon {coupon.code} for {email}")
        
        # Enregistrer le paiement HelloAsso
        await db.helloasso_payments.insert_one({
            "orderId": data.get("id"),
            "paymentId": data.get("paymentId"),
            "email": email,
            "amount": amount,
            "formSlug": form_slug,
            "membershipType": membership_type,
            "rawData": payload,
            "processedAt": now
        })
        
        return {"status": "success", "userId": user_id}
        
    except Exception as e:
        logger.error(f"HelloAsso webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== EXTERNAL API (Boîte à Outils) =====================
@api_router.get("/external/verify-membership", response_model=MembershipVerification)
async def verify_membership(
    email: str = Query(..., description="Email de l'adhérent à vérifier"),
    _: bool = Depends(verify_api_key)
):
    """
    Vérifie si un email correspond à un adhérent actif.
    Utilisé par la Boîte à Outils Digitale pour accorder des remises.
    Nécessite une clé API valide dans le header X-API-Key.
    """
    user = await db.users.find_one({"email": email.lower()})
    
    if not user:
        return MembershipVerification(isMember=False)
    
    now = datetime.utcnow()
    is_active = user.get("membershipStatus") == "active"
    end_date = user.get("membershipEndDate")
    
    # Vérifier si l'adhésion n'est pas expirée
    if end_date and end_date < now:
        is_active = False
        # Mettre à jour le statut si expiré
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"membershipStatus": "expired"}}
        )
    
    if not is_active:
        return MembershipVerification(
            isMember=False,
            membershipStatus="expired"
        )
    
    # Récupérer le coupon actif de l'adhérent
    coupon = await db.coupons.find_one({
        "userId": user["id"],
        "isActive": True,
        "validUntil": {"$gt": now}
    })
    
    discount_info = None
    if coupon and coupon["currentUses"] < coupon["maxUses"]:
        discount_info = {
            "percentage": coupon["discountValue"] if coupon["discountType"] == "percentage" else None,
            "fixed": coupon["discountValue"] if coupon["discountType"] == "fixed" else None,
            "code": coupon["code"]
        }
    
    return MembershipVerification(
        isMember=True,
        membershipType=user.get("membershipType"),
        membershipStatus="active",
        membershipEndDate=end_date,
        firstName=user.get("firstName"),
        lastName=user.get("lastName"),
        discount=discount_info
    )

@api_router.post("/external/validate-coupon", response_model=CouponValidationResponse)
async def validate_coupon(
    data: CouponValidation,
    _: bool = Depends(verify_api_key)
):
    """
    Valide un code coupon et retourne les informations de remise.
    Utilisé par la Boîte à Outils Digitale lors du paiement.
    Nécessite une clé API valide dans le header X-API-Key.
    """
    now = datetime.utcnow()
    
    coupon = await db.coupons.find_one({
        "code": data.code.upper(),
        "isActive": True
    })
    
    if not coupon:
        return CouponValidationResponse(
            valid=False,
            message="Code coupon invalide"
        )
    
    # Vérifier l'email
    if coupon["userEmail"].lower() != data.email.lower():
        return CouponValidationResponse(
            valid=False,
            message="Ce coupon n'est pas associé à cet email"
        )
    
    # Vérifier la validité temporelle
    if coupon.get("validUntil") and coupon["validUntil"] < now:
        return CouponValidationResponse(
            valid=False,
            message="Ce coupon a expiré"
        )
    
    # Vérifier le nombre d'utilisations
    if coupon["currentUses"] >= coupon["maxUses"]:
        return CouponValidationResponse(
            valid=False,
            message="Ce coupon a atteint son nombre maximum d'utilisations"
        )
    
    # Vérifier le service si spécifié
    if data.service and data.service not in coupon["applicableTo"]:
        return CouponValidationResponse(
            valid=False,
            message=f"Ce coupon n'est pas valable pour le service '{data.service}'"
        )
    
    return CouponValidationResponse(
        valid=True,
        discount=coupon["discountValue"],
        discountType=coupon["discountType"],
        applicableTo=coupon["applicableTo"],
        message="Coupon valide"
    )

@api_router.post("/external/use-coupon")
async def use_coupon(
    data: CouponValidation,
    _: bool = Depends(verify_api_key)
):
    """
    Marque un coupon comme utilisé (incrémente le compteur).
    À appeler après un paiement réussi sur la Boîte à Outils.
    """
    result = await db.coupons.update_one(
        {
            "code": data.code.upper(),
            "userEmail": data.email.lower(),
            "isActive": True
        },
        {"$inc": {"currentUses": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Coupon non trouvé")
    
    logger.info(f"Coupon {data.code} used by {data.email}")
    return {"status": "success", "message": "Utilisation enregistrée"}

# ===================== ADMIN ROUTES =====================
@api_router.get("/admin/stats", response_model=AdminStats)
async def get_admin_stats(current_user: dict = Depends(get_admin_user)):
    """Récupère les statistiques pour le dashboard admin"""
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Compter les membres
    total_members = await db.users.count_documents({"role": "user"})
    active_members = await db.users.count_documents({
        "role": "user",
        "membershipStatus": "active"
    })
    expired_members = total_members - active_members
    
    new_this_month = await db.users.count_documents({
        "role": "user",
        "createdAt": {"$gte": start_of_month}
    })
    
    # Compter les coupons
    total_coupons = await db.coupons.count_documents({})
    used_coupons = await db.coupons.count_documents({"currentUses": {"$gt": 0}})
    
    return AdminStats(
        totalMembers=total_members,
        activeMembers=active_members,
        expiredMembers=expired_members,
        newMembersThisMonth=new_this_month,
        totalCoupons=total_coupons,
        usedCoupons=used_coupons
    )

@api_router.get("/admin/members", response_model=List[MemberListItem])
async def get_admin_members(
    current_user: dict = Depends(get_admin_user),
    status: Optional[str] = Query(None, description="active ou expired"),
    membership_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None, description="Recherche par email ou nom"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Liste des membres pour l'admin avec filtres"""
    query = {"role": "user"}
    
    if status:
        query["membershipStatus"] = status
    if membership_type:
        query["membershipType"] = membership_type
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"firstName": {"$regex": search, "$options": "i"}},
            {"lastName": {"$regex": search, "$options": "i"}},
            {"businessName": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(query).sort("createdAt", -1).skip(offset).limit(limit).to_list(limit)
    
    result = []
    for user in users:
        # Récupérer le coupon de l'utilisateur
        coupon = await db.coupons.find_one({"userId": user["id"], "isActive": True})
        
        result.append(MemberListItem(
            id=user["id"],
            email=user["email"],
            firstName=user["firstName"],
            lastName=user["lastName"],
            businessName=user.get("businessName"),
            membershipType=user["membershipType"],
            membershipStatus=user["membershipStatus"],
            membershipEndDate=user.get("membershipEndDate"),
            createdAt=user["createdAt"],
            couponCode=coupon["code"] if coupon else None
        ))
    
    return result

@api_router.get("/admin/members/{member_id}")
async def get_admin_member_detail(
    member_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Détail complet d'un membre"""
    user = await db.users.find_one({"id": member_id})
    if not user:
        raise HTTPException(status_code=404, detail="Membre non trouvé")
    
    # Récupérer les coupons
    coupons = await db.coupons.find({"userId": member_id}).to_list(100)
    
    # Récupérer les paiements HelloAsso
    payments = await db.helloasso_payments.find({"email": user["email"]}).to_list(100)
    
    # Retirer le mot de passe
    user.pop("password", None)
    
    return {
        "user": user,
        "coupons": coupons,
        "payments": payments
    }

@api_router.post("/admin/members/{member_id}/generate-coupon")
async def admin_generate_coupon(
    member_id: str,
    coupon_data: CouponCreate,
    current_user: dict = Depends(get_admin_user)
):
    """Génère un nouveau coupon pour un membre"""
    user = await db.users.find_one({"id": member_id})
    if not user:
        raise HTTPException(status_code=404, detail="Membre non trouvé")
    
    now = datetime.utcnow()
    end_date = user.get("membershipEndDate") or (now + timedelta(days=365))
    
    coupon = Coupon(
        code=generate_coupon_code(member_id),
        userId=member_id,
        userEmail=user["email"],
        discountType=coupon_data.discountType,
        discountValue=coupon_data.discountValue,
        applicableTo=coupon_data.applicableTo,
        maxUses=coupon_data.maxUses,
        validFrom=now,
        validUntil=end_date
    )
    
    await db.coupons.insert_one(coupon.model_dump())
    logger.info(f"Admin {current_user['email']} created coupon {coupon.code} for {user['email']}")
    
    return {"status": "success", "coupon": coupon.model_dump()}

@api_router.put("/admin/members/{member_id}/status")
async def admin_update_member_status(
    member_id: str,
    status: str = Query(..., description="active ou expired"),
    current_user: dict = Depends(get_admin_user)
):
    """Met à jour le statut d'adhésion d'un membre"""
    if status not in ["active", "expired"]:
        raise HTTPException(status_code=400, detail="Statut invalide")
    
    result = await db.users.update_one(
        {"id": member_id},
        {"$set": {"membershipStatus": status, "updatedAt": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Membre non trouvé")
    
    logger.info(f"Admin {current_user['email']} updated status of {member_id} to {status}")
    return {"status": "success", "newStatus": status}

@api_router.post("/admin/api-keys")
async def create_api_key(
    name: str = Query(..., description="Nom de l'application"),
    current_user: dict = Depends(get_admin_user)
):
    """Crée une nouvelle clé API pour une application externe"""
    raw_key = f"etf_{secrets.token_urlsafe(32)}"
    hashed_key = hash_api_key(raw_key)
    
    api_key = ApiKey(
        name=name,
        key=hashed_key,
        keyPrefix=raw_key[:12],
        createdBy=current_user["id"]
    )
    
    await db.api_keys.insert_one(api_key.model_dump())
    logger.info(f"Admin {current_user['email']} created API key for {name}")
    
    # Retourner la clé brute une seule fois
    return {
        "status": "success",
        "apiKey": raw_key,
        "message": "Conservez cette clé, elle ne sera plus affichée"
    }

@api_router.get("/admin/api-keys")
async def list_api_keys(current_user: dict = Depends(get_admin_user)):
    """Liste les clés API (sans les clés elles-mêmes)"""
    keys = await db.api_keys.find({}).to_list(100)
    return [
        {
            "id": k["id"],
            "name": k["name"],
            "keyPrefix": k["keyPrefix"],
            "isActive": k["isActive"],
            "lastUsed": k.get("lastUsed"),
            "createdAt": k["createdAt"]
        }
        for k in keys
    ]

@api_router.delete("/admin/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Révoque une clé API"""
    result = await db.api_keys.update_one(
        {"id": key_id},
        {"$set": {"isActive": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Clé non trouvée")
    
    logger.info(f"Admin {current_user['email']} revoked API key {key_id}")
    return {"status": "success"}

# ===================== HELLOASSO ADMIN ROUTES =====================
@api_router.get("/admin/helloasso/status")
async def get_helloasso_status(current_user: dict = Depends(get_admin_user)):
    """Vérifie le statut de la connexion HelloAsso"""
    status = await helloasso_service.check_connection()
    return status

@api_router.get("/admin/helloasso/forms")
async def get_helloasso_forms(current_user: dict = Depends(get_admin_user)):
    """Récupère la liste des formulaires HelloAsso"""
    forms = await helloasso_service.get_organization_forms()
    return {"forms": forms, "count": len(forms)}

@api_router.get("/admin/helloasso/members")
async def get_helloasso_members(
    current_user: dict = Depends(get_admin_user),
    from_date: Optional[str] = Query(None, description="Date début YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="Date fin YYYY-MM-DD")
):
    """Récupère tous les adhérents depuis HelloAsso (prévisualisation)"""
    from_dt = datetime.strptime(from_date, "%Y-%m-%d") if from_date else None
    to_dt = datetime.strptime(to_date, "%Y-%m-%d") if to_date else None
    
    members = await helloasso_service.get_all_members(from_date=from_dt, to_date=to_dt)
    return {"members": members, "count": len(members)}

@api_router.post("/admin/helloasso/sync")
async def sync_helloasso_members(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_admin_user),
    from_date: Optional[str] = Query(None, description="Date début YYYY-MM-DD"),
    force: bool = Query(False, description="Forcer la mise à jour même si l'adhérent existe")
):
    """
    Synchronise les adhérents HelloAsso avec la base de données.
    - Crée les nouveaux adhérents
    - Met à jour les adhésions existantes
    - Génère les coupons
    """
    from_dt = datetime.strptime(from_date, "%Y-%m-%d") if from_date else None
    
    # Récupérer les membres HelloAsso
    helloasso_members = await helloasso_service.get_all_members(from_date=from_dt)
    
    stats = {
        "total": len(helloasso_members),
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "errors": []
    }
    
    # Mapping des formulaires aux types d'adhésion
    membership_mapping = {
        "adhesion-2025-particuliers": "individual",
        "adhesion-2025-commercants-artisans": "professional",
        "adhesion-2025-entreprises": "professional_plus",
        "adhesion-2025-associations": "association",
        "adhesion-2026-particuliers": "individual",
        "adhesion-2026-commercants-artisans": "professional",
        "adhesion-2026-entreprises": "professional_plus",
        "adhesion-2026-associations": "association",
        # Fallback par défaut
        "adhesion": "individual",
    }
    
    now = datetime.utcnow()
    
    for member in helloasso_members:
        try:
            email = member.get("email", "").lower().strip()
            if not email:
                stats["skipped"] += 1
                continue
            
            # Vérifier si l'utilisateur existe
            existing_user = await db.users.find_one({"email": email})
            
            # Déterminer le type d'adhésion
            form_slug = member.get("formSlug", "")
            membership_type = "individual"
            for key, value in membership_mapping.items():
                if key in form_slug.lower():
                    membership_type = value
                    break
            
            # Calculer la date de fin (1 an après paiement)
            payment_date_str = member.get("paymentDate")
            if payment_date_str:
                try:
                    payment_date = datetime.fromisoformat(payment_date_str.replace("Z", "+00:00"))
                except:
                    payment_date = now
            else:
                payment_date = now
            
            end_date = payment_date + timedelta(days=365)
            
            if existing_user:
                if force or existing_user.get("membershipStatus") != "active":
                    # Mettre à jour l'adhésion
                    await db.users.update_one(
                        {"email": email},
                        {
                            "$set": {
                                "membershipStatus": "active",
                                "membershipType": membership_type,
                                "membershipStartDate": payment_date,
                                "membershipEndDate": end_date,
                                "updatedAt": now,
                                "helloAssoSyncedAt": now
                            }
                        }
                    )
                    stats["updated"] += 1
                else:
                    stats["skipped"] += 1
                user_id = existing_user["id"]
            else:
                # Créer un nouvel utilisateur
                temp_password = secrets.token_urlsafe(12)
                
                new_user = User(
                    email=email,
                    firstName=member.get("firstName", ""),
                    lastName=member.get("lastName", ""),
                    phone=member.get("phone"),
                    address=member.get("address"),
                    city=member.get("city"),
                    postalCode=member.get("zipCode"),
                    password=hash_password(temp_password),
                    membershipType=membership_type,
                    membershipStatus="active",
                    membershipStartDate=payment_date,
                    membershipEndDate=end_date
                )
                await db.users.insert_one(new_user.model_dump())
                user_id = new_user.id
                stats["created"] += 1
                
                # TODO: Envoyer email de bienvenue avec mot de passe temporaire
            
            # Vérifier/créer le coupon
            existing_coupon = await db.coupons.find_one({
                "userId": user_id,
                "isActive": True,
                "validUntil": {"$gt": now}
            })
            
            if not existing_coupon:
                coupon = Coupon(
                    code=generate_coupon_code(user_id),
                    userId=user_id,
                    userEmail=email,
                    discountType="percentage",
                    discountValue=20.0,
                    applicableTo=["website", "coaching"],
                    maxUses=10,
                    validFrom=now,
                    validUntil=end_date
                )
                await db.coupons.insert_one(coupon.model_dump())
            
            # Enregistrer la synchro HelloAsso
            await db.helloasso_payments.update_one(
                {"helloAssoOrderId": member.get("helloAssoOrderId")},
                {
                    "$set": {
                        "email": email,
                        "amount": member.get("amount", 0),
                        "formSlug": form_slug,
                        "membershipType": membership_type,
                        "syncedAt": now,
                        "rawData": member
                    }
                },
                upsert=True
            )
            
        except Exception as e:
            stats["errors"].append({"email": member.get("email"), "error": str(e)})
            logger.error(f"Error syncing HelloAsso member {member.get('email')}: {str(e)}")
    
    logger.info(f"HelloAsso sync completed by {current_user['email']}: {stats}")
    return stats

@api_router.get("/admin/helloasso/payments")
async def get_helloasso_payments(
    current_user: dict = Depends(get_admin_user),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Liste les paiements HelloAsso synchronisés"""
    payments = await db.helloasso_payments.find({}).sort("syncedAt", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.helloasso_payments.count_documents({})
    
    return {
        "payments": payments,
        "total": total,
        "limit": limit,
        "offset": offset
    }

# ===================== HEALTH CHECK =====================
@api_router.get("/")
async def root():
    return {"message": "En Toute Franchise API - Version 1.0.0", "status": "operational"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include the router in the main app
app.include_router(api_router)

# CORS middleware - Configuration dynamique selon l'environnement
allowed_origins = ["*"] if ENVIRONMENT == "development" else [FRONTEND_URL]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Point d'entrée pour exécution directe (Render, etc.)
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
