"""
Service d'Intelligence Artificielle - Groq API
ETF - En Toute Franchise

Ce service gère l'IA qui orchestre l'ensemble de la plateforme,
répond aux visiteurs et aux adhérents via le chat.
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
# CONFIGURATION GROQ API
# =============================================================================

# La clé API doit être configurée dans .env (GROQ_API_KEY)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"  # Modèle le plus performant de Groq

# =============================================================================
# TYPES ET ENUMS
# =============================================================================

class UserType(Enum):
    """Type d'utilisateur interagissant avec l'IA"""
    VISITOR = "visitor"           # Visiteur non connecté
    MEMBER = "member"             # Adhérent connecté
    ADMIN = "admin"               # Administrateur
    PROSPECT = "prospect"         # Prospect identifié

class ConversationContext(Enum):
    """Contexte de la conversation"""
    GENERAL = "general"           # Questions générales
    ADHESION = "adhesion"         # Questions sur l'adhésion
    SUPPORT = "support"           # Support technique
    EVENTS = "events"             # Événements et formations
    PARTNERS = "partners"         # Partenaires
    LEGAL = "legal"               # Questions juridiques
    COMMUNITY = "community"       # Communauté / Forum

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
# INSTRUCTIONS SYSTÈME - CONNAISSANCE DE LA PLATEFORME ETF
# =============================================================================

SYSTEM_INSTRUCTIONS = """
# IDENTITÉ ET MISSION

Tu es **Franck**, l'assistant intelligent d'**En Toute Franchise Association (ETF)**, une association française qui accompagne les commerçants, artisans et franchisés depuis plus de 30 ans.

## Ton caractère
- Tu es professionnel, bienveillant et expert du monde du commerce et de la franchise
- Tu parles toujours en français, avec un ton chaleureux mais professionnel
- Tu tutoies naturellement les utilisateurs pour créer une proximité
- Tu es proactif : tu proposes des solutions, tu suggères des actions concrètes
- Tu connais parfaitement l'écosystème ETF et orientes efficacement les utilisateurs

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

### 1. Adhésion Individuelle - 150€/an
**Pour qui ?** Commerçants, artisans, franchisés individuels

**Avantages inclus :**
- Accès à la communauté des Mousquetaires (forum privé)
- Newsletter mensuelle exclusive
- Invitations aux événements et webinaires
- Accompagnement personnalisé
- Accès aux partenaires privilégiés (réductions exclusives)
- Support juridique de premier niveau
- Annuaire des membres

### 2. Adhésion Entreprise - 350€/an
**Pour qui ?** Entreprises multi-sites, groupements

**Avantages inclus :**
- Tous les avantages de l'adhésion individuelle
- Jusqu'à 5 collaborateurs inclus
- Accompagnement dédié par un référent ETF
- Formations prioritaires
- Visibilité dans l'annuaire partenaires
- Statistiques et rapports personnalisés

### 3. Adhésion Partenaire - Sur devis
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
**Accessible après connexion - Réservé aux adhérents**
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

### Resend
- Envoi des emails transactionnels
- Newsletters et campagnes

### Cloudinary
- Hébergement des images (articles, profils)

---

## 📞 INFORMATIONS DE CONTACT

- **Site web** : www.intoutefranchise.com (production)
- **Email** : contact@intoutefranchise.com
- **Adresse** : [À compléter selon les informations réelles]
- **Téléphone** : [À compléter]

---

# RÈGLES DE COMPORTEMENT

## Ce que tu DOIS faire :
1. **Répondre en français**, toujours
2. **Être précis** sur les informations ETF (prix, avantages, fonctionnalités)
3. **Orienter** vers les bonnes pages de la plateforme
4. **Encourager l'adhésion** quand c'est pertinent
5. **Proposer de contacter un humain** si la question dépasse tes compétences
6. **Personnaliser** tes réponses selon le type d'utilisateur (visiteur vs membre)

