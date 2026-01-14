"""
Service de publication automatique sur les réseaux sociaux
Supporte: Facebook, Instagram, LinkedIn, X (Twitter)
"""

import os
import logging
import httpx
from typing import Optional, Dict, List
from datetime import datetime

logger = logging.getLogger(__name__)

# Configuration des APIs (à définir dans les variables d'environnement)
SOCIAL_CONFIG = {
    "facebook": {
        "page_id": os.getenv("FACEBOOK_PAGE_ID"),
        "access_token": os.getenv("FACEBOOK_ACCESS_TOKEN"),
        "api_url": "https://graph.facebook.com/v18.0"
    },
    "instagram": {
        "account_id": os.getenv("INSTAGRAM_ACCOUNT_ID"),
        "access_token": os.getenv("INSTAGRAM_ACCESS_TOKEN"),  # Même token que Facebook si lié
        "api_url": "https://graph.facebook.com/v18.0"
    },
    "linkedin": {
        "organization_id": os.getenv("LINKEDIN_ORGANIZATION_ID"),
        "access_token": os.getenv("LINKEDIN_ACCESS_TOKEN"),
        "api_url": "https://api.linkedin.com/v2"
    },
    "twitter": {
        "api_key": os.getenv("TWITTER_API_KEY"),
        "api_secret": os.getenv("TWITTER_API_SECRET"),
        "access_token": os.getenv("TWITTER_ACCESS_TOKEN"),
        "access_token_secret": os.getenv("TWITTER_ACCESS_TOKEN_SECRET"),
        "bearer_token": os.getenv("TWITTER_BEARER_TOKEN"),
        "api_url": "https://api.twitter.com/2"
    }
}


