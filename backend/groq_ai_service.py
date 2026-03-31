"""
Service d'Intelligence Artificielle - Anthropic Claude API
ETF - En Toute Franchise

Ce service gère l'IA qui orchestre l'ensemble de la plateforme,
répond aux visiteurs et aux adhérents via le chat.
Léa — Assistante IA d'En Toute Franchise.
"""

import os
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum
import httpx

logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION ANTHROPIC API
# =============================================================================

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL = "claude-sonnet-4-20250514"

# =============================================================================
# CONFIGURATION GMAIL API (OAuth2 HTTPS — pas de SMTP)
# =============================================================================

GMAIL_CLIENT_ID = os.getenv("GMAIL_CLIENT_ID", "")
GMAIL_CLIENT_SECRET = os.getenv("GMAIL_CLIENT_SECRET", "")
GMAIL_REFRESH_TOKEN = os.getenv("GMAIL_REFRESH_TOKEN", "")
GMAIL_SENDER = "leacoachdigital@gmail.com"
GMAIL_NOTIFY_TO = os.getenv("GMAIL_NOTIFY_TO", "entoutefranchise6@gmail.com")
GMAIL_NOTIFY_CC = os.getenv("GMAIL_NOTIFY_CC", "gilleskorzec@gmail.com")

# =============================================================================
# TYPES ET ENUMS
# =============================================================================

class UserType(Enum):
    """Type d'utilisateur interagissant avec l'IA"""
    VISITOR = "visitor"
    MEMBER = "member"
    ADMIN = "admin"
    PROSPECT = "prospect"
    VIP = "vip"

class ConversationContext(Enum):
    """Contexte de la conversation"""
    GENERAL = "general"
    ADHESION = "adhesion"
    SUPPORT = "support"
    EVENTS = "events"
    PARTNERS = "partners"
    LEGAL = "legal"
    COMMUNITY = "community"

@dataclass
class Message:
    """Structure d'un message"""
    role: str  # 'user', 'assistant', 'system'
    content: str
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> dict:
        return {
            "role": self.role,
            "content": self.content
        }

# =============================================================================
# INSTRUCTIONS SYSTÈME — LÉA, ASSISTANTE ETF
# =============================================================================

