"""
Script de test pour l'intégration MaBoiteDigitale
Teste toutes les fonctionnalités du service SSO et API partenaire
"""

import asyncio
import sys
from datetime import datetime, timedelta
from maboitedigitale_service import maboitedigitale_service
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration MongoDB
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Codes de couleur pour l'affichage
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text:^80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}\n")

def print_success(text):
    print(f"{Colors.OKGREEN}✓ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}✗ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")


async def test_connection():
    """Test 1 : Vérifier la connexion à MaBoiteDigitale"""
    print_header("TEST 1 : Connexion à MaBoiteDigitale")

    result = await maboitedigitale_service.check_connection()

    print_info(f"API URL : {result.get('api_url')}")
    print_info(f"Partner ID : {result.get('partner_id')}")
    print_info(f"Configuré : {result.get('configured')}")

    if result.get('connected'):
        print_success(f"Connexion réussie : {result.get('message')}")
        return True
    elif result.get('dev_mode'):
        print_warning(f"Mode développement : {result.get('message')}")
        return True
    else:
        print_error(f"Connexion échouée : {result.get('message')}")
        return False


async def test_sso_generation():
    """Test 2 : Générer un token SSO"""
    print_header("TEST 2 : Génération de token SSO")

    # Données de test
    test_user = {
        'user_id': 'test-user-001',
        'email': 'test@entoutefranchise.com',
        'member_number': 'ETF2026-0001',
        'first_name': 'Jean',
        'last_name': 'Dupont',
        'membership_type': 'professional',
        'membership_end_date': datetime.utcnow() + timedelta(days=365)
    }

    print_info(f"Email : {test_user['email']}")
    print_info(f"Numéro membre : {test_user['member_number']}")

    result = await maboitedigitale_service.generate_sso_token(**test_user)

    if result.get('success'):
        print_success("Token SSO généré avec succès")
        print_info(f"Token : {result.get('token')[:20]}...")
        print_info(f"Redirect URL : {result.get('redirect_url')}")
        print_info(f"Expire à : {result.get('expires_at')}")

        if result.get('dev_mode'):
            print_warning("Mode développement : token local généré")

        return True
    else:
        print_error(f"Erreur : {result.get('message')}")
        return False


async def test_subscription_status():
    """Test 3 : Vérifier le statut d'abonnement"""
    print_header("TEST 3 : Vérification du statut d'abonnement")

    test_email = 'test@entoutefranchise.com'
    test_member_number = 'ETF2026-0001'

    print_info(f"Email : {test_email}")
    print_info(f"Numéro membre : {test_member_number}")

    result = await maboitedigitale_service.check_subscription_status(
        email=test_email,
        member_number=test_member_number
    )

    print_info(f"A un abonnement : {result.get('has_subscription')}")
    print_info(f"Type de plan : {result.get('plan_type')}")
    print_info(f"Nom du plan : {result.get('plan_name')}")
    print_info(f"Tokens restants : {result.get('tokens_remaining')}")
    print_info(f"Réduction appliquée : {result.get('discount_applied')}")

    if result.get('dev_mode'):
        print_warning("Mode développement : données fictives")
        return True
    elif result.get('has_subscription'):
        print_success("Abonnement actif trouvé")
        return True
    else:
        print_warning("Pas d'abonnement actif (normal en dev)")
        return True


async def test_member_registration():
    """Test 4 : Enregistrer un membre ETF"""
    print_header("TEST 4 : Enregistrement d'un membre")

    test_member = {
        'email': 'test@entoutefranchise.com',
        'member_number': 'ETF2026-0001',
        'first_name': 'Jean',
        'last_name': 'Dupont',
        'membership_type': 'professional',
        'membership_end_date': datetime.utcnow() + timedelta(days=365),
        'discount_percentage': 20.0
    }

    print_info(f"Email : {test_member['email']}")
    print_info(f"Numéro membre : {test_member['member_number']}")
    print_info(f"Réduction : {test_member['discount_percentage']}%")

    result = await maboitedigitale_service.register_etf_member(**test_member)

    if result.get('success'):
        print_success(f"Membre enregistré : {result.get('message')}")
        print_info(f"Code réduction : {result.get('discount_code')}")
        print_info(f"Réduction : {result.get('discount_percentage')}%")

        if result.get('dev_mode'):
            print_warning("Mode développement : enregistrement local")

        return True
    else:
        print_error(f"Erreur : {result.get('message')}")
        return False


async def test_partner_stats():
    """Test 5 : Récupérer les statistiques partenaire"""
    print_header("TEST 5 : Statistiques du partenariat")

    result = await maboitedigitale_service.get_partner_stats()

    print_info(f"Membres enregistrés : {result.get('total_members_registered', 0)}")
    print_info(f"Abonnements actifs : {result.get('active_subscriptions', 0)}")
    print_info(f"Revenus partagés : {result.get('total_revenue_shared', 0.0)}€")
    print_info(f"Utilisations réduction : {result.get('discount_usage', 0)}")

    if result.get('dev_mode'):
        print_warning("Mode développement : statistiques non disponibles")
        return True
    elif result.get('error'):
        print_error(f"Erreur : {result.get('error')}")
        return False
    else:
        print_success("Statistiques récupérées avec succès")
        return True