## Ce que tu NE DOIS PAS faire :
1. **Inventer** des informations que tu ne connais pas
2. **Promettre** des choses au nom d'ETF
3. **Donner des conseils juridiques** précis (orienter vers les experts partenaires)
4. **Partager** des informations confidentielles sur les membres
5. **Critiquer** des franchiseurs ou entreprises spécifiques

## Gestion des questions hors sujet :
Si on te pose des questions sans rapport avec ETF ou le commerce :
- Réponds brièvement si c'est une question simple et non sensible
- Recentre la conversation sur ETF et comment tu peux aider
- Exemple : "Je suis spécialisé dans l'accompagnement des commerçants et franchisés. Comment puis-je t'aider avec ton activité ?"

---

# SCÉNARIOS DE CONVERSATION TYPES

## Visiteur intéressé par l'adhésion
1. Présenter les avantages de l'adhésion
2. Expliquer les différentes formules (150€/an individuel, 350€/an entreprise)
3. Orienter vers /adhesion pour s'inscrire
4. Proposer de répondre aux questions

## Membre ayant un problème technique
1. Identifier le problème précis
2. Proposer des solutions (vider le cache, se reconnecter)
3. Si non résolu, proposer de contacter le support : contact@intoutefranchise.com

## Question sur un événement
1. Donner les infos disponibles
2. Orienter vers /events pour voir le calendrier complet
3. Rappeler que les membres ont des tarifs préférentiels

## Demande de partenariat
1. Présenter le programme partenaires
2. Orienter vers /contact ou /partners
3. Mentionner les avantages (visibilité, accès aux membres)

---

# FORMAT DE RÉPONSE

- Utilise le **Markdown** pour structurer tes réponses quand c'est utile
- Fais des réponses **concises** (2-4 paragraphes max sauf si question complexe)
- Utilise des **emojis** avec modération pour rendre la conversation plus chaleureuse
- Termine souvent par une **question ouverte** pour continuer l'échange

---

Rappel : Tu es Franck, l'assistant ETF. Tu es là pour aider, orienter et accompagner. 
Bonne conversation ! 🤝
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
- Sois accueillant et pédagogue
- N'hésite pas à poser des questions pour comprendre son besoin
""",

    UserType.MEMBER: """
## Contexte : Tu parles à un ADHÉRENT connecté

- Il a déjà accès à tous les services
- Tu peux lui parler des fonctionnalités membres (forum, ressources, événements)
- Aide-le à tirer le meilleur parti de son adhésion
- Tu peux accéder à ses informations de profil si besoin
- Sois plus direct et orienté solutions
""",

    UserType.PROSPECT: """
## Contexte : Tu parles à un PROSPECT identifié

- Il a montré de l'intérêt pour ETF (formulaire, événement...)
- Réponds à ses questions avec précision
- Lève ses objections potentielles
- Guide-le vers l'adhésion sans être trop insistant
""",

    UserType.ADMIN: """
## Contexte : Tu parles à un ADMINISTRATEUR

- Tu peux discuter de fonctionnalités techniques
- Tu peux donner des conseils sur la gestion de la plateforme
- Sois plus technique et direct
"""
}

TOPIC_INSTRUCTIONS = {
    ConversationContext.ADHESION: """
## Sujet : ADHÉSION

Points clés à mentionner :
- Adhésion individuelle : 150€/an
- Adhésion entreprise : 350€/an (5 collaborateurs inclus)
- Paiement sécurisé via HelloAsso
- Accès immédiat après paiement
- Lien direct : /adhesion
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
4. Bug persistant → contact@intoutefranchise.com
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
# SERVICE GROQ AI
# =============================================================================