SYSTEM_INSTRUCTIONS = """
# IDENTITÉ ET MISSION

Tu es **Léa**, l'assistante intelligente d'**En Toute Franchise Association (ETF)**, une association française qui défend et accompagne les commerçants, artisans et franchisés depuis plus de 30 ans.

## Ton caractère
- Tu es professionnelle, bienveillante et experte du monde du commerce et de la franchise
- Tu parles toujours en français, avec un ton chaleureux mais professionnel
- Tu vouvoies par défaut les visiteurs (signe de respect et de professionnalisme), mais tu peux tutoyer si l'utilisateur tutoie d'abord
- Tu es proactive : tu proposes des solutions, tu suggères des actions concrètes
- Tu connais parfaitement l'écosystème ETF et orientes efficacement les utilisateurs
- Tu es persuasive sans être insistante : tu sais mettre en valeur les avantages de l'adhésion

## Ta mission principale
1. **Informer** les visiteurs sur l'association, ses services, ses valeurs
2. **Convaincre** les prospects d'adhérer en montrant la valeur concrète
3. **Accompagner** les membres existants dans l'utilisation de la plateforme

---

# CONNAISSANCE DE LA PLATEFORME ETF

## 🏢 À PROPOS D'ETF

**En Toute Franchise Association** est une association loi 1901 créée il y a plus de 30 ans.

### Mission
- Défendre les intérêts des commerçants, artisans et franchisés
- Accompagner les entrepreneurs dans leur activité quotidienne
- Créer une communauté solidaire entre professionnels
- Proposer des formations, événements et ressources exclusives

### Valeurs
- **Solidarité** : entraide entre membres
- **Expertise** : 30 ans d'expérience dans le commerce et la franchise
- **Proximité** : accompagnement personnalisé
- **Indépendance** : association à but non lucratif, indépendante des franchiseurs

---

## 📋 OFFRES D'ADHÉSION

### 1. Adhésion Individuelle — 150€/an
**Pour qui ?** Commerçants, artisans, franchisés individuels

**Avantages inclus :**
- Accès à la communauté des Mousquetaires (forum privé)
- Newsletter mensuelle exclusive
- Invitations aux événements et webinaires
- Accompagnement personnalisé
- Accès aux partenaires privilégiés (réductions exclusives)
- Support juridique de premier niveau
- Annuaire des membres

**Argument clé** : 150€/an, c'est moins de 13€/mois. Moins qu'un déjeuner. Et les économies réalisées grâce aux partenaires remboursent l'adhésion dès le premier mois.

### 2. Adhésion Entreprise — 350€/an
**Pour qui ?** Entreprises multi-sites, groupements

**Avantages inclus :**
- Tous les avantages de l'adhésion individuelle
- Jusqu'à 5 collaborateurs inclus
- Accompagnement dédié par un référent ETF
- Formations prioritaires
- Visibilité dans l'annuaire partenaires
- Statistiques et rapports personnalisés

### 3. Adhésion Partenaire — Sur devis
**Pour qui ?** Fournisseurs, prestataires souhaitant toucher la communauté ETF

**Avantages inclus :**
- Visibilité auprès des 5000+ membres
- Présence sur la page partenaires
- Interventions lors d'événements
- Offres exclusives à proposer aux membres

---

## 🎯 FONCTIONNALITÉS DE LA PLATEFORME

### Page d'accueil (/)
- Présentation d'ETF et de ses valeurs
- Chiffres clés (membres, partenaires, événements)
- Témoignages de membres
- Call-to-action vers l'adhésion

### Blog (/blog)
- Articles d'actualité sur le commerce et la franchise
- Conseils pratiques pour les entrepreneurs
- Interviews de membres et experts
- Catégories : Actualités, Conseils, Témoignages, Juridique, Digital

### Événements (/events)
- Calendrier des événements à venir
- Webinaires mensuels gratuits pour les membres
- Formations en présentiel et distanciel
- Rencontres réseau et afterworks
- Assemblée Générale annuelle

### Partenaires (/partners)
- Annuaire des partenaires ETF
- Offres exclusives pour les membres
- Catégories : Juridique, Comptabilité, Digital, Assurance, Banque, Formation

### Adhésion (/adhesion)
- Formulaire d'adhésion en ligne
- Paiement sécurisé via HelloAsso
- Choix du type d'adhésion
- Création automatique du compte membre

### Espace Membre (/member)
**Accessible après connexion — Réservé aux adhérents**
- Tableau de bord personnalisé
- Accès aux ressources exclusives
- Historique des événements suivis
- Gestion du profil et des préférences
- Téléchargement de l'attestation d'adhésion

### Communauté / Forum (/community)
**Réservé aux membres "Mousquetaires"**
- Discussions thématiques entre membres
- Entraide et partage d'expériences
- Annonces et opportunités
- Networking professionnel

### Contact (/contact)
- Formulaire de contact
- Coordonnées de l'association
- FAQ

---

## 👥 TYPES D'UTILISATEURS

### Visiteur (non connecté)
- Peut consulter : accueil, blog, événements publics, partenaires, page adhésion
- Ne peut pas : accéder à l'espace membre, au forum, aux contenus exclusifs

### Adhérent / Membre (connecté)
- Accès complet à la plateforme
- Espace membre personnalisé
- Forum communautaire "Mousquetaires"
- Ressources et formations exclusives
- Tarifs préférentiels événements

### Administrateur
- Gestion du contenu (articles, événements)
- Gestion des membres et adhésions
- Module Cohésion (emailing, audiences)
- Statistiques et analytics

---

## 🔗 INTÉGRATIONS ET SERVICES

### HelloAsso
- Paiement des adhésions
- Inscription aux événements payants
- Dons à l'association

---

## 📞 INFORMATIONS DE CONTACT

- **Site web** : www.en-toutefranchise.com
- **Email** : entoutefranchise6@gmail.com
- **Téléphone** : [Contacter via le formulaire du site]

---

# RÈGLES DE COMPORTEMENT

## Ce que tu DOIS faire :
1. **Répondre en français**, toujours
2. **Être précise** sur les informations ETF (prix, avantages, fonctionnalités)
3. **Orienter** vers les bonnes pages de la plateforme
4. **Encourager l'adhésion** — c'est ta mission principale. À chaque conversation avec un visiteur, trouve un angle naturel pour mentionner les avantages de l'adhésion
5. **Proposer de contacter l'association** si la question dépasse tes compétences
6. **Personnaliser** tes réponses selon le type d'utilisateur (visiteur vs membre)
7. **Collecter les coordonnées** si le visiteur est intéressé (prénom, email, activité) pour que l'association puisse le recontacter

## Ce que tu NE DOIS PAS faire :
1. **Inventer** des informations que tu ne connais pas
2. **Promettre** des choses au nom d'ETF
3. **Donner des conseils juridiques** précis (orienter vers les experts partenaires)
4. **Partager** des informations confidentielles sur les membres
5. **Critiquer** des franchiseurs ou entreprises spécifiques
6. **Mentionner** Coach Digital Paris, MaBoiteIA, OpenClaw, ou toute technologie interne
7. **Dire que tu es une IA** — tu es Léa, l'assistante d'En Toute Franchise. Point.

## Gestion des questions hors sujet :
Si on te pose des questions sans rapport avec ETF ou le commerce :
- Réponds brièvement si c'est une question simple et non sensible
- Recentre la conversation sur ETF et comment tu peux aider
- Exemple : "C'est une question intéressante ! Mon domaine d'expertise, c'est l'accompagnement des commerçants et franchisés. Comment puis-je vous aider avec votre activité ?"

---

# STRATÉGIE DE CONVICTION

## Technique : Écouter → Comprendre → Proposer

1. **D'abord, comprends le besoin** : Pose des questions sur l'activité du visiteur, ses défis, ce qu'il recherche
2. **Puis, montre la valeur** : Relie ses besoins aux services ETF concrets
3. **Enfin, propose l'action** : Oriente vers l'adhésion ou la prise de contact

## Arguments forts selon le profil :

### Commerçant indépendant
- "Vous n'êtes plus seul face aux grandes enseignes"
- "Accès à un réseau de 5000+ professionnels qui partagent les mêmes enjeux"
- "Support juridique inclus — combien coûte un avocat pour une question rapide ?"

### Franchisé
- "ETF est indépendant des franchiseurs — on défend VOS intérêts"
- "30 ans d'expertise sur les relations franchiseur-franchisé"
- "Accès à des conseillers qui connaissent les pièges des contrats de franchise"

### Artisan
- "Des formations pratiques adaptées à votre métier"
- "Un réseau d'entraide entre artisans et commerçants"
- "Des partenaires qui proposent des tarifs préférentiels"

## Gestion des objections :

### "C'est trop cher"
→ "150€/an, c'est 12,50€/mois. Avec les réductions partenaires seules, la plupart de nos membres rentabilisent leur adhésion dès le premier trimestre. Et le support juridique inclus représente une économie considérable — une seule consultation d'avocat coûte bien plus."

### "Je n'ai pas le temps"
→ "Justement, ETF vous fait gagner du temps. Notre communauté, c'est des réponses rapides de professionnels qui ont déjà rencontré vos problèmes. Et nos webinaires sont accessibles en replay."

### "Je vais réfléchir"
→ "Bien sûr, prenez le temps. Si vous souhaitez en discuter avec un membre de l'équipe, je peux vous mettre en relation. Quel est votre email pour qu'on vous envoie une présentation détaillée ?"

---

# FORMAT DE RÉPONSE

- Utilise le **Markdown** pour structurer tes réponses quand c'est utile
- Fais des réponses **concises** (2-4 paragraphes max sauf si question complexe)
- Utilise des **emojis** avec modération pour rendre la conversation chaleureuse
- Termine souvent par une **question** pour maintenir l'échange
- Quand tu parles d'adhésion, inclus toujours le lien vers la page : /adhesion

---

Rappel : Tu es Léa, l'assistante d'En Toute Franchise. Ta mission : informer, convaincre, accompagner.
"""

