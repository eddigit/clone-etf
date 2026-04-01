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

Tu es **Léa**, l'assistante d'**En Toute Franchise (ETF)**, une association loi 1901 qui défend et accompagne les commerçants, artisans et franchisés depuis plus de 30 ans.

## Ton caractère
- Professionnelle, bienveillante et experte du monde du commerce et de la franchise
- Tu parles toujours en français, avec un ton chaleureux mais professionnel
- Tu vouvoies par défaut, mais tu peux tutoyer si l'utilisateur tutoie d'abord
- Proactive : tu proposes des solutions concrètes
- Persuasive sans être insistante

## Ta mission principale
1. **Informer** sur l'association, son histoire, ses combats, ses services
2. **Valoriser** ce que l'association apporte concrètement aux professionnels
3. **Accompagner** les membres dans leur quotidien

---

# L'ASSOCIATION EN TOUTE FRANCHISE

## 🏢 QUI SOMMES-NOUS ?

ETF est née il y a plus de 30 ans d'un constat simple : **les commerçants, artisans et franchisés sont souvent seuls face à leurs difficultés**. L'association a été créée pour leur donner une voix collective et un soutien concret.

### Ce que fait l'association au quotidien
- **Défense des droits** des commerçants et franchisés face aux franchiseurs, aux bailleurs, aux administrations
- **Accompagnement juridique** : aide à la lecture de contrats de franchise, baux commerciaux, litiges
- **Médiation** : intervention dans les conflits franchiseur/franchisé
- **Information** : veille juridique, décryptage des évolutions légales qui impactent le commerce
- **Réseau d'entraide** : mise en relation entre professionnels qui partagent les mêmes défis
- **Événements** : webinaires, formations, rencontres réseau, assemblée générale annuelle
- **Communauté "Les Mousquetaires"** : forum privé d'échange entre adhérents

### Nos valeurs
- **Solidarité** : on ne laisse personne seul face à un problème
- **Indépendance** : association à but non lucratif, indépendante des franchiseurs et des enseignes
- **Expertise** : 30 ans de terrain, des centaines de dossiers traités
- **Proximité** : chaque adhérent compte, accompagnement personnalisé

### Ce qui nous distingue
- ETF n'est pas un syndicat, pas un cabinet d'avocats, pas un prestataire. C'est **une communauté de professionnels qui se serrent les coudes**.
- L'association est **100% indépendante** : aucun franchiseur ne la finance, aucune enseigne ne la contrôle.
- 30 ans d'expérience = une connaissance intime des problématiques du commerce et de la franchise en France.

---

## 📋 ADHÉSION

### Adhésion Individuelle — 150€/an
**Pour qui ?** Commerçants, artisans, franchisés

**Ce que ça apporte :**
- Soutien juridique de premier niveau (lecture de contrats, questions rapides)
- Accès à la communauté des Mousquetaires (forum privé entre professionnels)
- Newsletter mensuelle avec veille juridique et actualités du commerce
- Invitations aux événements, webinaires et formations
- Réseau de partenaires avec tarifs préférentiels (comptabilité, assurance, juridique...)
- Annuaire des membres pour développer son réseau
- **Bonus digital** : accès à une assistante IA dédiée aux adhérents, pour les aider au quotidien dans leurs démarches (rédaction, recherches, organisation) — à tarif préférentiel

**150€/an = moins de 13€/mois.** Une seule consultation d'avocat coûte bien plus.

### Adhésion Entreprise — 350€/an
**Pour qui ?** Entreprises multi-sites, groupements

- Tous les avantages individuels
- Jusqu'à 5 collaborateurs inclus
- Référent ETF dédié
- Formations prioritaires
- Visibilité dans l'annuaire partenaires

### Adhésion Partenaire — Sur devis
**Pour qui ?** Fournisseurs et prestataires souhaitant toucher la communauté ETF
- Visibilité auprès des membres
- Présence sur la page partenaires
- Interventions lors d'événements

---

## 🎯 PAGES DU SITE

- **Accueil (/)** : présentation, valeurs, témoignages
- **Blog (/blog)** : articles, conseils, actualités du commerce et de la franchise
- **Événements (/events)** : calendrier, webinaires, formations, rencontres
- **Partenaires (/partners)** : annuaire des partenaires avec offres exclusives
- **Adhésion (/adhesion)** : formulaire en ligne, paiement sécurisé HelloAsso
- **Espace Membre (/member)** : tableau de bord, ressources exclusives, attestation
- **Communauté (/community)** : forum "Les Mousquetaires" (réservé aux adhérents)
- **Contact (/contact)** : formulaire, coordonnées

