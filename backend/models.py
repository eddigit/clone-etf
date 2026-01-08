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

# ===================== COUPON MODELS =====================
class Coupon(BaseModel):
    """Coupon de réduction pour les adhérents (Boîte à Outils Digitale)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str  # Ex: ETF2026-XXXXX
    userId: str  # Adhérent propriétaire du coupon
    userEmail: str
    discountType: str = "percentage"  # percentage ou fixed
    discountValue: float = 20.0  # 20% ou 20€
    applicableTo: List[str] = ["website", "coaching"]  # Services concernés
    maxUses: int = 1  # Nombre d'utilisations max
    currentUses: int = 0
    isActive: bool = True
    validFrom: datetime = Field(default_factory=datetime.utcnow)
    validUntil: Optional[datetime] = None  # None = valide jusqu'à fin adhésion
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class CouponCreate(BaseModel):
    userId: str
    discountType: str = "percentage"
    discountValue: float = 20.0
    applicableTo: List[str] = ["website", "coaching"]
    maxUses: int = 1

class CouponValidation(BaseModel):
    code: str
    email: str
    service: Optional[str] = None  # website, coaching, etc.

class CouponValidationResponse(BaseModel):
    valid: bool
    discount: Optional[float] = None
    discountType: Optional[str] = None
    applicableTo: Optional[List[str]] = None
    message: str

# ===================== API KEY MODELS =====================
class ApiKey(BaseModel):
    """Clé API pour authentification externe (Boîte à Outils)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # Ex: "Boîte à Outils Digitale"
    key: str  # Clé secrète hashée
    keyPrefix: str  # Premiers caractères pour identification (ex: "etf_")
    permissions: List[str] = ["verify_membership", "validate_coupon"]
    isActive: bool = True
    lastUsed: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    createdBy: str  # Admin qui a créé la clé

# ===================== HELLOASSO MODELS =====================
class HelloAssoPayment(BaseModel):
    """Données reçues du webhook HelloAsso"""
    eventType: str  # Payment, Order
    data: dict  # Données brutes HelloAsso

class HelloAssoMember(BaseModel):
    """Membre créé/mis à jour via HelloAsso"""
    email: str
    firstName: str
    lastName: str
    phone: Optional[str] = None
    membershipType: str
    amount: float
    paymentDate: datetime
    helloAssoOrderId: str
    helloAssoPaymentId: Optional[str] = None

# ===================== MEMBERSHIP VERIFICATION =====================
class MembershipVerification(BaseModel):
    """Réponse de vérification d'adhésion pour API externe"""
    isMember: bool
    membershipType: Optional[str] = None
    membershipStatus: Optional[str] = None
    membershipEndDate: Optional[datetime] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    discount: Optional[dict] = None  # {percentage: 20, code: "ETF2026-XXX"}

# ===================== ADMIN MODELS =====================
class AdminStats(BaseModel):
    """Statistiques pour le dashboard admin"""
    totalMembers: int = 0
    activeMembers: int = 0
    expiredMembers: int = 0
    newMembersThisMonth: int = 0
    totalCoupons: int = 0
    usedCoupons: int = 0
    revenue: float = 0.0

class MemberListItem(BaseModel):
    """Item de la liste des membres pour l'admin"""
    id: str
    email: str
    firstName: str
    lastName: str
    businessName: Optional[str]
    membershipType: str
    membershipStatus: str
    membershipEndDate: Optional[datetime]
    createdAt: datetime
    couponCode: Optional[str] = None

# ===================== MEMBERSHIP MODELS =====================
class MemberData(BaseModel):
    """Données du membre pour l'adhésion"""
    nom: str
    prenom: str
    adresse_commerciale: str
    code_postal: str
    ville: str
    telephone: str
    fax: Optional[str] = None
    email: EmailStr
    rcs: Optional[str] = None
    type_activite: Optional[str] = None  # "commercant" | "artisan" | None pour individual/association
    activite_detail: Optional[str] = None
    is_franchise: Optional[bool] = False
    franchise_status: Optional[str] = None  # "actif" | "ex" | None
    enseigne: Optional[str] = None
    date_creation_commerce: Optional[datetime] = None
    # Pour associations
    nom_association: Optional[str] = None
    siret: Optional[str] = None

class MembershipCreate(BaseModel):
    """Création d'une adhésion"""
    membership_type: str  # "individual" | "professional" | "professional_plus" | "association"
    amount: float  # Montant de l'adhésion
    member_data: MemberData

class Membership(BaseModel):
    """Adhésion complète"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    year: int  # 2026
    status: str = "pending"  # "pending" | "paid" | "cancelled"
    amount: float
    membership_type: str  # "individual" | "professional" | "professional_plus" | "association"
    payment_id: Optional[str] = None  # ID HelloAsso
    helloasso_order_id: Optional[str] = None
    member_data: MemberData
    pdf_path: Optional[str] = None
    pdf_generated_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MembershipResponse(BaseModel):
    """Réponse avec les données d'adhésion"""
    id: str
    year: int
    status: str
    amount: float
    membership_type: str
    member_data: MemberData
    pdf_available: bool
    created_at: datetime
    updated_at: datetime