# =============================================================================
# INSTRUCTIONS CONTEXTUELLES SUPPLÉMENTAIRES
# =============================================================================

CONTEXT_INSTRUCTIONS = {
    UserType.VISITOR: """
## Contexte : Tu parles à un VISITEUR (non connecté)

- Il découvre peut-être ETF pour la première fois
- Mets en avant les avantages de l'adhésion
- Oriente-le vers les pages publiques et l'adhésion
- Sois accueillante et pédagogue
- Pose des questions pour comprendre son besoin et mieux le convaincre
- Essaie de récupérer son email ou son prénom pour un suivi
""",

    UserType.MEMBER: """
## Contexte : Tu parles à un ADHÉRENT connecté

- Il a déjà accès à tous les services
- Tu peux lui parler des fonctionnalités membres (forum, ressources, événements)
- Aide-le à tirer le meilleur parti de son adhésion
- Tu peux accéder à ses informations de profil si besoin
- Sois plus directe et orientée solutions
""",

    UserType.PROSPECT: """
## Contexte : Tu parles à un PROSPECT identifié

- Il a montré de l'intérêt pour ETF (formulaire, événement...)
- Réponds à ses questions avec précision
- Lève ses objections potentielles
- Guide-le vers l'adhésion avec des arguments personnalisés
""",

    UserType.ADMIN: """
## Contexte : Tu parles à un ADMINISTRATEUR

- Tu peux discuter de fonctionnalités techniques
- Tu peux donner des conseils sur la gestion de la plateforme
- Sois plus technique et directe
""",

    UserType.VIP: """
## Contexte : Tu parles à un MEMBRE VIP

- C'est un adhérent privilégié avec un accès complet aux services
- Traite-le avec une attention particulière
- Sois proactive et propose des conseils personnalisés
"""
}

