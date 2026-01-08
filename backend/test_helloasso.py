"""
Script de test pour vérifier la connexion et l'intégration HelloAsso
"""

import asyncio
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta

# Ajouter le répertoire parent au path
ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))

from dotenv import load_dotenv
load_dotenv(ROOT_DIR / '.env')

from helloasso_service import helloasso_service

# Couleurs pour la console
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_success(msg):
    print(f"{GREEN}✓ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}✗ {msg}{RESET}")

def print_info(msg):
    print(f"{BLUE}ℹ {msg}{RESET}")

def print_warning(msg):
    print(f"{YELLOW}⚠ {msg}{RESET}")


async def test_connection():
    """Test 1: Vérifier la connexion de base"""
    print("\n" + "="*60)
    print("TEST 1: Vérification de la connexion HelloAsso")
    print("="*60)
    
    status = await helloasso_service.check_connection()
    
    if status.get("connected"):
        print_success("Connexion réussie à HelloAsso!")
        print_info(f"  Organisation: {status.get('organization')}")
        if status.get('token_expires_at'):
            print_info(f"  Token expire: {status.get('token_expires_at')}")
    else:
        print_error("Échec de connexion à HelloAsso")
        print_error(f"  Erreur: {status.get('error', 'Inconnue')}")
        return False
    
    return True


async def test_get_forms():
    """Test 2: Récupérer les formulaires"""
    print("\n" + "="*60)
    print("TEST 2: Récupération des formulaires d'adhésion")
    print("="*60)
    
    forms = await helloasso_service.get_membership_forms()
    
    if forms:
        print_success(f"Trouvé {len(forms)} formulaire(s) d'adhésion")
        for i, form in enumerate(forms, 1):
            print(f"\n{i}. {form.get('title', 'Sans titre')}")
            print(f"   - Type: {form.get('formType')}")
            print(f"   - Slug: {form.get('formSlug')}")
            print(f"   - État: {form.get('state')}")
            print(f"   - URL: {form.get('url')}")
            
            # Stats si disponibles
            if 'statistics' in form:
                stats = form['statistics']
                print(f"   - Total collecté: {stats.get('totalAmount', 0)/100:.2f}€")
                print(f"   - Nb adhérents: {stats.get('totalParticipants', 0)}")
    else:
        print_warning("Aucun formulaire d'adhésion trouvé")
    
    return len(forms) > 0


async def test_get_recent_members():
    """Test 3: Récupérer les adhérents récents"""
    print("\n" + "="*60)
    print("TEST 3: Récupération des adhérents récents (30 derniers jours)")
    print("="*60)
    
    # Récupérer les adhérents des 30 derniers jours
    from_date = datetime.utcnow() - timedelta(days=30)
    
    members = await helloasso_service.get_all_members(from_date=from_date)
    
    if members:
        print_success(f"Trouvé {len(members)} adhérent(s) récent(s)")
        
        # Afficher les 5 premiers
        for i, member in enumerate(members[:5], 1):
            print(f"\n{i}. {member.get('firstName')} {member.get('lastName')}")
            print(f"   - Email: {member.get('email')}")
            print(f"   - Montant: {member.get('amount', 0)/100:.2f}€")
            print(f"   - Date: {member.get('paymentDate')}")
            print(f"   - Formulaire: {member.get('formSlug')}")
            
        if len(members) > 5:
            print(f"\n... et {len(members) - 5} autre(s)")
    else:
        print_warning("Aucun adhérent trouvé sur les 30 derniers jours")
        print_info("Cela peut être normal si aucune adhésion récente")
    
    return True


async def test_get_all_forms():
    """Test 4: Récupérer tous les types de formulaires"""
    print("\n" + "="*60)
    print("TEST 4: Récupération de tous les formulaires (tous types)")
    print("="*60)
    
    forms = await helloasso_service.get_organization_forms()
    
    if forms:
        print_success(f"Trouvé {len(forms)} formulaire(s) au total")
        
        # Compter par type
        types = {}
        for form in forms:
            form_type = form.get('formType', 'Inconnu')
            types[form_type] = types.get(form_type, 0) + 1
        
        print("\nRépartition par type:")
        for form_type, count in types.items():
            print(f"  - {form_type}: {count}")
    else:
        print_warning("Aucun formulaire trouvé")
    
    return len(forms) > 0


async def test_organization_info():
    """Test 5: Informations sur l'organisation"""
    print("\n" + "="*60)
    print("TEST 5: Informations sur l'organisation")
    print("="*60)
    
    org_info = await helloasso_service.get_organization_info()
    
    if org_info:
        print_success("Informations de l'organisation récupérées")
        print(f"\n  Nom: {org_info.get('name', 'N/A')}")
        print(f"  Slug: {org_info.get('organizationSlug', 'N/A')}")
        print(f"  Type: {org_info.get('type', 'N/A')}")
        print(f"  Ville: {org_info.get('city', 'N/A')}")
        print(f"  URL: {org_info.get('url', 'N/A')}")
        
        if 'description' in org_info:
            desc = org_info['description'][:100] + "..." if len(org_info.get('description', '')) > 100 else org_info.get('description', '')
            print(f"  Description: {desc}")
    else:
        print_warning("Impossible de récupérer les infos de l'organisation")
    
    return org_info is not None


async def main():
    """Exécute tous les tests"""
    print("\n" + "="*60)
    print("🔍 TEST DE CONNEXION HELLOASSO")
    print("="*60)
    
    # Configuration (masquée pour sécurité)
    client_id = os.getenv('HELLOASSO_CLIENT_ID', 'NON DÉFINI')
    print("\nConfiguration:")
    print(f"  Client ID: {'*' * 8}...{client_id[-4:] if len(client_id) > 4 else '****'}")
    print(f"  Client Secret: {'*' * 20}")
    print(f"  Organisation: {os.getenv('HELLOASSO_ORGANIZATION_SLUG', 'NON DÉFINI')}")
    
    # Exécuter les tests
    results = []
    
    results.append(("Connexion de base", await test_connection()))
    results.append(("Récupération formulaires d'adhésion", await test_get_forms()))
    results.append(("Récupération adhérents récents", await test_get_recent_members()))
    results.append(("Récupération tous formulaires", await test_get_all_forms()))
    results.append(("Informations organisation", await test_organization_info()))
    
    # Résumé
    print("\n" + "="*60)
    print("RÉSUMÉ DES TESTS")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        if result:
            print_success(f"{test_name}")
        else:
            print_error(f"{test_name}")
    
    print(f"\n{passed}/{total} tests réussis")
    
    if passed == total:
        print_success("\n✨ Tous les tests sont passés! HelloAsso est correctement configuré.")
    else:
        print_warning(f"\n⚠ {total - passed} test(s) ont échoué. Vérifiez la configuration.")
    
    print("\n" + "="*60)


if __name__ == "__main__":
    asyncio.run(main())
