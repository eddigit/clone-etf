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
    # Nouveaux champs pour profil enrichi
    profilePhoto: Optional[str] = None
    bio: Optional[str] = None
    expertise: Optional[List[str]] = None
    location: Optional[str] = None
    isProfilePublic: bool = True

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
    # Nouveaux champs pour profil enrichi
    profilePhoto: Optional[str] = None  # URL ou path de la photo
    bio: Optional[str] = None  # Description courte
    expertise: Optional[List[str]] = None  # Ex: ["franchise", "restauration"]
    location: Optional[str] = None  # Ville/Région
    isProfilePublic: bool = True  # Visibilité dans l'annuaire

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
    status: str = "pending"  # "pending" | "paid" | "cancelled" | "expired"
    amount: float
    membership_type: str  # "individual" | "professional" | "professional_plus" | "association"
    payment_method: str = "helloasso"  # "helloasso" | "cheque" | "virement" | "especes"
    payment_id: Optional[str] = None  # ID HelloAsso
    helloasso_order_id: Optional[str] = None
    payment_reference: Optional[str] = None  # Référence chèque/virement
    payment_date: Optional[datetime] = None  # Date de réception du paiement
    member_data: MemberData
    pdf_path: Optional[str] = None
    pdf_generated_at: Optional[datetime] = None
    notes: Optional[str] = None  # Notes admin
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MembershipResponse(BaseModel):
    """Réponse avec les données d'adhésion"""
    id: str
    year: int
    status: str
    amount: float
    membership_type: str
    payment_method: str = "helloasso"
    payment_reference: Optional[str] = None
    payment_date: Optional[datetime] = None
    member_data: MemberData
    pdf_available: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class AdminMembershipCreate(BaseModel):
    """Création d'une adhésion par l'admin (paiement manuel)"""
    user_email: EmailStr  # Email de l'adhérent (existant ou nouveau)
    first_name: str
    last_name: str
    phone: Optional[str] = None
    membership_type: str  # "individual" | "professional" | "professional_plus" | "association"
    amount: float
    payment_method: str = "cheque"  # "cheque" | "virement" | "especes"
    payment_reference: Optional[str] = None  # Numéro chèque, référence virement
    payment_date: Optional[datetime] = None
    year: Optional[int] = None  # Année d'adhésion (défaut: année en cours)
    status: str = "paid"  # Généralement "paid" pour paiement manuel
    notes: Optional[str] = None
    member_data: Optional[MemberData] = None  # Optionnel, sera créé si absent

class AdminMembershipUpdate(BaseModel):
    """Mise à jour d'une adhésion par l'admin"""
    status: Optional[str] = None  # "pending" | "paid" | "cancelled" | "expired"
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    payment_date: Optional[datetime] = None
    amount: Optional[float] = None
    notes: Optional[str] = None
    membership_end_date: Optional[datetime] = None  # Pour prolonger l'adhésion

# ===================== COMMUNITY MODELS =====================

# Post Models (Fil d'actualité)
class PostCreate(BaseModel):
    """Création d'un post sur le fil d'actualité"""
    content: str
    attachments: Optional[List[str]] = None  # URLs ou paths de fichiers

class Comment(BaseModel):
    """Commentaire sur un post"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    userFirstName: str
    userLastName: str
    content: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class Post(BaseModel):
    """Post sur le fil d'actualité communautaire"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    userFirstName: str
    userLastName: str
    userProfilePhoto: Optional[str] = None
    content: str
    attachments: Optional[List[str]] = None
    likes: List[str] = []  # Liste des user IDs ayant liké
    comments: List[Comment] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

# Private Messaging Models
class ConversationMember(BaseModel):
    """Membre d'une conversation privée"""
    userId: str
    firstName: str
    lastName: str
    profilePhoto: Optional[str] = None

class PrivateConversation(BaseModel):
    """Conversation privée entre membres"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    members: List[ConversationMember]  # Liste des participants
    lastMessage: Optional[str] = None
    lastMessageAt: Optional[datetime] = None
    unreadCount: dict = {}  # {userId: count} - messages non lus par membre
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class PrivateMessageCreate(BaseModel):
    """Création d'un message privé"""
    recipientId: str
    content: str

class PrivateMessage(BaseModel):
    """Message privé dans une conversation"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversationId: str
    senderId: str
    senderFirstName: str
    senderLastName: str
    content: str
    isRead: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)

# Case Study Models (Dossiers collectifs)
class CaseStudyCreate(BaseModel):
    """Création d'un cas d'étude/dossier"""
    title: str
    description: str
    category: str  # Ex: "litige", "conseil", "administratif"
    documents: Optional[List[str]] = None  # IDs de documents partagés

class CaseStudyComment(BaseModel):
    """Commentaire sur un dossier"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    userFirstName: str
    userLastName: str
    content: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class CaseStudy(BaseModel):
    """Dossier collectif partagé entre membres"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str  # Créateur du dossier
    userFirstName: str
    userLastName: str
    title: str
    description: str
    category: str
    status: str = "en_cours"  # "en_cours" | "historique" | "gagne"
    documents: Optional[List[str]] = None
    comments: List[CaseStudyComment] = []
    likes: List[str] = []  # Membres intéressés/solidaires
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class CaseStudyUpdate(BaseModel):
    """Mise à jour d'un dossier"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None

# Notification Models
class Notification(BaseModel):
    """Notification pour un membre"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str  # Destinataire
    type: str  # "message" | "like" | "comment" | "case_update" | "new_member"
    title: str
    message: str
    relatedId: Optional[str] = None  # ID du post/message/case concerné
    relatedUrl: Optional[str] = None  # URL de navigation
    isRead: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class NotificationCreate(BaseModel):
    """Création d'une notification"""
    userId: str
    type: str
    title: str
    message: str
    relatedId: Optional[str] = None
    relatedUrl: Optional[str] = None

# Forum Models (Q&A / Entraide)
class ForumReplyCreate(BaseModel):
    """Création d'une réponse dans un thread"""
    content: str

class ForumReply(BaseModel):
    """Réponse dans un thread de forum"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    threadId: str
    userId: str
    userFirstName: str
    userLastName: str
    userProfilePhoto: Optional[str] = None
    content: str
    votes: int = 0  # Score de la réponse (upvotes - downvotes)
    votedBy: dict = {}  # {userId: 1 or -1} pour tracking
    isBestAnswer: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class ForumThreadCreate(BaseModel):
    """Création d'un thread de forum"""
    title: str
    content: str
    category: str  # Ex: "juridique", "gestion", "franchise"
    tags: Optional[List[str]] = None

class ForumThread(BaseModel):
    """Thread de discussion dans le forum Q&A"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    userFirstName: str
    userLastName: str
    userProfilePhoto: Optional[str] = None
    title: str
    content: str
    category: str
    tags: Optional[List[str]] = None
    replies: List[ForumReply] = []
    views: int = 0
    status: str = "open"  # "open" | "solved" | "closed"
    bestAnswerId: Optional[str] = None  # ID de la meilleure réponse
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

# Member Profile Update
class UserProfileUpdate(BaseModel):
    """Mise à jour du profil utilisateur"""
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    businessName: Optional[str] = None
    businessType: Optional[str] = None
    profilePhoto: Optional[str] = None
    bio: Optional[str] = None
    expertise: Optional[List[str]] = None
    location: Optional[str] = None
    isProfilePublic: Optional[bool] = None