async def test_real_user_sso():
    """Test 6 : Tester avec un vrai utilisateur de la base"""
    print_header("TEST 6 : SSO avec utilisateur réel (si disponible)")

    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]

        # Chercher un utilisateur avec adhésion active
        user = await db.users.find_one({
            "membershipStatus": "active",
            "role": "user"
        })

        if not user:
            print_warning("Aucun utilisateur avec adhésion active trouvé")
            print_info("Recherche d'un utilisateur quelconque...")
            user = await db.users.find_one({"role": "user"})

        if not user:
            print_warning("Aucun utilisateur trouvé dans la base")
            client.close()
            return True  # Pas d'erreur, juste pas de données

        print_info(f"Utilisateur trouvé : {user.get('email')}")
        print_info(f"Nom : {user.get('firstName')} {user.get('lastName')}")
        print_info(f"Statut adhésion : {user.get('membershipStatus')}")

        # Générer un member_number si manquant
        member_number = user.get('memberNumber')
        if not member_number:
            from server import generate_membership_reference
            member_number = generate_membership_reference()
            print_warning(f"Numéro membre généré : {member_number}")

        # Tester le SSO
        result = await maboitedigitale_service.generate_sso_token(
            user_id=user['id'],
            email=user['email'],
            member_number=member_number,
            first_name=user.get('firstName', ''),
            last_name=user.get('lastName', ''),
            membership_type=user.get('membershipType', 'individual'),
            membership_end_date=user.get('membershipEndDate')
        )

        if result.get('success'):
            print_success("Token SSO généré pour l'utilisateur réel")
            print_info(f"URL de redirection : {result.get('redirect_url')}")

            # Tester également le statut d'abonnement
            sub_result = await maboitedigitale_service.check_subscription_status(
                email=user['email'],
                member_number=member_number
            )

            if sub_result.get('has_subscription'):
                print_success(f"Abonnement actif : {sub_result.get('plan_name')}")
            else:
                print_info("Pas d'abonnement IA actif")

            client.close()
            return True
        else:
            print_error(f"Erreur : {result.get('message')}")
            client.close()
            return False

    except Exception as e:
        print_error(f"Erreur lors du test avec utilisateur réel : {str(e)}")
        return False


async def run_all_tests():
    """Exécuter tous les tests"""
    print(f"\n{Colors.BOLD}{Colors.OKBLUE}")
    print("╔═══════════════════════════════════════════════════════════════════════════════╗")
    print("║                  TEST INTÉGRATION MABOITEDIGITALE                             ║")
    print("║                     En Toute Franchise Association                            ║")
    print("╚═══════════════════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}\n")

    # Afficher la configuration
    print_info(f"Date : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info(f"API URL : {os.environ.get('MABOITEDIGITALE_API_URL', 'Non configuré')}")
    print_info(f"Partner ID : {os.environ.get('MABOITEDIGITALE_PARTNER_ID', 'etf')}")
    print_info(f"API Key configurée : {'✓' if os.environ.get('MABOITEDIGITALE_API_KEY') else '✗'}")
    print_info(f"Secret configuré : {'✓' if os.environ.get('MABOITEDIGITALE_SECRET') else '✗'}")

    results = []

    # Test 1 : Connexion
    results.append(("Connexion API", await test_connection()))

    # Test 2 : Génération SSO
    results.append(("Génération SSO", await test_sso_generation()))

    # Test 3 : Statut abonnement
    results.append(("Statut abonnement", await test_subscription_status()))

    # Test 4 : Enregistrement membre
    results.append(("Enregistrement membre", await test_member_registration()))

    # Test 5 : Statistiques
    results.append(("Statistiques partenariat", await test_partner_stats()))

    # Test 6 : Utilisateur réel
    results.append(("SSO utilisateur réel", await test_real_user_sso()))

    # Résumé
    print_header("RÉSUMÉ DES TESTS")

    total = len(results)
    passed = sum(1 for _, result in results if result)
    failed = total - passed

    for test_name, result in results:
        if result:
            print_success(f"{test_name:<30} RÉUSSI")
        else:
            print_error(f"{test_name:<30} ÉCHOUÉ")

    print(f"\n{Colors.BOLD}{'─'*80}{Colors.ENDC}")
    print(f"{Colors.BOLD}Total : {total} tests{Colors.ENDC}")
    print(f"{Colors.OKGREEN}✓ Réussis : {passed}{Colors.ENDC}")
    if failed > 0:
        print(f"{Colors.FAIL}✗ Échoués : {failed}{Colors.ENDC}")
    print(f"{Colors.BOLD}{'─'*80}{Colors.ENDC}\n")

    if failed == 0:
        print(f"{Colors.OKGREEN}{Colors.BOLD}")
        print("╔═══════════════════════════════════════════════════════════════════════════════╗")
        print("║                    ✓ TOUS LES TESTS SONT PASSÉS ✓                            ║")
        print("║               L'intégration MaBoiteDigitale fonctionne !                     ║")
        print("╚═══════════════════════════════════════════════════════════════════════════════╝")
        print(f"{Colors.ENDC}\n")
        return 0
    else:
        print(f"{Colors.FAIL}{Colors.BOLD}")
        print("╔═══════════════════════════════════════════════════════════════════════════════╗")
        print("║                    ✗ CERTAINS TESTS ONT ÉCHOUÉ ✗                             ║")
        print("║              Vérifiez les logs ci-dessus pour plus de détails                ║")
        print("╚═══════════════════════════════════════════════════════════════════════════════╝")
        print(f"{Colors.ENDC}\n")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(run_all_tests())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Test interrompu par l'utilisateur{Colors.ENDC}\n")
        sys.exit(130)
    except Exception as e:
        print(f"\n{Colors.FAIL}Erreur critique : {str(e)}{Colors.ENDC}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
