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
    password: str = ""  # Mot de passe hashé
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
    # Champs pour reinitialisation de mot de passe
    resetToken: Optional[str] = None
    resetTokenExpires: Optional[datetime] = None
    # Flag premiere connexion (pour forcer mise a jour profil)
    mustChangePassword: bool = False
    lastLogin: Optional[datetime] = None

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
class ArticleCreate(BaseModel):
    """Création d'un article de blog"""
    title: str
    slug: Optional[str] = None  # Généré automatiquement si absent
    excerpt: str  # Résumé court
    content: str  # Contenu HTML complet (texte riche)
    featuredImage: Optional[str] = None  # URL ou path de l'image principale
    category: str  # Catégorie (Juridique, Actualités, etc.)
    tags: Optional[List[str]] = None  # Tags pour le SEO
    status: str = "draft"  # "draft" | "published" | "archived"
    # Canaux de diffusion: "public" (blog visiteurs), "members" (espace adhérents), "featured" (page accueil)
    publishTo: List[str] = ["public"]
    author: Optional[str] = None  # Nom de l'auteur (sinon admin connecté)
    readTime: Optional[str] = None  # Temps de lecture estimé
    # SEO
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    # Réseaux sociaux
    shareToSocial: bool = False  # Partager sur les réseaux sociaux
    socialPlatforms: Optional[List[str]] = None  # Plateformes: facebook, instagram, linkedin, twitter

class ArticleUpdate(BaseModel):
    """Mise à jour d'un article"""
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    featuredImage: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None
    publishTo: Optional[List[str]] = None  # Canaux de diffusion
    author: Optional[str] = None
    readTime: Optional[str] = None
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    # Réseaux sociaux (pour republication)
    shareToSocial: bool = False
    socialPlatforms: Optional[List[str]] = None

class Article(BaseModel):
    """Article de blog complet"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str  # URL-friendly identifier
    excerpt: str  # Résumé court pour les listes
    content: str  # Contenu HTML complet
    featuredImage: Optional[str] = None  # Image principale
    gallery: Optional[List[str]] = None  # Images additionnelles
    attachments: Optional[List[dict]] = None  # PDFs et autres fichiers [{name, url, type}]
    category: str
    tags: Optional[List[str]] = None
    status: str = "draft"  # "draft" | "published" | "archived"
    # Canaux de diffusion: "public" (blog visiteurs), "members" (espace adhérents), "featured" (page accueil)
    publishTo: List[str] = ["public"]
    author: str
    authorId: Optional[str] = None  # ID de l'admin qui a créé
    readTime: str = "5 min"
    views: int = 0  # Nombre de vues
    # SEO
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    # Dates
    publishedAt: Optional[datetime] = None  # Date de publication
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


def generate_membership_reference(year: int, source: str = "web") -> str:
    """
    Génère une référence d'adhésion unique
    - Web: W-ETF2026-XXXX
    - Admin (création manuelle): ETF2026-XXXX
    """
    import random
    import string
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    if source == "web":
        return f"W-ETF{year}-{suffix}"
    else:
        return f"ETF{year}-{suffix}"


class Membership(BaseModel):
    """Adhésion complète"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reference: Optional[str] = None  # Référence lisible: W-ETF2026-XXXX ou ETF2026-XXXX
    source: str = "web"  # "web" (inscription en ligne) ou "admin" (création manuelle)
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
    reference: Optional[str] = None  # Référence lisible: W-ETF2026-XXXX ou ETF2026-XXXX
    source: str = "web"  # "web" ou "admin"
    year: int
    status: str
    amount: float
    membership_type: str
    payment_method: str = "helloasso"
    payment_reference: Optional[str] = None
    payment_date: Optional[datetime] = None
    member_data: MemberData
    pdf_available: bool
    payment_url: Optional[str] = None  # URL de paiement HelloAsso (si status = pending)
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
    role: Optional[str] = None  # "user" | "vip" | "admin" - Détermine l'accès au chat IA

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
    category: str  # "Dossier gagné", "Dossier en cours", "Information", "Alerte", "Autre"
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
    category: str  # "Dossier gagné", "Dossier en cours", "Information", "Alerte", "Autre"
    status: str = "en_cours"  # "en_cours" | "gagne" | "archive"
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