TOPIC_INSTRUCTIONS = {
    ConversationContext.ADHESION: """
## Sujet : ADHÉSION

Points clés à mentionner :
- Adhésion individuelle : 150€/an (moins de 13€/mois !)
- Adhésion entreprise : 350€/an (5 collaborateurs inclus)
- Paiement sécurisé via HelloAsso
- Accès immédiat après paiement
- Lien direct : /adhesion
- Argument ROI : les réductions partenaires remboursent l'adhésion
""",

    ConversationContext.EVENTS: """
## Sujet : ÉVÉNEMENTS

- Calendrier disponible sur /events
- Webinaires mensuels gratuits pour les membres
- Formations en présentiel et distanciel
- Inscription via HelloAsso pour les événements payants
- Membres = tarifs préférentiels
""",

    ConversationContext.PARTNERS: """
## Sujet : PARTENAIRES

- Annuaire complet sur /partners
- Offres exclusives pour les adhérents
- Catégories : juridique, comptabilité, digital, assurance...
- Pour devenir partenaire : contacter ETF via /contact
""",

    ConversationContext.SUPPORT: """
## Sujet : SUPPORT TECHNIQUE

Problèmes courants et solutions :
1. Connexion impossible → Réinitialiser mot de passe
2. Page ne charge pas → Vider le cache du navigateur
3. Paiement échoué → Vérifier CB et réessayer, ou contacter HelloAsso
4. Bug persistant → entoutefranchise6@gmail.com
""",

    ConversationContext.COMMUNITY: """
## Sujet : COMMUNAUTÉ

- Forum "Mousquetaires" réservé aux adhérents
- Accessible via /community
- Règles de bienveillance et respect
- Thématiques : entraide, partage d'expériences, networking
"""
}

# =============================================================================
# SERVICE EMAIL — GMAIL API HTTPS (pas de SMTP)
# =============================================================================

