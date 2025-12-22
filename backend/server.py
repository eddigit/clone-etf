from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, Query
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

from models import (
    UserCreate, UserLogin, User, UserProfile, TokenResponse, MessageResponse,
    ConversationCreate, Conversation, MessageCreate, Message, ConversationResponse,
    DocumentBase, Document, Resource, Subscription, Invoice, 
    ContactMessage, ContactMessageDB, Article
)
from auth_utils import hash_password, verify_password, create_access_token, decode_access_token

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
    ai_response_content = """Bonjour ! Je suis l'assistant juridique IA d'En Toute Franchise. 

Note : Pour le moment, les réponses sont mockées. L'intégration complète avec l'API OpenAI sera ajoutée lors de la configuration des clés API.

Comment puis-je vous aider avec vos questions juridiques ou administratives ?"""
    
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

# ===================== HEALTH CHECK =====================
@api_router.get("/")
async def root():
    return {"message": "En Toute Franchise API - Version 1.0.0", "status": "operational"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
