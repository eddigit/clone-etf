from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, Query, Request, BackgroundTasks, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import EmailStr
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
    ContactMessage, ContactMessageDB, Article, ArticleCreate, ArticleUpdate,
    # New models for HelloAsso, Coupons, External API
    Coupon, CouponCreate, CouponValidation, CouponValidationResponse,
    ApiKey, HelloAssoPayment, HelloAssoMember, MembershipVerification,
    AdminStats, MemberListItem,
    # Membership models
    MemberData, MembershipCreate, Membership, MembershipResponse,
    AdminMembershipCreate, AdminMembershipUpdate,
    # Onboarding models
    OnboardingData, OnboardingCreate, UserOnboarding, OnboardingResponse,
    # Categories
    CASE_CATEGORIES, ARTICLE_CATEGORIES, CategoryManagement
)
import re
import unicodedata
from auth_utils import hash_password, verify_password, create_access_token, decode_access_token
from helloasso_service import helloasso_service
from pdf_service import generate_membership_pdf
from community_routes import create_community_router
from email_service import email_service

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
def serialize_doc(doc):
    """Sérialise un document MongoDB en supprimant/convertissant les ObjectId"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                # Convertir ObjectId en string ou ignorer
                result['_id'] = str(value)
            elif hasattr(value, '__str__') and type(value).__name__ == 'ObjectId':
                result[key] = str(value)
            else:
                result[key] = value
        return result
    return doc

def generate_slug(title: str) -> str:
    """Génère un slug URL-friendly à partir d'un titre"""
    # Normaliser les caractères accentués
    slug = unicodedata.normalize('NFKD', title)
    slug = slug.encode('ascii', 'ignore').decode('ascii')
    # Convertir en minuscules
    slug = slug.lower()
    # Remplacer les espaces et caractères spéciaux par des tirets
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    # Supprimer les tirets en début/fin
    slug = slug.strip('-')
    # Limiter la longueur
    return slug[:100]

def estimate_read_time(content: str) -> str:
    """Estime le temps de lecture basé sur le contenu"""
    # Environ 200 mots par minute
    words = len(content.split())
    minutes = max(1, round(words / 200))
    return f"{minutes} min"

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

    # Mettre a jour lastLogin
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"lastLogin": datetime.utcnow()}}
    )

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "firstName": user["firstName"],
            "lastName": user["lastName"],
            "role": user["role"],
            "mustChangePassword": user.get("mustChangePassword", False)
        }
    }


# ===================== PASSWORD RESET ROUTES =====================
@api_router.post("/auth/forgot-password")
async def forgot_password(email: EmailStr = Body(..., embed=True)):
    """
    Demande de reinitialisation de mot de passe.
    Envoie un email avec un lien de reinitialisation.
    """
    user = await db.users.find_one({"email": email.lower()})

    # Toujours retourner succes pour eviter enumeration d'emails
    if not user:
        logger.warning(f"Password reset requested for unknown email: {email}")
        return {"message": "Si cet email existe, un lien de reinitialisation a ete envoye."}

    # Generer un token de reinitialisation (valide 1 heure)
    reset_token = secrets.token_urlsafe(32)
    reset_expires = datetime.utcnow() + timedelta(hours=1)

    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "resetToken": reset_token,
                "resetTokenExpires": reset_expires,
                "updatedAt": datetime.utcnow()
            }
        }
    )

    # Envoyer l'email
    email_sent = await email_service.send_password_reset_email(
        to_email=user["email"],
        first_name=user["firstName"],
        reset_token=reset_token
    )

    if email_sent:
        logger.info(f"Password reset email sent to {email}")
    else:
        logger.error(f"Failed to send password reset email to {email}")

    return {"message": "Si cet email existe, un lien de reinitialisation a ete envoye."}


@api_router.post("/auth/reset-password")
async def reset_password(
    token: str = Body(...),
    new_password: str = Body(...)
):
    """
    Reinitialise le mot de passe avec un token valide.
    """
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Le mot de passe doit faire au moins 6 caracteres")

    # Trouver l'utilisateur avec ce token
    user = await db.users.find_one({
        "resetToken": token,
        "resetTokenExpires": {"$gt": datetime.utcnow()}
    })

    if not user:
        raise HTTPException(status_code=400, detail="Lien invalide ou expire. Veuillez refaire une demande.")

    # Mettre a jour le mot de passe
    hashed_password = hash_password(new_password)

    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {
                "password": hashed_password,
                "resetToken": None,
                "resetTokenExpires": None,
                "mustChangePassword": False,
                "updatedAt": datetime.utcnow()
            }
        }
    )

    logger.info(f"Password reset successful for {user['email']}")
    return {"message": "Mot de passe reinitialise avec succes. Vous pouvez maintenant vous connecter."}