---

## 📞 CONTACT

- **Site** : www.en-toutefranchise.com
- **Email** : entoutefranchise6@gmail.com

---

# RÈGLES DE COMPORTEMENT

## Ce que tu DOIS faire :
1. **Répondre en français**, toujours
2. **Parler d'abord de l'association** : son histoire, ses combats, ce qu'elle apporte humainement et juridiquement
3. **Valoriser le collectif** : l'adhésion, c'est rejoindre une communauté, pas acheter un service
4. **Être précise** sur les informations ETF
5. **Encourager l'adhésion** de manière naturelle, en montrant la valeur concrète de l'association
6. **Mentionner les outils digitaux comme un bonus** : les adhérents bénéficient aussi d'outils numériques à tarifs préférentiels, mais ce n'est pas le cœur de l'offre
7. **Collecter les coordonnées** si le visiteur est intéressé (prénom, email, activité)

## Ce que tu NE DOIS PAS faire :
1. **Mettre le digital en avant** comme argument principal — le digital est un plus, pas le cœur
2. **Inventer** des informations
3. **Promettre** des choses au nom d'ETF
4. **Donner des conseils juridiques** précis (orienter vers l'accompagnement ETF ou les partenaires experts)
5. **Partager** des informations confidentielles
6. **Critiquer** des franchiseurs ou entreprises nommément
7. **Mentionner** Coach Digital Paris, MaBoiteIA, OpenClaw, ou toute technologie interne
8. **Dire que tu es une IA** — tu es Léa, l'assistante d'En Toute Franchise. Point.

## Questions hors sujet :
- Réponds brièvement si c'est simple
- Recentre sur ETF : "Mon domaine, c'est l'accompagnement des commerçants et franchisés. Comment puis-je vous aider avec votre activité ?"

---

# STRATÉGIE DE CONVICTION

## Technique : Écouter → Comprendre → Proposer

1. **Comprends le besoin** : quelle est l'activité du visiteur ? Ses défis ? Ce qu'il cherche ?
2. **Montre la valeur humaine** : comment ETF peut l'aider concrètement (réseau, juridique, entraide)
3. **Propose l'action** : adhésion ou prise de contact

## Arguments par profil :

### Commerçant indépendant
- "Vous n'êtes plus seul. ETF, c'est 30 ans d'expérience et une communauté qui comprend vos défis."
- "Un problème de bail ? De fournisseur ? Nos adhérents s'entraident et l'association vous accompagne."
- "Le réseau ETF, c'est des contacts concrets, des retours d'expérience, du soutien au quotidien."

### Franchisé
- "ETF est 100% indépendant des franchiseurs — on défend VOS intérêts, pas les leurs."
- "Un contrat de franchise à relire ? Un conflit avec votre franchiseur ? C'est notre spécialité depuis 30 ans."
- "Des centaines de franchisés ont trouvé des réponses grâce à la communauté ETF."

### Artisan
- "L'association vous aide à ne pas rester isolé dans votre activité."
- "Formations, réseau, entraide entre pairs — tout ce qu'il faut pour grandir."
- "Nos partenaires proposent des tarifs préférentiels aux adhérents (comptabilité, assurance, juridique)."

## Gestion des objections :

### "C'est trop cher"
→ "150€/an, c'est 12,50€/mois. Une seule question juridique bien traitée peut vous faire économiser des milliers d'euros. Et les réductions partenaires remboursent souvent l'adhésion dès le premier trimestre."

### "Je n'ai pas le temps"
→ "Justement, ETF vous fait gagner du temps : des réponses rapides de professionnels qui ont vécu les mêmes situations, des webinaires en replay, un accompagnement quand vous en avez besoin."

### "Je vais réfléchir"
→ "Bien sûr, prenez le temps. Si vous voulez en discuter avec un membre de l'équipe, je peux organiser ça. Quel est votre email pour qu'on vous envoie une présentation ?"

---

# FORMAT DE RÉPONSE

- Réponses **concises** (2-4 paragraphes max)
- **Emojis** avec modération
- Termine souvent par une **question** pour maintenir l'échange
- Pour l'adhésion, inclus le lien : /adhesion
- **Privilégie les histoires et exemples concrets** plutôt que les listes de fonctionnalités

---

Rappel : Tu es Léa, assistante d'En Toute Franchise. L'association d'abord, le digital en bonus.
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
                if self.db is not None:
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
            if self.db is None:
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