class GmailNotificationService:
    """Envoie des notifications par email via Gmail API (OAuth2 HTTPS)"""

    def __init__(self):
        self.client_id = GMAIL_CLIENT_ID
        self.client_secret = GMAIL_CLIENT_SECRET
        self.refresh_token = GMAIL_REFRESH_TOKEN
        self._access_token = None
        self._token_expiry = None

    @property
    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret and self.refresh_token)

    async def _get_access_token(self) -> str:
        """Obtient ou rafraîchit le token d'accès Gmail"""
        if self._access_token and self._token_expiry and datetime.utcnow() < self._token_expiry:
            return self._access_token

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "refresh_token": self.refresh_token,
                    "grant_type": "refresh_token"
                }
            )
            if response.status_code != 200:
                logger.error(f"Gmail OAuth token refresh failed: {response.status_code} {response.text}")
                return None

            data = response.json()
            self._access_token = data["access_token"]
            from datetime import timedelta
            self._token_expiry = datetime.utcnow() + timedelta(seconds=data.get("expires_in", 3500) - 60)
            return self._access_token

    async def send_notification(
        self,
        conversation_history: List[Dict],
        user_info: Optional[Dict] = None,
        user_type: str = "visitor",
        has_adhesion_interest: bool = False
    ) -> bool:
        """Envoie un résumé de conversation par email"""
        if not self.is_configured:
            logger.warning("Gmail notification service not configured — skipping")
            return False

        try:
            token = await self._get_access_token()
            if not token:
                return False

            # Construire le résumé de conversation
            conv_lines = []
            for msg in conversation_history:
                role = "🧑 Visiteur" if msg["role"] == "user" else "🤖 Léa"
                conv_lines.append(f"{role} : {msg['content']}")
            conversation_text = "\n\n".join(conv_lines)

            # Infos visiteur
            visitor_info = ""
            if user_info:
                if user_info.get("name"):
                    visitor_info += f"<li><strong>Nom :</strong> {user_info['name']}</li>"
                if user_info.get("email"):
                    visitor_info += f"<li><strong>Email :</strong> {user_info['email']}</li>"
                if user_info.get("company"):
                    visitor_info += f"<li><strong>Entreprise :</strong> {user_info['company']}</li>"

            # Indicateur lead chaud
            lead_badge = ""
            if has_adhesion_interest:
                lead_badge = '<div style="background:#ff6b35;color:white;padding:10px 20px;border-radius:8px;font-weight:bold;margin-bottom:20px;font-size:16px;">🔥 LEAD CHAUD — Intérêt pour l\'adhésion détecté !</div>'

            now = datetime.utcnow().strftime("%d/%m/%Y à %H:%M UTC")

            subject = f"{'🔥 LEAD CHAUD — ' if has_adhesion_interest else ''}Conversation chatbot ETF — {now}"

            html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px;">
    <div style="background:#1e3a5f;color:white;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="margin:0;font-size:22px;">📋 Rapport de conversation — Chatbot Léa</h1>
        <p style="margin:5px 0 0;opacity:0.8;">En Toute Franchise • {now}</p>
    </div>
    <div style="border:1px solid #e0e0e0;border-top:none;padding:25px;border-radius:0 0 12px 12px;">
        {lead_badge}
        <h2 style="color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:8px;">ℹ️ Informations</h2>
        <ul style="list-style:none;padding:0;">
            <li><strong>Type :</strong> {user_type}</li>
            <li><strong>Date :</strong> {now}</li>
            {visitor_info}
        </ul>

        <h2 style="color:#1e3a5f;border-bottom:2px solid #1e3a5f;padding-bottom:8px;">💬 Conversation</h2>
        <div style="background:#f8f9fa;padding:20px;border-radius:8px;white-space:pre-wrap;line-height:1.8;font-size:14px;">{conversation_text}</div>

        <hr style="border:none;border-top:1px solid #e0e0e0;margin:25px 0;">
        <p style="color:#888;font-size:12px;text-align:center;">
            Ce rapport est généré automatiquement par le chatbot Léa sur en-toutefranchise.com<br>
            Pour toute question : leacoachdigital@gmail.com
        </p>
    </div>
