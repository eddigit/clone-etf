"""
Script de test pour vérifier la configuration des réseaux sociaux
Usage: python test_social_media.py
"""

import asyncio
import os
import sys
from pathlib import Path

# Charger les variables d'environnement
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / '.env')

# Couleurs pour le terminal
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text:^60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")

def print_info(text):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.RESET}")


async def test_facebook():
    """Test de la connexion Facebook"""
    import httpx
    
    print_header("Test Facebook")
    
    page_id = os.getenv("FACEBOOK_PAGE_ID")
    access_token = os.getenv("FACEBOOK_ACCESS_TOKEN")
    
    if not page_id:
        print_error("FACEBOOK_PAGE_ID non défini dans .env")
        return False
    
    if not access_token:
        print_error("FACEBOOK_ACCESS_TOKEN non défini dans .env")
        return False
    
    print_info(f"Page ID: {page_id}")
    print_info(f"Token: {access_token[:20]}...")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Test 1: Récupérer les infos de la page
            response = await client.get(
                f"https://graph.facebook.com/v18.0/{page_id}",
                params={
                    "access_token": access_token,
                    "fields": "name,id,fan_count,category"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Page trouvée: {data.get('name')}")
                print_info(f"  - ID: {data.get('id')}")
                print_info(f"  - Catégorie: {data.get('category')}")
                print_info(f"  - Fans: {data.get('fan_count', 'N/A')}")
                
                # Test 2: Vérifier les permissions
                perms_response = await client.get(
                    f"https://graph.facebook.com/v18.0/{page_id}/permissions",
                    params={"access_token": access_token}
                )
                
                if perms_response.status_code == 200:
                    print_success("Permissions du token validées")
                
                return True
            else:
                error = response.json().get("error", {})
                print_error(f"Erreur: {error.get('message')}")
                print_info(f"Code: {error.get('code')}, Type: {error.get('type')}")
                return False
                
    except Exception as e:
        print_error(f"Erreur de connexion: {str(e)}")
        return False


async def test_linkedin():
    """Test de la connexion LinkedIn"""
    import httpx
    
    print_header("Test LinkedIn")
    
    org_id = os.getenv("LINKEDIN_ORGANIZATION_ID")
    access_token = os.getenv("LINKEDIN_ACCESS_TOKEN")
    
    if not org_id:
        print_error("LINKEDIN_ORGANIZATION_ID non défini dans .env")
        return False
    
    if not access_token:
        print_error("LINKEDIN_ACCESS_TOKEN non défini dans .env")
        return False
    
    print_info(f"Organization ID: {org_id}")
    print_info(f"Token: {access_token[:20]}...")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Test: Récupérer les infos de l'organisation
            response = await client.get(
                f"https://api.linkedin.com/v2/organizations/{org_id}",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "X-Restli-Protocol-Version": "2.0.0"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Organisation trouvée: {data.get('localizedName')}")
                print_info(f"  - ID: {org_id}")
                print_info(f"  - Description: {data.get('localizedDescription', 'N/A')[:100]}...")
                return True
            elif response.status_code == 401:
                print_error("Token expiré ou invalide")
                print_warning("Les tokens LinkedIn expirent après 60 jours")
                print_info("Voir SOCIAL_MEDIA_INTEGRATION.md pour regénérer le token")
                return False
            else:
                print_error(f"Erreur {response.status_code}: {response.text[:200]}")
                return False
                
    except Exception as e:
        print_error(f"Erreur de connexion: {str(e)}")
        return False


async def test_twitter():
    """Test de la connexion Twitter/X"""
    import httpx
    
    print_header("Test X (Twitter)")
    
    bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
    api_key = os.getenv("TWITTER_API_KEY")
    
    if not bearer_token:
        print_error("TWITTER_BEARER_TOKEN non défini dans .env")
        return False
    
    print_info(f"Bearer Token: {bearer_token[:20]}...")
    if api_key:
        print_info(f"API Key: {api_key[:10]}...")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Test: Récupérer les infos du compte
            response = await client.get(
                "https://api.twitter.com/2/users/me",
                headers={"Authorization": f"Bearer {bearer_token}"}
            )
            
            if response.status_code == 200:
                data = response.json().get("data", {})
                print_success(f"Compte trouvé: @{data.get('username')}")
                print_info(f"  - Nom: {data.get('name')}")
                print_info(f"  - ID: {data.get('id')}")
                return True
            elif response.status_code == 401:
                print_error("Token invalide")
                return False
            elif response.status_code == 403:
                print_error("Accès refusé - vérifiez les permissions de l'app")
                return False
            else:
                print_error(f"Erreur {response.status_code}: {response.text[:200]}")
                return False
                
    except Exception as e:
        print_error(f"Erreur de connexion: {str(e)}")
        return False


async def test_instagram():
    """Test de la connexion Instagram"""
    import httpx
    
    print_header("Test Instagram")
    
    account_id = os.getenv("INSTAGRAM_ACCOUNT_ID")
    access_token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
    
    if not account_id:
        print_warning("INSTAGRAM_ACCOUNT_ID non défini (optionnel)")
        return None
    
    if not access_token:
        print_warning("INSTAGRAM_ACCESS_TOKEN non défini (optionnel)")
        return None
    
    print_info(f"Account ID: {account_id}")
    print_info(f"Token: {access_token[:20]}...")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://graph.facebook.com/v18.0/{account_id}",
                params={
                    "access_token": access_token,
                    "fields": "username,name,profile_picture_url"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Compte trouvé: @{data.get('username')}")
                return True
            else:
                print_error(f"Erreur: {response.text[:200]}")
                return False
                
    except Exception as e:
        print_error(f"Erreur de connexion: {str(e)}")
        return False


async def main():
    """Exécute tous les tests"""
    print(f"\n{Colors.BOLD}📱 Test de Configuration des Réseaux Sociaux{Colors.RESET}")
    print(f"{Colors.BOLD}   En Toute Franchise - MVP{Colors.RESET}\n")
    
    results = {}
    
    # Test Facebook
    results["facebook"] = await test_facebook()
    
    # Test LinkedIn
    results["linkedin"] = await test_linkedin()
    
    # Test Twitter
    results["twitter"] = await test_twitter()
    
    # Test Instagram
    results["instagram"] = await test_instagram()
    
    # Résumé
    print_header("Résumé")
    
    configured_count = 0
    for platform, success in results.items():
        if success is True:
            print_success(f"{platform.capitalize()}: Configuré et fonctionnel")
            configured_count += 1
        elif success is False:
            print_error(f"{platform.capitalize()}: Non fonctionnel")
        else:
            print_warning(f"{platform.capitalize()}: Non configuré (optionnel)")
    
    print(f"\n{Colors.BOLD}Plateformes configurées: {configured_count}/4{Colors.RESET}")
    
    if configured_count == 0:
        print_warning("\nAucune plateforme configurée.")
        print_info("Consultez SOCIAL_MEDIA_INTEGRATION.md pour les instructions")
    elif configured_count < 3:
        print_warning("\nConfiguration partielle.")
        print_info("Les plateformes non configurées ne seront pas disponibles dans l'admin")
    else:
        print_success("\nConfiguration complète ! 🎉")
    
    return configured_count > 0


if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrompu.")
        sys.exit(1)
