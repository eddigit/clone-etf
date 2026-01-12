"""
Service de stockage d'images avec Cloudinary
Pour les images des articles du blog
"""
import cloudinary
import cloudinary.uploader
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Configuration Cloudinary depuis les variables d'environnement
CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME')
CLOUDINARY_API_KEY = os.environ.get('CLOUDINARY_API_KEY')
CLOUDINARY_API_SECRET = os.environ.get('CLOUDINARY_API_SECRET')

# Flag pour vérifier si Cloudinary est configuré
CLOUDINARY_ENABLED = all([CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET])

if CLOUDINARY_ENABLED:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True
    )
    logger.info("Cloudinary configuré avec succès")
else:
    logger.warning("Cloudinary non configuré - les uploads locaux seront utilisés (non persistants sur Render)")


async def upload_image_to_cloudinary(file_content: bytes, filename: str, folder: str = "etf-articles") -> Optional[str]:
    """
    Upload une image vers Cloudinary
    
    Args:
        file_content: Le contenu du fichier en bytes
        filename: Le nom du fichier original
        folder: Le dossier Cloudinary (default: etf-articles)
    
    Returns:
        L'URL sécurisée de l'image ou None si échec
    """
    if not CLOUDINARY_ENABLED:
        logger.warning("Cloudinary non configuré, impossible d'uploader")
        return None
    
    try:
        # Extraire le nom sans extension pour le public_id
        name_without_ext = os.path.splitext(filename)[0]
        
        # Upload vers Cloudinary
        result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            public_id=f"{name_without_ext}_{os.urandom(4).hex()}",
            resource_type="image",
            transformation=[
                {"quality": "auto:good"},
                {"fetch_format": "auto"}
            ]
        )
        
        logger.info(f"Image uploadée vers Cloudinary: {result['secure_url']}")
        return result['secure_url']
        
    except Exception as e:
        logger.error(f"Erreur upload Cloudinary: {str(e)}")
        return None


async def delete_image_from_cloudinary(image_url: str) -> bool:
    """
    Supprime une image de Cloudinary
    
    Args:
        image_url: L'URL de l'image à supprimer
    
    Returns:
        True si suppression réussie, False sinon
    """
    if not CLOUDINARY_ENABLED:
        return False
    
    try:
        # Extraire le public_id de l'URL
        # Format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{folder}/{public_id}.{ext}
        if 'cloudinary.com' in image_url:
            parts = image_url.split('/')
            # Récupérer folder/public_id
            public_id_with_ext = '/'.join(parts[-2:])
            public_id = os.path.splitext(public_id_with_ext)[0]
            
            result = cloudinary.uploader.destroy(public_id)
            return result.get('result') == 'ok'
        return False
        
    except Exception as e:
        logger.error(f"Erreur suppression Cloudinary: {str(e)}")
        return False


def is_cloudinary_enabled() -> bool:
    """Vérifie si Cloudinary est configuré"""
    return CLOUDINARY_ENABLED