class SocialMediaService:
    """Service pour publier du contenu sur les réseaux sociaux"""
    
    def __init__(self):
        self.results = {}
    
    async def publish_article(
        self,
        title: str,
        excerpt: str,
        url: str,
        image_url: Optional[str] = None,
        platforms: List[str] = None
    ) -> Dict:
        """
        Publie un article sur les réseaux sociaux sélectionnés
        
        Args:
            title: Titre de l'article
            excerpt: Résumé/extrait de l'article
            url: URL de l'article sur le site
            image_url: URL de l'image principale (optionnel)
            platforms: Liste des plateformes ['facebook', 'instagram', 'linkedin', 'twitter']
        
        Returns:
            Dict avec le statut de publication pour chaque plateforme
        """
        if platforms is None:
            platforms = ["facebook", "linkedin", "twitter"]  # Instagram nécessite une image
        
        results = {}
        
        for platform in platforms:
            try:
                if platform == "facebook":
                    results["facebook"] = await self._publish_to_facebook(title, excerpt, url, image_url)
                elif platform == "instagram":
                    if image_url:
                        results["instagram"] = await self._publish_to_instagram(title, excerpt, url, image_url)
                    else:
                        results["instagram"] = {"success": False, "error": "Instagram nécessite une image"}
                elif platform == "linkedin":
                    results["linkedin"] = await self._publish_to_linkedin(title, excerpt, url, image_url)
                elif platform == "twitter":
                    results["twitter"] = await self._publish_to_twitter(title, excerpt, url)
            except Exception as e:
                logger.error(f"Erreur publication {platform}: {str(e)}")
                results[platform] = {"success": False, "error": str(e)}
        
        return results
    
    async def _publish_to_facebook(
        self,
        title: str,
        excerpt: str,
        url: str,
        image_url: Optional[str] = None
    ) -> Dict:
        """Publie sur une Page Facebook"""
        config = SOCIAL_CONFIG["facebook"]
        
        if not config["page_id"] or not config["access_token"]:
            return {"success": False, "error": "Facebook non configuré"}
        
        message = f"📰 {title}\n\n{excerpt}\n\n👉 Lire l'article : {url}"
        
        async with httpx.AsyncClient() as client:
            if image_url:
                # Publication avec image
                response = await client.post(
                    f"{config['api_url']}/{config['page_id']}/photos",
                    params={
                        "access_token": config["access_token"],
                        "url": image_url,
                        "caption": message
                    }
                )
            else:
                # Publication texte avec lien
                response = await client.post(
                    f"{config['api_url']}/{config['page_id']}/feed",
                    params={
                        "access_token": config["access_token"],
                        "message": message,
                        "link": url
                    }
                )
            
            if response.status_code == 200:
                data = response.json()
                return {"success": True, "post_id": data.get("id") or data.get("post_id")}
            else:
                return {"success": False, "error": response.text}
    
    async def _publish_to_instagram(
        self,
        title: str,
        excerpt: str,
        url: str,
        image_url: str
    ) -> Dict:
        """
        Publie sur Instagram (nécessite un compte Business/Creator lié à Facebook)
        Note: Instagram API ne supporte pas les liens cliquables dans les posts
        """
        config = SOCIAL_CONFIG["instagram"]
        
        if not config["account_id"] or not config["access_token"]:
            return {"success": False, "error": "Instagram non configuré"}
        
        # Le lien n'est pas cliquable sur Instagram, on le met quand même
        caption = f"📰 {title}\n\n{excerpt}\n\n🔗 Lien dans la bio\n\n#ETF #EnsembleContreLaTraite #Association #Actualités"
        
        async with httpx.AsyncClient() as client:
            # Étape 1: Créer le container média
            create_response = await client.post(
                f"{config['api_url']}/{config['account_id']}/media",
                params={
                    "access_token": config["access_token"],
                    "image_url": image_url,
                    "caption": caption
                }
            )
            
            if create_response.status_code != 200:
                return {"success": False, "error": f"Création média: {create_response.text}"}
            
            creation_id = create_response.json().get("id")
            
            # Étape 2: Publier le média
            publish_response = await client.post(
                f"{config['api_url']}/{config['account_id']}/media_publish",
                params={
                    "access_token": config["access_token"],
                    "creation_id": creation_id
                }
            )
            
            if publish_response.status_code == 200:
                return {"success": True, "post_id": publish_response.json().get("id")}
            else:
                return {"success": False, "error": publish_response.text}
    
    async def _publish_to_linkedin(
        self,
        title: str,
        excerpt: str,
        url: str,
        image_url: Optional[str] = None
    ) -> Dict:
        """Publie sur une Page LinkedIn"""
        config = SOCIAL_CONFIG["linkedin"]
        
        if not config["organization_id"] or not config["access_token"]:
            return {"success": False, "error": "LinkedIn non configuré"}
        
        headers = {
            "Authorization": f"Bearer {config['access_token']}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
            "LinkedIn-Version": "202401"
        }
        
        # Format du post LinkedIn
        post_data = {
            "author": f"urn:li:organization:{config['organization_id']}",
            "commentary": f"📰 {title}\n\n{excerpt}\n\n👉 Lire l'article complet",
            "visibility": "PUBLIC",
            "distribution": {
                "feedDistribution": "MAIN_FEED",
                "targetEntities": [],
                "thirdPartyDistributionChannels": []
            },
            "content": {
                "article": {
                    "source": url,
                    "title": title,
                    "description": excerpt[:200] if len(excerpt) > 200 else excerpt
                }
            },
            "lifecycleState": "PUBLISHED",
            "isReshareDisabledByAuthor": False
        }
        
        # Ajouter l'image si disponible
        if image_url:
            post_data["content"]["article"]["thumbnail"] = image_url
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.linkedin.com/rest/posts",
                headers=headers,
                json=post_data
            )
            
            if response.status_code in [200, 201]:
                post_id = response.headers.get("x-restli-id", "")
                return {"success": True, "post_id": post_id}
            else:
                return {"success": False, "error": response.text}
    
    async def _publish_to_twitter(
        self,
        title: str,
        excerpt: str,
        url: str
    ) -> Dict:
        """Publie sur X (Twitter)"""
        config = SOCIAL_CONFIG["twitter"]
        
        if not config["bearer_token"]:
            return {"success": False, "error": "Twitter non configuré"}
        
        # Twitter limite à 280 caractères
        # On construit un tweet concis
        tweet_base = f"📰 {title}\n\n"
        remaining = 280 - len(tweet_base) - len(url) - 5  # 5 pour "\n\n👉 "
        
        if len(excerpt) > remaining:
            excerpt = excerpt[:remaining-3] + "..."
        
        tweet = f"{tweet_base}{excerpt}\n\n👉 {url}"
        
        headers = {
            "Authorization": f"Bearer {config['bearer_token']}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{config['api_url']}/tweets",
                headers=headers,
                json={"text": tweet}
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                return {"success": True, "post_id": data.get("data", {}).get("id")}
            else:
                return {"success": False, "error": response.text}
    
    def is_configured(self, platform: str) -> bool:
        """Vérifie si une plateforme est configurée"""
        config = SOCIAL_CONFIG.get(platform, {})
        
        if platform == "facebook":
            return bool(config.get("page_id") and config.get("access_token"))
        elif platform == "instagram":
            return bool(config.get("account_id") and config.get("access_token"))
        elif platform == "linkedin":
            return bool(config.get("organization_id") and config.get("access_token"))
        elif platform == "twitter":
            return bool(config.get("bearer_token"))
        
        return False
    
    def get_configured_platforms(self) -> List[str]:
        """Retourne la liste des plateformes configurées"""
        platforms = []
        for platform in ["facebook", "instagram", "linkedin", "twitter"]:
            if self.is_configured(platform):
                platforms.append(platform)
        return platforms


# Instance globale
social_media_service = SocialMediaService()


async def publish_article_to_social_media(
    title: str,
    excerpt: str,
    article_slug: str,
    image_url: Optional[str] = None,
    platforms: List[str] = None,
    base_url: str = "https://www.yoursite.com"
) -> Dict:
    """
    Fonction helper pour publier un article
    
    Args:
        title: Titre de l'article
        excerpt: Résumé de l'article  
        article_slug: Slug de l'article pour construire l'URL
        image_url: URL de l'image (optionnel)
        platforms: Plateformes cibles (optionnel, toutes par défaut)
        base_url: URL de base du site
    
    Returns:
        Résultats de publication par plateforme
    """
    article_url = f"{base_url}/blog/{article_slug}"
    
    return await social_media_service.publish_article(
        title=title,
        excerpt=excerpt,
        url=article_url,
        image_url=image_url,
        platforms=platforms
    )