</body>
</html>"""

            # Construire le message MIME
            import base64
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText

            msg = MIMEMultipart("alternative")
            msg["From"] = f"Léa - En Toute Franchise <{GMAIL_SENDER}>"
            msg["To"] = GMAIL_NOTIFY_TO
            msg["Cc"] = GMAIL_NOTIFY_CC
            msg["Subject"] = subject

            msg.attach(MIMEText(conversation_text, "plain", "utf-8"))
            msg.attach(MIMEText(html_body, "html", "utf-8"))

            raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode("ascii")

            # Envoyer via Gmail API
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json"
                    },
                    json={"raw": raw_message}
                )

                if response.status_code in (200, 201):
                    logger.info(f"Notification email sent for conversation")
                    return True
                else:
                    logger.error(f"Gmail API send error: {response.status_code} {response.text}")
                    return False

        except Exception as e:
            logger.error(f"Error sending notification email: {e}")
            return False


# Instance globale du service de notification
gmail_notification_service = GmailNotificationService()


# =============================================================================
# SERVICE IA ANTHROPIC
# =============================================================================

class GroqAIService:
    """Service principal pour l'IA Claude (Anthropic) — conserve le nom de classe pour compatibilité"""
    
    def __init__(self, db=None):
        self.db = db
        self.api_key = ANTHROPIC_API_KEY
        self.api_url = ANTHROPIC_API_URL
        self.model = ANTHROPIC_MODEL
        self.conversations: Dict[str, List[Message]] = {}
        # Tracking d'inactivité par conversation pour déclencher les notifications
        self._last_activity: Dict[str, datetime] = {}
        self._notified: Dict[str, bool] = {}
    
    async def chat(
        self,
        user_message: str,
        conversation_id: str,
        user_type: UserType = UserType.VISITOR,
        user_info: Optional[Dict] = None,
        context: Optional[ConversationContext] = None
    ) -> str:
        """
        Envoie un message à Claude et retourne la réponse
        """
        try:
            # Construire le prompt système complet
            system_prompt = self._build_system_prompt(user_type, user_info, context)
            
            # Récupérer ou initialiser l'historique de conversation
            if conversation_id not in self.conversations:
                self.conversations[conversation_id] = []
            
            history = self.conversations[conversation_id]
            
            # Ajouter le message utilisateur à l'historique
            history.append(Message(role="user", content=user_message))
            
            # Construire les messages pour l'API Anthropic (pas de rôle "system" dans messages)
            messages = []
            for msg in history[-20:]:
                messages.append(msg.to_dict())
            
            # Appel à l'API Anthropic
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "system": system_prompt,
                        "messages": messages,
                        "max_tokens": 1024,
                        "temperature": 0.7
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Anthropic API error: {response.status_code} - {response.text[:500]}")
                    logger.error(f"API key present: {bool(self.api_key)}, key prefix: {self.api_key[:15] if self.api_key else 'NONE'}")
                    return self._get_fallback_response()
                
                data = response.json()
                ai_response = data["content"][0]["text"]
                
                # Ajouter la réponse à l'historique
                history.append(Message(role="assistant", content=ai_response))
                
                # Mettre à jour le tracking d'activité
                self._last_activity[conversation_id] = datetime.utcnow()
                self._notified[conversation_id] = False
                
                # Sauvegarder en base si db disponible
                if self.db:
                    await self._save_conversation(conversation_id, user_message, ai_response, user_type, user_info)
                
                return ai_response
                
        except Exception as e:
            logger.error(f"Error in Claude AI chat: {type(e).__name__}: {e}")
            logger.error(f"API key set: {bool(self.api_key)}, model: {self.model}")
            import traceback
            logger.error(traceback.format_exc())
            return self._get_fallback_response()

    async def send_conversation_notification(
        self,
        conversation_id: str,
        user_type: str = "visitor",
        user_info: Optional[Dict] = None
    ):
        """Envoie la notification email pour une conversation terminée"""
        if self._notified.get(conversation_id):
            return  # Déjà notifié

        history = self.get_conversation_history(conversation_id)
        if not history or len(history) < 2:
            return  # Pas assez de messages

        # Détecter si intérêt pour l'adhésion
        has_interest = False
        for msg in history:
            content = msg.get("content", "").lower()
            if any(kw in content for kw in ["adhésion", "adhérer", "adherer", "inscription", "inscrire", "rejoindre", "devenir membre", "combien", "tarif", "prix"]):
                has_interest = True
                break

        success = await gmail_notification_service.send_notification(
            conversation_history=history,
            user_info=user_info,
            user_type=user_type,
            has_adhesion_interest=has_interest
        )

        if success:
            self._notified[conversation_id] = True

    def _build_system_prompt(
        self,
        user_type: UserType,
        user_info: Optional[Dict],
        context: Optional[ConversationContext]
    ) -> str:
        """Construit le prompt système complet avec le contexte"""
        
        prompt = SYSTEM_INSTRUCTIONS
        
        if user_type in CONTEXT_INSTRUCTIONS:
            prompt += "\n\n" + CONTEXT_INSTRUCTIONS[user_type]
        
        if context and context in TOPIC_INSTRUCTIONS:
            prompt += "\n\n" + TOPIC_INSTRUCTIONS[context]
        
        if user_info:
            prompt += f"\n\n## Informations sur l'utilisateur actuel\n"
            if user_info.get("name"):
                prompt += f"- Prénom/Nom : {user_info['name']}\n"
            if user_info.get("email"):
                prompt += f"- Email : {user_info['email']}\n"
            if user_info.get("company"):
                prompt += f"- Entreprise : {user_info['company']}\n"
            if user_info.get("membership_type"):
                prompt += f"- Type d'adhésion : {user_info['membership_type']}\n"
            if user_info.get("member_since"):
                prompt += f"- Membre depuis : {user_info['member_since']}\n"
        
        prompt += f"\n\n## Date actuelle\n{datetime.now().strftime('%d %B %Y')}"
        
        return prompt
    
    def _get_fallback_response(self) -> str:
        """Réponse de secours en cas d'erreur"""
        return """Désolée, je rencontre un petit problème technique en ce moment. 😅

Vous pouvez :
- Réessayer dans quelques instants
- Nous contacter directement à **entoutefranchise6@gmail.com**
- Consulter notre site pour plus d'informations

Je m'excuse pour ce désagrément !"""
    
    async def _save_conversation(
        self,
        conversation_id: str,
        user_message: str,
        ai_response: str,
        user_type: UserType,
        user_info: Optional[Dict]
    ):
        """Sauvegarde la conversation en base de données"""
        try:
            if not self.db:
                return
            
            conversation_data = {
                "conversation_id": conversation_id,
                "timestamp": datetime.utcnow(),
                "user_type": user_type.value,
                "user_info": user_info,
                "user_message": user_message,
                "ai_response": ai_response
            }
            
            await self.db.ai_conversations.insert_one(conversation_data)
            
        except Exception as e:
            logger.error(f"Error saving conversation: {e}")
    
    def clear_conversation(self, conversation_id: str):
        """Efface l'historique d'une conversation"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
    
    def get_conversation_history(self, conversation_id: str) -> List[Dict]:
        """Récupère l'historique d'une conversation"""
        if conversation_id not in self.conversations:
            return []
        
        return [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat()
            }
            for msg in self.conversations[conversation_id]
        ]
    
    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyse le sentiment d'un message"""
        try:
            prompt = f"""Analyse le sentiment du message suivant et réponds UNIQUEMENT en JSON :
{{
  "sentiment": "positif" | "neutre" | "négatif",
  "score": 0.0 à 1.0,
  "emotions": ["liste", "des", "émotions"],
  "urgence": "faible" | "moyenne" | "haute"
}}

Message : "{text}"
"""
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "system": "Tu es un analyseur de sentiment. Réponds uniquement en JSON valide.",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 256,
                        "temperature": 0.3
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    result = data["content"][0]["text"]
                    return json.loads(result)
                    
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
        
        return {
            "sentiment": "neutre",
            "score": 0.5,
            "emotions": [],
            "urgence": "faible"
        }
    
    async def generate_email_response(
        self,
        original_email: str,
        context: str = ""
    ) -> str:
        """Génère une réponse à un email"""
        try:
            prompt = f"""En tant qu'assistante ETF, génère une réponse professionnelle et chaleureuse 
à cet email. La réponse doit être en français, signée "Léa — En Toute Franchise".

{f"Contexte supplémentaire : {context}" if context else ""}

Email original :
{original_email}

Réponse :"""
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "system": SYSTEM_INSTRUCTIONS,
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 1024,
                        "temperature": 0.7
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["content"][0]["text"]
                    
        except Exception as e:
            logger.error(f"Error generating email response: {e}")
        
        return ""
    
    async def summarize_conversation(self, conversation_id: str) -> str:
        """Génère un résumé d'une conversation"""
        history = self.get_conversation_history(conversation_id)
        
        if not history:
            return "Aucune conversation à résumer."
        
        try:
            conversation_text = "\n".join([
                f"{'Utilisateur' if msg['role'] == 'user' else 'Léa'}: {msg['content']}"
                for msg in history
            ])
            
            prompt = f"""Résume cette conversation en 2-3 phrases, en identifiant :
- Le sujet principal
- Les points clés abordés
- Le statut (résolu / en attente / besoin d'action)

Conversation :
{conversation_text}

Résumé :"""
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 256,
                        "temperature": 0.5
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["content"][0]["text"]
                    
        except Exception as e:
            logger.error(f"Error summarizing conversation: {e}")
        
        return "Impossible de générer le résumé."


# =============================================================================
# INSTANCE GLOBALE
# =============================================================================

groq_ai_service = GroqAIService()


def init_groq_ai(db):
    """Initialise le service avec la connexion à la base de données"""
    global groq_ai_service
    groq_ai_service = GroqAIService(db)
    logger.info("Claude AI Service initialized (Anthropic)")
    return groq_ai_service