# ===================== ONBOARDING MODELS =====================
class OnboardingData(BaseModel):
    """Données d'onboarding de l'adhérent"""
    # Slide 1: Statut/Profil
    member_status: str  # "particulier" | "commercant" | "artisan" | "grande_entreprise" | "association"
    activity_sector: Optional[str] = None  # Secteur d'activité
    company_size: Optional[str] = None  # "solo" | "1-10" | "11-50" | "50+"
    
    # Slide 2: Motivations
    motivations: List[str] = []  # ["besoin_aide", "soutenir_cause", "reseau", "veille_juridique"]
    main_challenges: Optional[str] = None  # Description libre des défis
    
    # Slide 3: Attentes
    expectations: List[str] = []  # ["ia_assistant", "soutien_numerique", "dossiers", "litiges", "formation"]
    priority_services: Optional[List[str]] = None  # Services prioritaires classés
    how_discovered: Optional[str] = None  # Comment a-t-il connu l'association
    
    # Métadonnées
    completed_at: Optional[datetime] = None
    version: str = "1.0"  # Pour gérer les évolutions futures

class OnboardingCreate(BaseModel):
    """Création/Mise à jour de l'onboarding"""
    member_status: str
    activity_sector: Optional[str] = None
    company_size: Optional[str] = None
    motivations: List[str] = []
    main_challenges: Optional[str] = None
    expectations: List[str] = []
    priority_services: Optional[List[str]] = None
    how_discovered: Optional[str] = None

class UserOnboarding(BaseModel):
    """Onboarding associé à un utilisateur"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    onboarding_data: OnboardingData
    is_completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OnboardingResponse(BaseModel):
    """Réponse avec les données d'onboarding"""
    id: str
    user_id: str
    onboarding_data: OnboardingData
    is_completed: bool
    created_at: datetime
    updated_at: datetime

# ===================== CATEGORIES MODELS =====================

# Catégories prédéfinies pour les dossiers
CASE_CATEGORIES = [
    "Dossier gagné",
    "Dossier en cours",
    "Information",
    "Alerte",
    "Autre"
]

# Catégories prédéfinies pour les articles/blog
ARTICLE_CATEGORIES = [
    "Juridique",
    "Actualités",
    "Droits",
    "Municipales",
    "Ressources",
    "Autre"
]

class CategoryManagement(BaseModel):
    """Gestion des catégories pour dossiers et articles"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # "case" ou "article"
    name: str
    slug: str
    description: Optional[str] = None
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


# ===================== MABOITEDIGITALE MODELS =====================
class MaBoiteDigitaleConfig(BaseModel):
    """Configuration de l'intégration MaBoiteDigitale"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    api_url: str = "https://maboitedigitale.com/api"
    partner_id: str = "etf"
    discount_percentage: float = 20.0
    is_active: bool = True
    last_sync: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MaBoiteDigitaleSSORequest(BaseModel):
    """Requête de génération de token SSO"""
    user_id: str
    redirect_after: Optional[str] = None  # URL de redirection après connexion


class MaBoiteDigitaleSSOResponse(BaseModel):
    """Réponse de génération de token SSO"""
    success: bool
    token: Optional[str] = None
    redirect_url: Optional[str] = None
    expires_at: Optional[datetime] = None
    error: Optional[str] = None
    message: Optional[str] = None


class MaBoiteDigitaleSubscriptionStatus(BaseModel):
    """Statut d'abonnement IA sur MaBoiteDigitale"""
    has_subscription: bool = False
    plan_name: Optional[str] = None
    plan_type: Optional[str] = None  # free, pro, premium
    tokens_remaining: int = 0
    subscription_end_date: Optional[datetime] = None
    discount_applied: bool = False


class MaBoiteDigitalePartnerStats(BaseModel):
    """Statistiques du partenariat MaBoiteDigitale"""
    total_members_registered: int = 0
    active_subscriptions: int = 0
    total_revenue_shared: float = 0.0
    discount_usage: int = 0


class MaBoiteDigitaleMemberSync(BaseModel):
    """Données de synchronisation membre vers MaBoiteDigitale"""
    email: str
    member_number: str
    first_name: str
    last_name: str
    membership_type: str
    membership_end_date: datetime
    discount_percentage: float = 20.0


# ========================================
# ANALYTICS MODELS - Statistiques visiteurs
# ========================================

class PageView(BaseModel):
    """Vue de page individuelle"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    visitor_id: str
    page_url: str
    page_title: Optional[str] = None
    referrer: Optional[str] = None
    referrer_domain: Optional[str] = None
    search_query: Optional[str] = None  # Mots-clés Google si disponible
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    device_type: Optional[str] = None  # desktop, mobile, tablet
    browser: Optional[str] = None
    os: Optional[str] = None
    session_id: Optional[str] = None
    user_id: Optional[str] = None  # Si utilisateur connecté
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Visitor(BaseModel):
    """Visiteur unique (basé sur fingerprint ou cookie)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fingerprint: Optional[str] = None
    first_visit: datetime = Field(default_factory=datetime.utcnow)
    last_visit: datetime = Field(default_factory=datetime.utcnow)
    total_visits: int = 1
    total_page_views: int = 0
    user_id: Optional[str] = None  # Lié si connecté
    country: Optional[str] = None
    city: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    is_online: bool = False
    current_page: Optional[str] = None
    socket_id: Optional[str] = None  # Pour le chat en temps réel


