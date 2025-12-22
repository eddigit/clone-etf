from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid

# User Models
class UserBase(BaseModel):
    email: EmailStr
    firstName: str
    lastName: str
    phone: Optional[str] = None
    businessName: Optional[str] = None
    businessType: Optional[str] = None
    membershipType: str = "individual"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str = "user"
    membershipStatus: str = "active"
    membershipStartDate: datetime = Field(default_factory=datetime.utcnow)
    membershipEndDate: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "email": "jean.dupont@example.fr",
                "firstName": "Jean",
                "lastName": "Dupont",
                "phone": "0612345678",
                "businessName": "Boulangerie Dupont",
                "membershipType": "professional"
            }
        }

class UserProfile(BaseModel):
    id: str
    email: str
    firstName: str
    lastName: str
    phone: Optional[str]
    businessName: Optional[str]
    businessType: Optional[str]
    membershipType: str
    membershipStatus: str
    membershipStartDate: datetime
    membershipEndDate: Optional[datetime]
    role: str

# AI Conversation Models
class ConversationCreate(BaseModel):
    title: str = "Nouvelle conversation"

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    title: str
    messagesCount: int = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class MessageCreate(BaseModel):
    content: str

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversationId: str
    userId: str
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Document Models
class DocumentBase(BaseModel):
    name: str
    size: str
    type: str  # Contrat, Légal, Administratif, Assurance

class Document(DocumentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    originalName: str
    status: str = "en cours"
    uploadDate: datetime = Field(default_factory=datetime.utcnow)
    filePath: str

# Resource Models
class Resource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    type: str  # document, guide, checklist
    category: str
    format: str  # PDF, DOCX
    size: str
    downloads: int = 0
    filePath: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

# Subscription Models
class AIPlanInfo(BaseModel):
    name: Optional[str] = None
    tokensUsed: int = 0
    tokensLimit: int = 0
    minutesUsed: int = 0
    minutesLimit: int = 0

class Subscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    planType: str
    status: str = "active"
    startDate: datetime = Field(default_factory=datetime.utcnow)
    endDate: Optional[datetime] = None
    aiPlan: Optional[AIPlanInfo] = None

# Invoice Models
class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    description: str
    amount: str
    status: str = "Payé"
    date: datetime = Field(default_factory=datetime.utcnow)

# Contact Models
class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str

class ContactMessageDB(ContactMessage):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "new"
    createdAt: datetime = Field(default_factory=datetime.utcnow)

# Article Models
class Article(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    excerpt: str
    content: str
    image: str
    author: str
    category: str
    readTime: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

# Response Models
class TokenResponse(BaseModel):
    token: str
    user: dict

class MessageResponse(BaseModel):
    message: str

class ConversationResponse(BaseModel):
    conversationId: str
    title: str
    createdAt: datetime
