"""
Script de test pour l'intégration MaBoiteDigitale / ETF
Teste tous les endpoints partenaire
"""
import requests
import hashlib
import hmac
import time
import json
from datetime import datetime

API_BASE_URL = "http://localhost:8001/api"
PARTNER_ID = "etf"
PARTNER_SECRET = "dev_secret_change_in_production"

def generate_signature(partner_id, timestamp, body=""):
    """Génère une signature HMAC-SHA256"""
    message = f"{partner_id}{timestamp}{body}"
    signature = hmac.new(
        PARTNER_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    return signature

def test_health():
    """Test 1: Health check"""
    print("\n=== Test 1: Health Check ===")
    try:
        response = requests.get(f"{API_BASE_URL}/partners/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        print("✓ Health check OK")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False

def test_subscription_status(email="admin@etf.com"):
    """Test 2: Vérification statut d'abonnement"""
    print(f"\n=== Test 2: Subscription Status ({email}) ===")
    try:
        timestamp = str(int(time.time()))
        signature = generate_signature(PARTNER_ID, timestamp)
        
        headers = {
            "X-Partner-ID": PARTNER_ID,
            "X-Timestamp": timestamp,
            "X-Signature": signature
        }
        
        response = requests.get(
            f"{API_BASE_URL}/partners/subscription/status",
            params={"email": email},
            headers=headers
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        print("✓ Subscription status OK")
        return True
    except Exception as e:
        print(f"✗ Subscription status failed: {e}")
        return False

def test_sso_token(email="admin@etf.com"):
    """Test 3: Génération de token SSO"""
    print(f"\n=== Test 3: SSO Token Generation ({email}) ===")
    try:
        timestamp = str(int(time.time()))
        signature = generate_signature(PARTNER_ID, timestamp)
        
        headers = {
            "X-Partner-ID": PARTNER_ID,
            "X-Timestamp": timestamp,
            "X-Signature": signature
        }
        
        response = requests.post(
            f"{API_BASE_URL}/partners/sso/token",
            params={"email": email},
            headers=headers
        )
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {data}")
        
        if response.status_code == 200:
            print(f"✓ SSO Token: {data.get('token', 'N/A')[:20]}...")
            print(f"✓ Redirect URL: {data.get('redirect_url', 'N/A')}")
            return True
        else:
            print(f"✗ SSO token generation failed")
            return False
    except Exception as e:
        print(f"✗ SSO token generation failed: {e}")
        return False

def test_register_member():
    """Test 4: Enregistrement d'un membre"""
    print("\n=== Test 4: Register Member ===")
    try:
        timestamp = str(int(time.time()))
        signature = generate_signature(PARTNER_ID, timestamp)
        
        headers = {
            "X-Partner-ID": PARTNER_ID,
            "X-Timestamp": timestamp,
            "X-Signature": signature,
            "Content-Type": "application/json"
        }
        
        member_data = {
            "email": "admin@etf.com",
            "member_number": "ETF2026-TEST",
            "first_name": "Admin",
            "last_name": "ETF",
            "membership_type": "professional",
            "membership_end_date": "2026-12-31T23:59:59",
            "discount_percentage": 20.0
        }
        
        response = requests.post(
            f"{API_BASE_URL}/partners/members/register",
            json=member_data,
            headers=headers
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code in [200, 201]:
            print("✓ Member registration OK")
            return True
        else:
            print("✗ Member registration failed")
            return False
    except Exception as e:
        print(f"✗ Member registration failed: {e}")
        return False

def test_invalid_signature():
    """Test 5: Signature invalide (doit échouer)"""
    print("\n=== Test 5: Invalid Signature (should fail) ===")
    try:
        timestamp = str(int(time.time()))
        
        headers = {
            "X-Partner-ID": PARTNER_ID,
            "X-Timestamp": timestamp,
            "X-Signature": "invalid_signature_123456"
        }
        
        response = requests.get(
            f"{API_BASE_URL}/partners/subscription/status",
            params={"email": "admin@etf.com"},
            headers=headers
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 401:
            print("✓ Invalid signature correctly rejected")
            return True
        else:
            print("✗ Invalid signature not rejected!")
            return False
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False

def run_all_tests():
    """Lance tous les tests"""
    print("=" * 60)
    print("TESTS INTÉGRATION MABOITEDIGITALE / ETF")
    print("=" * 60)
    print(f"API Base URL: {API_BASE_URL}")
    print(f"Partner ID: {PARTNER_ID}")
    print(f"Date: {datetime.now().isoformat()}")
    
    results = []
    
    # Test 1: Health
    results.append(("Health Check", test_health()))
    
    # Test 2: Subscription Status
    results.append(("Subscription Status", test_subscription_status()))
    
    # Test 3: SSO Token
    results.append(("SSO Token Generation", test_sso_token()))
    
    # Test 4: Register Member
    results.append(("Member Registration", test_register_member()))
    
    # Test 5: Invalid Signature
    results.append(("Invalid Signature", test_invalid_signature()))
    
    # Résumé
    print("\n" + "=" * 60)
    print("RÉSUMÉ DES TESTS")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nRésultat: {passed}/{total} tests passés ({int(passed/total*100)}%)")
    
    if passed == total:
        print("\n🎉 Tous les tests sont passés !")
    else:
        print(f"\n⚠️  {total - passed} test(s) échoué(s)")

if __name__ == "__main__":
    run_all_tests()