class VisitorSession(BaseModel):
    """Session de visite"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    visitor_id: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    page_views: int = 0
    duration_seconds: int = 0
    entry_page: Optional[str] = None
    exit_page: Optional[str] = None
    referrer: Optional[str] = None
    referrer_domain: Optional[str] = None
    search_query: Optional[str] = None


class AnalyticsStats(BaseModel):
    """Statistiques agrégées pour l'admin"""
    total_visitors: int = 0
    total_page_views: int = 0
    unique_visitors_today: int = 0
    page_views_today: int = 0
    visitors_online: int = 0
    avg_session_duration: float = 0.0
    bounce_rate: float = 0.0
    top_pages: List[dict] = []
    top_referrers: List[dict] = []
    top_search_queries: List[dict] = []
    visitors_by_country: List[dict] = []
    visitors_by_device: List[dict] = []
    visitors_by_day: List[dict] = []


class TrackingEvent(BaseModel):
    """Événement de tracking envoyé par le frontend"""
    event_type: str  # pageview, click, scroll, etc.
    page_url: str
    page_title: Optional[str] = None
    referrer: Optional[str] = None
    visitor_id: Optional[str] = None
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    metadata: Optional[dict] = None
    timestamp: Optional[datetime] = None


# ========================================
# LIVE CHAT MODELS - Chat en temps réel
# ========================================

class ChatMessage(BaseModel):
    """Message de chat"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    sender_type: str  # visitor, admin
    sender_id: str
    sender_name: Optional[str] = None
    content: str
    is_read: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class LiveChatConversation(BaseModel):
    """Conversation de chat en direct"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    visitor_id: str
    visitor_name: Optional[str] = None
    visitor_email: Optional[str] = None
    admin_id: Optional[str] = None  # Admin qui a pris en charge
    admin_name: Optional[str] = None
    status: str = "waiting"  # waiting, active, closed
    started_at: datetime = Field(default_factory=datetime.utcnow)
    last_message_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    messages_count: int = 0
    visitor_page: Optional[str] = None  # Page actuelle du visiteur
    visitor_info: Optional[dict] = None  # Infos supplémentaires


class ChatNotification(BaseModel):
    """Notification de chat pour les admins"""
    type: str  # new_conversation, new_message, visitor_online
    conversation_id: Optional[str] = None
    visitor_id: Optional[str] = None
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ========================================
# COHÉSION MODELS - Gestion de la communauté et emails
# ========================================

class CohesionCategory(BaseModel):
    """Catégorie pour organiser les contacts (ex: Journalistes, Mousquetaires, etc.)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    color: str = "#3B82F6"  # Couleur par défaut (bleu)
    contactsCount: int = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Journalistes",
                "description": "Contacts presse et médias",
                "color": "#10B981"
            }
        }


class CohesionCategoryCreate(BaseModel):
    """Création d'une catégorie"""
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#3B82F6"