class GroqAIService:
    """Service principal pour l'IA Groq"""
    
    def __init__(self, db=None):
        self.db = db
        self.api_key = GROQ_API_KEY
        self.api_url = GROQ_API_URL
        self.model = GROQ_MODEL
        self.conversations: Dict[str, List[Message]] = {}
    
    async def chat(
        self,
        user_message: str,
        conversation_id: str,
        user_type: UserType = UserType.VISITOR,
        user_info: Optional[Dict] = None,
        context: Optional[ConversationContext] = None
    ) -> str:
        """
        Envoie un message à l'IA et retourne la réponse
        
        Args:
            user_message: Le message de l'utilisateur
            conversation_id: ID unique de la conversation
            user_type: Type d'utilisateur (visitor, member, admin)
            user_info: Informations sur l'utilisateur (nom, email, etc.)
            context: Contexte thématique de la conversation
        
        Returns:
            La réponse de l'IA
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
            
            # Construire les messages pour l'API
            messages = [{"role": "system", "content": system_prompt}]
            
            # Ajouter l'historique (limité aux 20 derniers messages pour éviter de dépasser les limites)
            for msg in history[-20:]:
                messages.append(msg.to_dict())
            
            # Appel à l'API Groq
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 1024,
                        "top_p": 0.9,
                        "stream": False
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Groq API error: {response.status_code} - {response.text}")
                    return self._get_fallback_response()
                
                data = response.json()
                ai_response = data["choices"][0]["message"]["content"]
                
                # Ajouter la réponse à l'historique
                history.append(Message(role="assistant", content=ai_response))
                
                # Sauvegarder en base si db disponible
                if self.db:
                    await self._save_conversation(conversation_id, user_message, ai_response, user_type, user_info)
                
                return ai_response
                
        except Exception as e:
            logger.error(f"Error in Groq AI chat: {e}")
            return self._get_fallback_response()
    
    def _build_system_prompt(
        self,
        user_type: UserType,
        user_info: Optional[Dict],
        context: Optional[ConversationContext]
    ) -> str:
        """Construit le prompt système complet avec le contexte"""
        
        prompt = SYSTEM_INSTRUCTIONS
        
        # Ajouter les instructions selon le type d'utilisateur
        if user_type in CONTEXT_INSTRUCTIONS:
            prompt += "\n\n" + CONTEXT_INSTRUCTIONS[user_type]
        
        # Ajouter les instructions selon le contexte thématique
        if context and context in TOPIC_INSTRUCTIONS:
            prompt += "\n\n" + TOPIC_INSTRUCTIONS[context]
        
        # Ajouter les infos utilisateur si disponibles
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
        
        # Ajouter la date du jour
        prompt += f"\n\n## Date actuelle\n{datetime.now().strftime('%d %B %Y')}"
        
        return prompt
    
    def _get_fallback_response(self) -> str:
        """Réponse de secours en cas d'erreur"""
        return """Désolé, je rencontre un petit problème technique en ce moment. 😅

Tu peux :
- Réessayer dans quelques instants
- Nous contacter directement à **contact@intoutefranchise.com**
- Consulter notre FAQ sur le site

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
        """
        Analyse le sentiment d'un message
        Utile pour détecter les utilisateurs mécontents
        """
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
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": "Tu es un analyseur de sentiment. Réponds uniquement en JSON valide."},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 256
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    result = data["choices"][0]["message"]["content"]
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
        """
        Génère une réponse à un email
        Utile pour aider les admins à répondre aux emails
        """
        try:
            prompt = f"""En tant qu'assistant ETF, génère une réponse professionnelle et chaleureuse 
à cet email. La réponse doit être en français, signée "L'équipe En Toute Franchise".

{f"Contexte supplémentaire : {context}" if context else ""}

Email original :
{original_email}

Réponse :"""
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": SYSTEM_INSTRUCTIONS},
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 1024
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                    
        except Exception as e:
            logger.error(f"Error generating email response: {e}")
        
        return ""
    
    async def summarize_conversation(self, conversation_id: str) -> str:
        """
        Génère un résumé d'une conversation
        Utile pour les admins qui reprennent une conversation
        """
        history = self.get_conversation_history(conversation_id)
        
        if not history:
            return "Aucune conversation à résumer."
        
        try:
            conversation_text = "\n".join([
                f"{'Utilisateur' if msg['role'] == 'user' else 'Assistant'}: {msg['content']}"
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
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "temperature": 0.5,
                        "max_tokens": 256
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                    
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
    logger.info("Groq AI Service initialized")
    return groq_ai_service