@api_router.get("/auth/verify-reset-token")
async def verify_reset_token(token: str = Query(...)):
    """
    Verifie si un token de reinitialisation est valide.
    """
    user = await db.users.find_one({
        "resetToken": token,
        "resetTokenExpires": {"$gt": datetime.utcnow()}
    })

    if not user:
        raise HTTPException(status_code=400, detail="Lien invalide ou expire")

    return {
        "valid": True,
        "email": user["email"],
        "firstName": user["firstName"]
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


# ===================== ONBOARDING ROUTES =====================
@api_router.get("/users/onboarding")
async def get_onboarding(current_user: dict = Depends(get_current_user)):
    """Récupère les données d'onboarding de l'utilisateur"""
    onboarding = await db.user_onboarding.find_one({"user_id": current_user["id"]})
    
    if not onboarding:
        return {
            "is_completed": False,
            "onboarding_data": None
        }
    
    return {
        "id": onboarding.get("id"),
        "user_id": onboarding.get("user_id"),
        "onboarding_data": onboarding.get("onboarding_data"),
        "is_completed": onboarding.get("is_completed", False),
        "created_at": onboarding.get("created_at"),
        "updated_at": onboarding.get("updated_at")
    }


@api_router.post("/users/onboarding")
async def save_onboarding(
    onboarding_data: OnboardingCreate,
    current_user: dict = Depends(get_current_user)
):
    """Sauvegarde ou met à jour les données d'onboarding"""
    now = datetime.utcnow()
    
    # Préparer les données d'onboarding
    data = OnboardingData(
        member_status=onboarding_data.member_status,
        activity_sector=onboarding_data.activity_sector,
        company_size=onboarding_data.company_size,
        motivations=onboarding_data.motivations,
        main_challenges=onboarding_data.main_challenges,
        expectations=onboarding_data.expectations,
        priority_services=onboarding_data.priority_services,
        how_discovered=onboarding_data.how_discovered,
        completed_at=now
    )
    
    # Vérifier si un onboarding existe déjà
    existing = await db.user_onboarding.find_one({"user_id": current_user["id"]})
    
    if existing:
        # Mise à jour
        await db.user_onboarding.update_one(
            {"user_id": current_user["id"]},
            {
                "$set": {
                    "onboarding_data": data.model_dump(),
                    "is_completed": True,
                    "updated_at": now
                }
            }
        )
        logger.info(f"Onboarding updated for user: {current_user['email']}")
    else:
        # Création
        onboarding = UserOnboarding(
            user_id=current_user["id"],
            onboarding_data=data,
            is_completed=True,
            created_at=now,
            updated_at=now
        )
        await db.user_onboarding.insert_one(onboarding.model_dump())
        logger.info(f"Onboarding created for user: {current_user['email']}")
    
    # Mettre à jour le profil utilisateur avec le statut membre
    member_status_to_type = {
        "particulier": "individual",
        "commercant": "professional",
        "artisan": "professional",
        "grande_entreprise": "professional_plus",
        "association": "association"
    }
    
    membership_type = member_status_to_type.get(onboarding_data.member_status, "individual")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {
            "$set": {
                "membershipType": membership_type,
                "businessType": onboarding_data.activity_sector,
                "onboardingCompleted": True,
                "updatedAt": now
            }
        }
    )
    
    return {
        "message": "Onboarding enregistré avec succès",
        "is_completed": True
    }


@api_router.get("/users/onboarding/check")
async def check_onboarding_status(current_user: dict = Depends(get_current_user)):
    """Vérifie si l'utilisateur a complété l'onboarding"""
    onboarding = await db.user_onboarding.find_one({"user_id": current_user["id"]})
    
    return {
        "is_completed": onboarding.get("is_completed", False) if onboarding else False,
        "user_id": current_user["id"]
    }


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

⚠️ **IMPORTANT** : Je suis un outil d'information basé sur 20 ans d'expérience de l'association. Je ne suis pas un avocat et mes réponses ne constituent pas un conseil juridique.

**Ce que je peux faire :**
- Vous conseiller stratégiquement sur la base de l'expérience de l'association
- Partager des retours d'expérience sur des dossiers gagnés
- Vous aider à identifier les questions importantes
- Vous orienter vers les avocats partenaires si nécessaire
- Vous assister administrativement (sans rédaction)

**Ce que je ne peux pas faire :**
- Fournir un conseil juridique ou une protection juridique
- Remplacer un avocat
- Rédiger des documents juridiques

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

# ===================== ARTICLES / BLOG ROUTES =====================