class CohesionCategoryUpdate(BaseModel):
    """Mise à jour d'une catégorie"""
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class CohesionContact(BaseModel):
    """Contact de la base cohésion"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    # Nouveaux champs adhérents
    pointDeVenteId: Optional[str] = None  # ID du point de vente
    departement: Optional[str] = None  # Département
    ville: Optional[str] = None  # Ville
    codePostal: Optional[str] = None  # Code postal
    adresse: Optional[str] = None  # Adresse complète
    adherentNom: Optional[str] = None  # Nom adhérent (si différent)
    montantAdhesion: Optional[float] = None  # Montant de l'adhésion
    # Historique des règlements par année
    reglement2023: Optional[bool] = None  # Règlement 2023 effectué
    reglement2024: Optional[bool] = None  # Règlement 2024 effectué
    reglement2025: Optional[bool] = None  # Règlement 2025 effectué
    reglement2026: Optional[bool] = None  # Règlement 2026 effectué
    # Champs HelloAsso
    helloAssoOrderId: Optional[str] = None  # ID commande HelloAsso
    helloAssoFormSlug: Optional[str] = None  # Formulaire HelloAsso
    helloAssoPaymentDate: Optional[datetime] = None  # Date paiement HelloAsso
    # Champs existants
    source: str = "import"  # import, manual, website, helloasso
    tags: List[str] = []
    categoryId: Optional[str] = None  # ID de la catégorie
    categoryName: Optional[str] = None  # Nom de la catégorie (pour affichage)
    status: str = "active"  # active, unsubscribed, bounced, invalid
    emailValidated: bool = False
    importedAt: datetime = Field(default_factory=datetime.utcnow)
    lastContactedAt: Optional[datetime] = None
    metadata: Optional[dict] = None

    class Config:
        json_schema_extra = {
            "example": {
                "email": "contact@example.com",
                "firstName": "Jean",
                "lastName": "Dupont",
                "company": "Entreprise SA",
                "source": "import",
                "tags": ["franchise", "restauration"],
                "categoryId": "abc-123",
                "categoryName": "Journalistes"
            }
        }


class CohesionContactCreate(BaseModel):
    """Création d'un contact"""
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    pointDeVenteId: Optional[str] = None
    departement: Optional[str] = None
    ville: Optional[str] = None
    codePostal: Optional[str] = None
    adresse: Optional[str] = None
    adherentNom: Optional[str] = None
    montantAdhesion: Optional[float] = None
    reglement2023: Optional[bool] = None
    reglement2024: Optional[bool] = None
    reglement2025: Optional[bool] = None
    reglement2026: Optional[bool] = None
    tags: Optional[List[str]] = []
    categoryId: Optional[str] = None
    source: str = "manual"


class CohesionContactUpdate(BaseModel):
    """Mise à jour d'un contact"""
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    pointDeVenteId: Optional[str] = None
    departement: Optional[str] = None
    ville: Optional[str] = None
    codePostal: Optional[str] = None
    adresse: Optional[str] = None
    adherentNom: Optional[str] = None
    montantAdhesion: Optional[float] = None
    reglement2023: Optional[bool] = None
    reglement2024: Optional[bool] = None
    reglement2025: Optional[bool] = None
    reglement2026: Optional[bool] = None
    tags: Optional[List[str]] = None
    categoryId: Optional[str] = None
    status: Optional[str] = None


class CohesionCampaign(BaseModel):
    """Campagne d'email"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    subject: str
    bodyHtml: str
    bodyText: Optional[str] = None
    status: str = "draft"  # draft, scheduled, sending, sent, paused
    recipientTags: List[str] = []  # Tags des contacts ciblés
    recipientCategoryId: Optional[str] = None  # ID de l'audience ciblée
    recipientCount: int = 0
    sentCount: int = 0
    failedCount: int = 0
    openCount: int = 0
    clickCount: int = 0
    scheduledAt: Optional[datetime] = None
    sentAt: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    createdBy: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Newsletter Janvier",
                "subject": "Les actualités de la franchise",
                "bodyHtml": "<h1>Bonjour {firstName}!</h1>",
                "recipientTags": ["newsletter"],
                "recipientCategoryId": "category-uuid"
            }
        }


class CohesionCampaignCreate(BaseModel):
    """Création d'une campagne"""
    name: str
    subject: str
    bodyHtml: str
    bodyText: Optional[str] = None
    recipientTags: Optional[List[str]] = []
    recipientCategoryId: Optional[str] = None
    scheduledAt: Optional[datetime] = None


class CohesionCampaignUpdate(BaseModel):
    """Mise à jour d'une campagne"""
    name: Optional[str] = None
    subject: Optional[str] = None
    bodyHtml: Optional[str] = None
    bodyText: Optional[str] = None
    recipientTags: Optional[List[str]] = None
    recipientCategoryId: Optional[str] = None
    status: Optional[str] = None
    scheduledAt: Optional[datetime] = None


class CohesionEmailLog(BaseModel):
    """Log d'envoi d'email"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaignId: Optional[str] = None
    contactId: str
    email: str
    status: str  # sent, failed, bounced, opened, clicked
    sentAt: datetime = Field(default_factory=datetime.utcnow)
    openedAt: Optional[datetime] = None
    clickedAt: Optional[datetime] = None
    errorMessage: Optional[str] = None


class CohesionImportResult(BaseModel):
    """Résultat d'import CSV"""
    totalRows: int = 0
    imported: int = 0
    duplicates: int = 0
    invalidEmails: int = 0
    errors: List[dict] = []


class CohesionStats(BaseModel):
    """Statistiques de la base cohésion"""
    totalContacts: int = 0
    activeContacts: int = 0
    unsubscribed: int = 0
    bounced: int = 0
    invalid: int = 0
    totalCampaigns: int = 0
    sentCampaigns: int = 0
    totalEmailsSent: int = 0
    averageOpenRate: float = 0.0
    topTags: List[dict] = []
