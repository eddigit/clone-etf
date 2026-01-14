import requests
import hashlib
import hmac
import time
import sys
from datetime import datetime

API_BASE_URL = "http://localhost:8001/api"
PARTNER_ID = "etf"
PARTNER_SECRET = "dev_secret_change_in_production"

def get_utc_timestamp():
    return int(datetime.utcnow().timestamp())

def generate_signature(partner_id, timestamp, body=""):
    message = f"{partner_id}{timestamp}{body}"
    signature = hmac.new(
        PARTNER_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()
    return signature

def test_health():
    print("Test 1: Health Check")
    response = requests.get(f"{API_BASE_URL}/partners/health")
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    return response.status_code == 200

def test_subscription_status():
    print("\nTest 2: Subscription Status")
    timestamp = str(get_utc_timestamp())
    signature = generate_signature(PARTNER_ID, timestamp)
    
    headers = {
        "X-Partner-ID": PARTNER_ID,
        "X-Timestamp": timestamp,
        "X-Signature": signature
    }
    
    response = requests.get(
        f"{API_BASE_URL}/partners/subscription/status",
        params={"email": "assoentoutefranchise@sfr.fr"},
        headers=headers
    )
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    return response.status_code == 200

def test_sso_token():
    print("\nTest 3: SSO Token Generation")
    timestamp = str(get_utc_timestamp())
    signature = generate_signature(PARTNER_ID, timestamp)
    
    headers = {
        "X-Partner-ID": PARTNER_ID,
        "X-Timestamp": timestamp,
        "X-Signature": signature
    }
    
    response = requests.post(
        f"{API_BASE_URL}/partners/sso/token",
        params={"email": "assoentoutefranchise@sfr.fr"},
        headers=headers
    )
    print(f"  Status: {response.status_code}")
    data = response.json()
    if response.status_code == 200:
        print(f"  Token: {data.get('token', 'N/A')[:30]}...")
        print(f"  Expires: {data.get('expires_at', 'N/A')}")
    else:
        print(f"  Response: {data}")
    return response.status_code in [200, 403, 404]

def test_invalid_signature():
    print("\nTest 4: Invalid Signature (should fail)")
    timestamp = str(get_utc_timestamp())
    
    headers = {
        "X-Partner-ID": PARTNER_ID,
        "X-Timestamp": timestamp,
        "X-Signature": "invalid_signature_123456"
    }
    
    response = requests.get(
        f"{API_BASE_URL}/partners/subscription/status",
        params={"email": "assoentoutefranchise@sfr.fr"},
        headers=headers
    )
    print(f"  Status: {response.status_code}")
    print(f"  Correctly rejected: {response.status_code == 401}")
    return response.status_code == 401

def test_expired_timestamp():
    print("\nTest 5: Expired Timestamp (should fail)")
    timestamp = str(get_utc_timestamp() - 600)
    signature = generate_signature(PARTNER_ID, timestamp)
    
    headers = {
        "X-Partner-ID": PARTNER_ID,
        "X-Timestamp": timestamp,
        "X-Signature": signature
    }
    
    response = requests.get(
        f"{API_BASE_URL}/partners/subscription/status",
        params={"email": "assoentoutefranchise@sfr.fr"},
        headers=headers
    )
    print(f"  Status: {response.status_code}")
    print(f"  Correctly rejected: {response.status_code == 401}")
    return response.status_code == 401

def test_sso_validation():
    print("\nTest 6: SSO Token Validation (frontend endpoint)")
    timestamp = str(get_utc_timestamp())
    signature = generate_signature(PARTNER_ID, timestamp)
    
    headers = {
        "X-Partner-ID": PARTNER_ID,
        "X-Timestamp": timestamp,
        "X-Signature": signature
    }
    
    token_response = requests.post(
        f"{API_BASE_URL}/partners/sso/token",
        params={"email": "assoentoutefranchise@sfr.fr"},
        headers=headers
    )
    
    if token_response.status_code != 200:
        print(f"  Token generation failed: {token_response.json()}")
        return False
    
    token = token_response.json().get("token")
    
    validation_response = requests.post(
        f"{API_BASE_URL}/auth/sso/validate",
        json={"token": token, "partner": PARTNER_ID}
    )
    
    print(f"  Status: {validation_response.status_code}")
    data = validation_response.json()
    
    if validation_response.status_code == 200:
        print(f"  Success: {data.get('success')}")
        print(f"  User: {data.get('user', {}).get('email')}")
        print(f"  JWT Token: {data.get('token', 'N/A')[:30]}...")
        return True
    else:
        print(f"  Error: {data}")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("TESTS INTEGRATION MABOITEDIGITALE / ETF")
    print("=" * 50)
    
    results = []
    results.append(("Health Check", test_health()))
    results.append(("Subscription Status", test_subscription_status()))
    results.append(("SSO Token", test_sso_token()))
    results.append(("Invalid Signature", test_invalid_signature()))
    results.append(("Expired Timestamp", test_expired_timestamp()))
    results.append(("SSO Validation", test_sso_validation()))
    
    print("\n" + "=" * 50)
    print("RESULTATS")
    print("=" * 50)
    
    passed = 0
    for name, result in results:
        status = "PASS" if result else "FAIL"
        if result:
            passed += 1
        print(f"  [{status}] {name}")
    
    print(f"\nTotal: {passed}/{len(results)} tests passes")
    sys.exit(0 if passed == len(results) else 1)