# --- Routes publiques (lecture) ---
@api_router.get("/articles")
async def get_articles(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category: Optional[str] = Query(None),
    channel: Optional[str] = Query(None, description="Canal: public, members, featured (optionnel)"),
    status: str = Query("published", description="Statut des articles (published par défaut)")
):
    """
    Récupère les articles du blog.
    Par défaut, retourne tous les articles publiés.
    Si channel est specifie, filtre par canal.
    """
    query = {"status": status}

    # Si un canal est specifie, filtrer par canal
    # Sinon, retourner tous les articles publies (y compris ceux sans publishTo ou avec publishTo contenant "public")
    if channel:
        query["publishTo"] = channel
    else:
        # Pour la compatibilite avec les anciens articles sans publishTo
        query["$or"] = [
            {"publishTo": {"$exists": False}},
            {"publishTo": {"$in": ["public"]}},
            {"publishTo": {"$size": 0}}
        ]

    if category:
        query["category"] = category

    articles = await db.articles.find(query).sort("publishedAt", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.articles.count_documents(query)

    return {
        "articles": serialize_doc(articles),
        "total": total,
        "limit": limit,
        "offset": offset
    }


@api_router.get("/articles/featured")
async def get_featured_articles(
    limit: int = Query(3, ge=1, le=10)
):
    """
    Récupère les articles mis en avant pour la page d'accueil.
    """
    query = {"status": "published", "publishTo": "featured"}
    articles = await db.articles.find(query).sort("publishedAt", -1).limit(limit).to_list(limit)
    return {"articles": serialize_doc(articles)}


@api_router.get("/articles/members")
async def get_members_articles(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Récupère les articles réservés aux adhérents.
    Nécessite une authentification.
    """
    # Vérifier que l'utilisateur a une adhésion active
    if current_user.get("membershipStatus") != "active":
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux adhérents avec une adhésion active"
        )

    query = {"status": "published", "publishTo": "members"}
    if category:
        query["category"] = category

    articles = await db.articles.find(query).sort("publishedAt", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.articles.count_documents(query)

    return {
        "articles": serialize_doc(articles),
        "total": total,
        "limit": limit,
        "offset": offset
    }


@api_router.get("/articles/categories")
async def get_article_categories():
    """Récupère la liste des catégories prédéfinies pour les articles"""
    return {"categories": ARTICLE_CATEGORIES}

@api_router.get("/admin/categories/articles")
async def admin_get_article_categories(current_user: dict = Depends(get_admin_user)):
    """Récupère les catégories d'articles (admin)"""
    return {"categories": ARTICLE_CATEGORIES}

@api_router.get("/admin/categories/cases")
async def admin_get_case_categories(current_user: dict = Depends(get_admin_user)):
    """Récupère les catégories de dossiers (admin)"""
    return {"categories": CASE_CATEGORIES}


@api_router.get("/articles/{slug_or_id}")
async def get_article(slug_or_id: str):
    """
    Récupère un article par son slug ou son ID.
    Incrémente le compteur de vues.
    """
    # Chercher par slug d'abord, puis par ID
    article = await db.articles.find_one({"slug": slug_or_id})
    if not article:
        article = await db.articles.find_one({"id": slug_or_id})

    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    # Incrémenter les vues
    await db.articles.update_one(
        {"id": article["id"]},
        {"$inc": {"views": 1}}
    )

    return serialize_doc(article)


# --- Routes Admin (CRUD complet) ---
@api_router.get("/admin/articles")
async def admin_list_articles(
    current_user: dict = Depends(get_admin_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None, description="draft, published, archived"),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """Liste tous les articles (admin) avec filtres"""
    query = {}

    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"excerpt": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}}
        ]

    articles = await db.articles.find(query).sort("createdAt", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.articles.count_documents(query)

    return {
        "articles": serialize_doc(articles),
        "total": total,
        "limit": limit,
        "offset": offset
    }


@api_router.post("/admin/articles")
async def admin_create_article(
    article_data: ArticleCreate,
    current_user: dict = Depends(get_admin_user)
):
    """
    Crée un nouvel article.
    Génère automatiquement le slug si non fourni.
    """
    try:
        now = datetime.utcnow()

        # Générer le slug si non fourni
        slug = article_data.slug or generate_slug(article_data.title)

        # Vérifier l'unicité du slug
        existing = await db.articles.find_one({"slug": slug})
        if existing:
            # Ajouter un suffixe unique
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        # Estimer le temps de lecture si non fourni
        read_time = article_data.readTime or estimate_read_time(article_data.content)

        # Auteur
        author = article_data.author or f"{current_user['firstName']} {current_user['lastName']}"

        # Créer l'article
        article = Article(
            title=article_data.title,
            slug=slug,
            excerpt=article_data.excerpt,
            content=article_data.content,
            featuredImage=article_data.featuredImage,
            category=article_data.category,
            tags=article_data.tags,
            status=article_data.status,
            publishTo=article_data.publishTo,
            author=author,
            authorId=current_user["id"],
            readTime=read_time,
            metaTitle=article_data.metaTitle or article_data.title,
            metaDescription=article_data.metaDescription or article_data.excerpt[:160] if article_data.excerpt else None,
            publishedAt=now if article_data.status == "published" else None,
            createdAt=now,
            updatedAt=now
        )

        await db.articles.insert_one(article.model_dump())

        logger.info(f"Article créé par {current_user['email']}: {article.title}")

        return {
            "status": "success",
            "article": article.model_dump(),
            "message": "Article créé avec succès"
        }

    except Exception as e:
        logger.error(f"Erreur création article: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/articles/{article_id}")
async def admin_get_article(
    article_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Récupère un article pour édition (admin)"""
    article = await db.articles.find_one({"id": article_id})
    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    return serialize_doc(article)


@api_router.put("/admin/articles/{article_id}")
async def admin_update_article(
    article_id: str,
    article_data: ArticleUpdate,
    current_user: dict = Depends(get_admin_user)
):
    """Met à jour un article existant"""
    try:
        article = await db.articles.find_one({"id": article_id})
        if not article:
            raise HTTPException(status_code=404, detail="Article non trouvé")

        now = datetime.utcnow()
        update_data = {"updatedAt": now}

        # Mettre à jour les champs fournis
        if article_data.title is not None:
            update_data["title"] = article_data.title
            # Mettre à jour le slug si le titre change et pas de slug personnalisé
            if article_data.slug is None:
                new_slug = generate_slug(article_data.title)
                if new_slug != article.get("slug"):
                    existing = await db.articles.find_one({"slug": new_slug, "id": {"$ne": article_id}})
                    if existing:
                        new_slug = f"{new_slug}-{uuid.uuid4().hex[:6]}"
                    update_data["slug"] = new_slug

        if article_data.slug is not None:
            # Vérifier l'unicité du slug
            existing = await db.articles.find_one({"slug": article_data.slug, "id": {"$ne": article_id}})
            if existing:
                raise HTTPException(status_code=400, detail="Ce slug est déjà utilisé")
            update_data["slug"] = article_data.slug

        if article_data.excerpt is not None:
            update_data["excerpt"] = article_data.excerpt
        if article_data.content is not None:
            update_data["content"] = article_data.content
            # Recalculer le temps de lecture
            if article_data.readTime is None:
                update_data["readTime"] = estimate_read_time(article_data.content)
        if article_data.featuredImage is not None:
            update_data["featuredImage"] = article_data.featuredImage
        if article_data.category is not None:
            update_data["category"] = article_data.category
        if article_data.tags is not None:
            update_data["tags"] = article_data.tags
        if article_data.publishTo is not None:
            update_data["publishTo"] = article_data.publishTo
        if article_data.author is not None:
            update_data["author"] = article_data.author
        if article_data.readTime is not None:
            update_data["readTime"] = article_data.readTime
        if article_data.metaTitle is not None:
            update_data["metaTitle"] = article_data.metaTitle
        if article_data.metaDescription is not None:
            update_data["metaDescription"] = article_data.metaDescription

        # Gérer le changement de statut
        if article_data.status is not None:
            update_data["status"] = article_data.status
            # Si publié pour la première fois, définir la date de publication
            if article_data.status == "published" and not article.get("publishedAt"):
                update_data["publishedAt"] = now

        await db.articles.update_one(
            {"id": article_id},
            {"$set": update_data}
        )

        # Récupérer l'article mis à jour
        updated_article = await db.articles.find_one({"id": article_id})

        logger.info(f"Article mis à jour par {current_user['email']}: {article_id}")

        return {
            "status": "success",
            "article": serialize_doc(updated_article),
            "message": "Article mis à jour avec succès"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur mise à jour article: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/admin/articles/{article_id}")
async def admin_delete_article(
    article_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Supprime un article"""
    article = await db.articles.find_one({"id": article_id})
    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    await db.articles.delete_one({"id": article_id})

    logger.info(f"Article supprimé par {current_user['email']}: {article['title']}")

    return {"status": "success", "message": "Article supprimé"}


@api_router.post("/admin/articles/{article_id}/publish")
async def admin_publish_article(
    article_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Publie un article (change le statut en 'published')"""
    article = await db.articles.find_one({"id": article_id})
    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    now = datetime.utcnow()
    update_data = {
        "status": "published",
        "updatedAt": now
    }

    # Définir la date de publication si c'est la première publication
    if not article.get("publishedAt"):
        update_data["publishedAt"] = now

    await db.articles.update_one(
        {"id": article_id},
        {"$set": update_data}
    )

    logger.info(f"Article publié par {current_user['email']}: {article['title']}")

    return {"status": "success", "message": "Article publié"}


@api_router.post("/admin/articles/{article_id}/unpublish")
async def admin_unpublish_article(
    article_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Dépublie un article (change le statut en 'draft')"""
    result = await db.articles.update_one(
        {"id": article_id},
        {"$set": {"status": "draft", "updatedAt": datetime.utcnow()}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    return {"status": "success", "message": "Article dépublié"}


@api_router.post("/admin/articles/{article_id}/duplicate")
async def admin_duplicate_article(
    article_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """Duplique un article existant"""
    article = await db.articles.find_one({"id": article_id})
    if not article:
        raise HTTPException(status_code=404, detail="Article non trouvé")

    now = datetime.utcnow()

    # Créer un nouveau slug
    new_slug = f"{article['slug']}-copie-{uuid.uuid4().hex[:6]}"

    # Créer le nouvel article
    new_article = Article(
        title=f"{article['title']} (Copie)",
        slug=new_slug,
        excerpt=article.get("excerpt", ""),
        content=article.get("content", ""),
        featuredImage=article.get("featuredImage"),
        category=article.get("category", ""),
        tags=article.get("tags"),
        status="draft",  # Toujours en brouillon
        publishTo=article.get("publishTo", ["public"]),
        author=f"{current_user['firstName']} {current_user['lastName']}",
        authorId=current_user["id"],
        readTime=article.get("readTime", "5 min"),
        metaTitle=article.get("metaTitle"),
        metaDescription=article.get("metaDescription"),
        createdAt=now,
        updatedAt=now
    )

    await db.articles.insert_one(new_article.model_dump())

    return {
        "status": "success",
        "article": new_article.model_dump(),
        "message": "Article dupliqué"
    }


# --- Upload d'images pour les articles ---
@api_router.post("/admin/articles/upload-image")
async def admin_upload_article_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_admin_user)
):
    """
    Upload une image pour un article.
    Retourne l'URL de l'image uploadée.
    """
    try:
        # Vérifier le type de fichier
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Type de fichier non autorisé. Utilisez JPEG, PNG, GIF ou WebP.")

        # Créer le dossier d'upload s'il n'existe pas
        upload_dir = Path("uploads/articles")
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Générer un nom de fichier unique
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = upload_dir / unique_filename

        # Sauvegarder le fichier
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Retourner l'URL relative
        image_url = f"/uploads/articles/{unique_filename}"

        logger.info(f"Image uploadée par {current_user['email']}: {image_url}")

        return {
            "status": "success",
            "url": image_url,
            "filename": unique_filename
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur upload image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/articles/upload-file")
async def admin_upload_article_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_admin_user)
):
    """
    Upload un fichier (PDF, etc.) pour un article.
    """
    try:
        # Vérifier le type de fichier
        allowed_types = ["application/pdf", "application/msword",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Type de fichier non autorisé. Utilisez PDF ou Word.")

        # Créer le dossier d'upload
        upload_dir = Path("uploads/articles/files")
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Générer un nom de fichier unique
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = upload_dir / unique_filename

        # Sauvegarder le fichier
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Calculer la taille
        size = len(content)
        size_str = f"{size / 1024:.0f} KB" if size < 1024 * 1024 else f"{size / (1024 * 1024):.1f} MB"

        return {
            "status": "success",
            "url": f"/uploads/articles/files/{unique_filename}",
            "filename": file.filename,
            "size": size_str,
            "type": file.content_type
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur upload fichier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ===================== HELLOASSO WEBHOOK =====================
@api_router.post("/webhooks/helloasso")
async def helloasso_webhook(request: Request):
    """
    Webhook pour recevoir les notifications HelloAsso
    Crée ou met à jour un adhérent lors d'un paiement
    Met à jour le statut des adhésions
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
        order_id = data.get("id", "")
        payment_id = data.get("paymentId", "")
        
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
        current_year = now.year
        
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
        
        # Mettre à jour l'adhésion si elle existe (status: pending → paid)
        membership_update = await db.memberships.update_one(
            {
                "user_id": user_id,
                "year": current_year,
                "status": "pending"
            },
            {
                "$set": {
                    "status": "paid",
                    "payment_id": payment_id,
                    "helloasso_order_id": order_id,
                    "updated_at": now
                }
            }
        )
        
        if membership_update.modified_count > 0:
            logger.info(f"HelloAsso: Updated membership status to 'paid' for user {user_id}")
        
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

# ===================== MEMBERSHIP ENDPOINTS (ADHESIONS) =====================

@api_router.post("/memberships", response_model=MembershipResponse)
async def create_membership(
    membership_data: MembershipCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Crée une nouvelle adhésion et génère le PDF
    
    Flux :
    1. Valide les données
    2. Crée l'adhésion (status: pending)
    3. Génère le PDF du bordereau
    4. Retourne les données avec lien paiement HelloAsso
    """
    try:
        # Vérifier si l'utilisateur a déjà une adhésion pour l'année en cours
        current_year = datetime.utcnow().year
        existing = await db.memberships.find_one({
            "user_id": current_user["id"],
            "year": current_year,
            "status": {"$ne": "cancelled"}
        })
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Vous avez déjà une adhésion pour l'année {current_year}"
            )
        
        # Créer l'adhésion
        membership = Membership(
            user_id=current_user["id"],
            year=current_year,
            status="pending",
            amount=membership_data.amount,
            membership_type=membership_data.membership_type,
            member_data=membership_data.member_data
        )
        
        # Insérer dans MongoDB
        membership_dict = membership.model_dump()
        result = await db.memberships.insert_one(membership_dict)
        
        # Générer le PDF
        pdf_data = {
            "year": membership.year,
            "membership_type": membership.membership_type,
            "amount": membership.amount,
            "member_data": membership.member_data.model_dump()
        }
        
        try:
            pdf_path = generate_membership_pdf(
                membership_data=pdf_data,
                membership_id=membership.id,
                output_dir="pdf_memberships"
            )
            
            # Mettre à jour l'adhésion avec le chemin du PDF
            await db.memberships.update_one(
                {"id": membership.id},
                {
                    "$set": {
                        "pdf_path": pdf_path,
                        "pdf_generated_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            logger.info(f"PDF généré pour l'adhésion {membership.id}: {pdf_path}")
        except Exception as e:
            logger.error(f"Erreur lors de la génération du PDF: {str(e)}")
            # Continue sans bloquer la création de l'adhésion
        
        # Retourner la réponse
        return MembershipResponse(
            id=membership.id,
            year=membership.year,
            status=membership.status,
            amount=membership.amount,
            membership_type=membership.membership_type,
            member_data=membership.member_data,
            pdf_available=pdf_path is not None if 'pdf_path' in locals() else False,
            created_at=membership.created_at,
            updated_at=membership.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la création de l'adhésion: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création de l'adhésion: {str(e)}")


@api_router.get("/memberships/me", response_model=List[MembershipResponse])
async def get_my_memberships(current_user: dict = Depends(get_current_user)):
    """
    Récupère toutes les adhésions de l'utilisateur connecté
    """
    try:
        memberships = await db.memberships.find({
            "user_id": current_user["id"]
        }).sort("year", -1).to_list(100)
        
        result = []
        for m in memberships:
            result.append(MembershipResponse(
                id=m["id"],
                year=m["year"],
                status=m["status"],
                amount=m["amount"],
                membership_type=m["membership_type"],
                member_data=MemberData(**m["member_data"]),
                pdf_available=m.get("pdf_path") is not None,
                created_at=m["created_at"],
                updated_at=m["updated_at"]
            ))
        
        return result
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des adhésions: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la récupération des adhésions")


@api_router.get("/memberships/{membership_id}")
async def get_membership(
    membership_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Récupère une adhésion spécifique"""
    try:
        membership = await db.memberships.find_one({
            "id": membership_id,
            "user_id": current_user["id"]
        })
        
        if not membership:
            raise HTTPException(status_code=404, detail="Adhésion non trouvée")
        
        return MembershipResponse(
            id=membership["id"],
            year=membership["year"],
            status=membership["status"],
            amount=membership["amount"],
            membership_type=membership["membership_type"],
            member_data=MemberData(**membership["member_data"]),
            pdf_available=membership.get("pdf_path") is not None,
            created_at=membership["created_at"],
            updated_at=membership["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération de l'adhésion: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur serveur")


@api_router.get("/memberships/{membership_id}/pdf")
async def download_membership_pdf(
    membership_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Télécharge le PDF du bordereau d'adhésion
    """
    from fastapi.responses import FileResponse
    
    try:
        membership = await db.memberships.find_one({
            "id": membership_id,
            "user_id": current_user["id"]
        })
        
        if not membership:
            raise HTTPException(status_code=404, detail="Adhésion non trouvée")
        
        pdf_path = membership.get("pdf_path")
        if not pdf_path or not Path(pdf_path).exists():
            raise HTTPException(status_code=404, detail="PDF non disponible")
        
        # Retourner le fichier
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=f"adhesion_{membership['year']}_{membership_id[:8]}.pdf"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors du téléchargement du PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors du téléchargement du PDF")


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
    """Détail complet d'un membre avec onboarding"""
    user = await db.users.find_one({"id": member_id})
    if not user:
        raise HTTPException(status_code=404, detail="Membre non trouvé")
    
    # Récupérer les coupons
    coupons = await db.coupons.find({"userId": member_id}).to_list(100)
    
    # Récupérer les paiements HelloAsso
    payments = await db.helloasso_payments.find({"email": user["email"]}).to_list(100)
    
    # Récupérer les données d'onboarding
    onboarding = await db.user_onboarding.find_one({"user_id": member_id})
    
    # Retirer le mot de passe
    user.pop("password", None)
    
    return {
        "user": user,
        "coupons": coupons,
        "payments": payments,
        "onboarding": onboarding
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

# ===================== ADMIN MEMBERSHIP MANAGEMENT =====================

@api_router.post("/admin/memberships")
async def admin_create_membership(
    data: AdminMembershipCreate,
    current_user: dict = Depends(get_admin_user)
):
    """
    Crée une adhésion manuellement (paiement chèque, virement, espèces).
    Crée l'utilisateur s'il n'existe pas.
    """
    try:
        now = datetime.utcnow()
        year = data.year or now.year
        email = data.user_email.lower().strip()

        # Vérifier si l'utilisateur existe
        existing_user = await db.users.find_one({"email": email})

        if existing_user:
            user_id = existing_user["id"]
            # Vérifier s'il a déjà une adhésion pour cette année
            existing_membership = await db.memberships.find_one({
                "user_id": user_id,
                "year": year,
                "status": {"$nin": ["cancelled"]}
            })
            if existing_membership:
                raise HTTPException(
                    status_code=400,
                    detail=f"Cet adhérent a déjà une adhésion pour {year}"
                )
        else:
            # Créer l'utilisateur
            temp_password = secrets.token_urlsafe(12)
            new_user = User(
                email=email,
                firstName=data.first_name,
                lastName=data.last_name,
                phone=data.phone,
                password=hash_password(temp_password),
                membershipType=data.membership_type,
                membershipStatus="active" if data.status == "paid" else "pending",
                membershipStartDate=data.payment_date or now,
                membershipEndDate=(data.payment_date or now) + timedelta(days=365)
            )
            await db.users.insert_one(new_user.model_dump())
            user_id = new_user.id
            logger.info(f"Admin created new user {email} for manual membership")

        # Créer les données membre si non fournies
        if data.member_data:
            member_data = data.member_data
        else:
            member_data = MemberData(
                nom=data.last_name,
                prenom=data.first_name,
                email=email,
                telephone=data.phone or "",
                adresse_commerciale="",
                code_postal="",
                ville=""
            )

        # Créer l'adhésion
        membership = Membership(
            user_id=user_id,
            year=year,
            status=data.status,
            amount=data.amount,
            membership_type=data.membership_type,
            payment_method=data.payment_method,
            payment_reference=data.payment_reference,
            payment_date=data.payment_date or now,
            member_data=member_data,
            notes=data.notes
        )

        await db.memberships.insert_one(membership.model_dump())

        # Générer le PDF du bordereau d'adhésion
        pdf_path = None
        try:
            pdf_data = {
                "year": year,
                "membership_type": data.membership_type,
                "amount": data.amount,
                "member_data": member_data.model_dump() if hasattr(member_data, 'model_dump') else member_data
            }
            pdf_path = generate_membership_pdf(
                membership_data=pdf_data,
                membership_id=membership.id,
                output_dir="pdf_memberships"
            )

            # Mettre à jour l'adhésion avec le chemin du PDF
            await db.memberships.update_one(
                {"id": membership.id},
                {
                    "$set": {
                        "pdf_path": pdf_path,
                        "pdf_generated_at": now,
                        "updated_at": now
                    }
                }
            )
            logger.info(f"PDF généré pour adhésion manuelle {membership.id}: {pdf_path}")
        except Exception as e:
            logger.error(f"Erreur génération PDF: {str(e)}")

        # Mettre à jour le profil utilisateur (type et statut)
        end_date = (data.payment_date or now) + timedelta(days=365)
        user_update = {
            "membershipType": data.membership_type,
            "updatedAt": now
        }

        if data.status == "paid":
            user_update.update({
                "membershipStatus": "active",
                "membershipStartDate": data.payment_date or now,
                "membershipEndDate": end_date
            })
        else:
            user_update["membershipStatus"] = "pending"

        await db.users.update_one({"id": user_id}, {"$set": user_update})

        # Générer un coupon si payé
        if data.status == "paid":
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

        logger.info(f"Admin {current_user['email']} created manual membership for {email} ({data.payment_method})")

        return {
            "status": "success",
            "membership_id": membership.id,
            "user_id": user_id,
            "pdf_generated": pdf_path is not None,
            "message": f"Adhésion créée pour {email}"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating manual membership: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/memberships")
async def admin_list_memberships(
    current_user: dict = Depends(get_admin_user),
    year: Optional[int] = Query(None, description="Année"),
    status: Optional[str] = Query(None, description="pending, paid, cancelled, expired"),
    payment_method: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Liste toutes les adhésions avec filtres"""
    query = {}

    if year:
        query["year"] = year
    if status:
        query["status"] = status
    if payment_method:
        query["payment_method"] = payment_method

    memberships = await db.memberships.find(query).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    total = await db.memberships.count_documents(query)

    # Enrichir avec les données utilisateur
    result = []
    for m in memberships:
        user = await db.users.find_one({"id": m["user_id"]})
        result.append({
            **m,
            "user_email": user["email"] if user else "N/A",
            "user_name": f"{user['firstName']} {user['lastName']}" if user else "N/A"
        })

    return {
        "memberships": result,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@api_router.put("/admin/memberships/{membership_id}")
async def admin_update_membership(
    membership_id: str,
    data: AdminMembershipUpdate,
    current_user: dict = Depends(get_admin_user)
):
    """Met à jour une adhésion (statut, dates, paiement)"""
    try:
        membership = await db.memberships.find_one({"id": membership_id})
        if not membership:
            raise HTTPException(status_code=404, detail="Adhésion non trouvée")

        now = datetime.utcnow()
        update_data = {"updated_at": now}

        if data.status:
            update_data["status"] = data.status
        if data.payment_method:
            update_data["payment_method"] = data.payment_method
        if data.payment_reference:
            update_data["payment_reference"] = data.payment_reference
        if data.payment_date:
            update_data["payment_date"] = data.payment_date
        if data.amount is not None:
            update_data["amount"] = data.amount
        if data.notes is not None:
            update_data["notes"] = data.notes

        await db.memberships.update_one(
            {"id": membership_id},
            {"$set": update_data}
        )

        # Si le statut passe à "paid", mettre à jour l'utilisateur
        if data.status == "paid":
            user = await db.users.find_one({"id": membership["user_id"]})
            if user:
                end_date = data.membership_end_date or (now + timedelta(days=365))
                await db.users.update_one(
                    {"id": membership["user_id"]},
                    {
                        "$set": {
                            "membershipStatus": "active",
                            "membershipEndDate": end_date,
                            "updatedAt": now
                        }
                    }
                )

                # Générer coupon si nécessaire
                existing_coupon = await db.coupons.find_one({
                    "userId": user["id"],
                    "isActive": True,
                    "validUntil": {"$gt": now}
                })

                if not existing_coupon:
                    coupon = Coupon(
                        code=generate_coupon_code(user["id"]),
                        userId=user["id"],
                        userEmail=user["email"],
                        discountType="percentage",
                        discountValue=20.0,
                        applicableTo=["website", "coaching"],
                        maxUses=10,
                        validFrom=now,
                        validUntil=end_date
                    )
                    await db.coupons.insert_one(coupon.model_dump())

        # Si prolongation de la date de fin
        if data.membership_end_date:
            await db.users.update_one(
                {"id": membership["user_id"]},
                {"$set": {"membershipEndDate": data.membership_end_date, "updatedAt": now}}
            )

        logger.info(f"Admin {current_user['email']} updated membership {membership_id}")
        return {"status": "success", "message": "Adhésion mise à jour"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating membership: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/members/{member_id}/send-welcome-email")
async def admin_send_welcome_email(
    member_id: str,
    current_user: dict = Depends(get_admin_user)
):
    """
    Envoie un email de bienvenue avec lien de creation de mot de passe.
    Utile pour les adherents importes depuis HelloAsso.
    """
    user = await db.users.find_one({"id": member_id})
    if not user:
        raise HTTPException(status_code=404, detail="Membre non trouve")

    # Generer un token de reinitialisation (valide 48h pour les nouveaux)
    reset_token = secrets.token_urlsafe(32)
    reset_expires = datetime.utcnow() + timedelta(hours=48)

    await db.users.update_one(
        {"id": member_id},
        {
            "$set": {
                "resetToken": reset_token,
                "resetTokenExpires": reset_expires,
                "mustChangePassword": True,
                "updatedAt": datetime.utcnow()
            }
        }
    )

    # Envoyer l'email de bienvenue
    email_sent = await email_service.send_welcome_email(
        to_email=user["email"],
        first_name=user["firstName"],
        last_name=user["lastName"],
        reset_token=reset_token
    )

    if email_sent:
        logger.info(f"Admin {current_user['email']} sent welcome email to {user['email']}")
        return {"status": "success", "message": f"Email de bienvenue envoye a {user['email']}"}
    else:
        raise HTTPException(status_code=500, detail="Erreur lors de l'envoi de l'email. Verifiez la configuration SMTP.")


@api_router.post("/admin/members/send-bulk-welcome-emails")
async def admin_send_bulk_welcome_emails(
    member_ids: List[str] = Body(...),
    current_user: dict = Depends(get_admin_user)
):
    """
    Envoie des emails de bienvenue a plusieurs adherents.
    """
    results = {"sent": 0, "failed": 0, "errors": []}

    for member_id in member_ids:
        user = await db.users.find_one({"id": member_id})
        if not user:
            results["failed"] += 1
            results["errors"].append(f"Membre {member_id} non trouve")
            continue

        # Generer token
        reset_token = secrets.token_urlsafe(32)
        reset_expires = datetime.utcnow() + timedelta(hours=48)

        await db.users.update_one(
            {"id": member_id},
            {
                "$set": {
                    "resetToken": reset_token,
                    "resetTokenExpires": reset_expires,
                    "mustChangePassword": True,
                    "updatedAt": datetime.utcnow()
                }
            }
        )

        # Envoyer email
        email_sent = await email_service.send_welcome_email(
            to_email=user["email"],
            first_name=user["firstName"],
            last_name=user["lastName"],
            reset_token=reset_token
        )

        if email_sent:
            results["sent"] += 1
        else:
            results["failed"] += 1
            results["errors"].append(f"Echec envoi a {user['email']}")

    logger.info(f"Admin {current_user['email']} sent bulk welcome emails: {results['sent']} sent, {results['failed']} failed")
    return results


@api_router.post("/admin/members/send-renewal-reminders")
async def admin_send_renewal_reminders(
    days_threshold: int = Query(30, description="Envoyer aux adherents expirant dans X jours"),
    include_expired: bool = Query(False, description="Inclure les adherents deja expires"),
    current_user: dict = Depends(get_admin_user)
):
    """
    Envoie des rappels de renouvellement aux adherents dont l'adhesion expire bientot.
    """
    now = datetime.utcnow()
    expiry_threshold = now + timedelta(days=days_threshold)

    # Trouver les adherents a relancer
    query = {
        "role": "user",
        "membershipEndDate": {"$lte": expiry_threshold}
    }

    if not include_expired:
        query["membershipEndDate"]["$gte"] = now

    users_to_notify = await db.users.find(query).to_list(500)

    results = {"sent": 0, "failed": 0, "skipped": 0}

    for user in users_to_notify:
        end_date = user.get("membershipEndDate")
        if not end_date:
            results["skipped"] += 1
            continue

        days_left = (end_date - now).days

        email_sent = await email_service.send_renewal_reminder_email(
            to_email=user["email"],
            first_name=user["firstName"],
            end_date=end_date,
            days_left=days_left
        )

        if email_sent:
            results["sent"] += 1
        else:
            results["failed"] += 1

    logger.info(f"Admin {current_user['email']} sent renewal reminders: {results}")
    return results


@api_router.get("/admin/email/status")
async def admin_get_email_status(current_user: dict = Depends(get_admin_user)):
    """
    Verifie si le service email est configure.
    """
    return {
        "configured": email_service.is_configured(),
        "message": "Service email configure et pret" if email_service.is_configured() else "Service email non configure. Ajoutez les variables SMTP dans .env"
    }


@api_router.get("/admin/memberships/renewals")
async def admin_get_renewals(
    current_user: dict = Depends(get_admin_user),
    days: int = Query(30, description="Nombre de jours avant expiration")
):
    """
    Liste les adhésions à renouveler (expirant dans X jours).
    Utile pour les campagnes de renouvellement.
    """
    now = datetime.utcnow()
    expiry_threshold = now + timedelta(days=days)

    # Trouver les utilisateurs dont l'adhésion expire bientôt
    expiring_users = await db.users.find({
        "role": "user",
        "membershipStatus": "active",
        "membershipEndDate": {
            "$gte": now,
            "$lte": expiry_threshold
        }
    }).to_list(500)

    # Trouver les utilisateurs déjà expirés
    expired_users = await db.users.find({
        "role": "user",
        "membershipStatus": {"$in": ["active", "expired"]},
        "membershipEndDate": {"$lt": now}
    }).to_list(500)

    # Mettre à jour les statuts des expirés
    for user in expired_users:
        if user.get("membershipStatus") == "active":
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"membershipStatus": "expired", "updatedAt": now}}
            )

    # Construire la réponse
    result = {
        "expiring_soon": [],
        "expired": [],
        "stats": {
            "expiring_count": len(expiring_users),
            "expired_count": len(expired_users),
            "threshold_days": days
        }
    }

    for user in expiring_users:
        days_left = (user["membershipEndDate"] - now).days if user.get("membershipEndDate") else 0
        result["expiring_soon"].append({
            "user_id": user["id"],
            "email": user["email"],
            "name": f"{user['firstName']} {user['lastName']}",
            "membership_type": user.get("membershipType"),
            "end_date": user.get("membershipEndDate"),
            "days_left": days_left
        })

    for user in expired_users:
        days_expired = (now - user["membershipEndDate"]).days if user.get("membershipEndDate") else 0
        result["expired"].append({
            "user_id": user["id"],
            "email": user["email"],
            "name": f"{user['firstName']} {user['lastName']}",
            "membership_type": user.get("membershipType"),
            "end_date": user.get("membershipEndDate"),
            "days_expired": days_expired
        })

    # Trier par urgence
    result["expiring_soon"].sort(key=lambda x: x["days_left"])
    result["expired"].sort(key=lambda x: x["days_expired"], reverse=True)

    return result


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

# Créer et inclure le router communautaire avec les dépendances
community_router = create_community_router(db, get_current_user)
api_router.include_router(community_router)

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
