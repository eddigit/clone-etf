#!/usr/bin/env python3
"""
Backend API Tests for En Toute Franchise Platform
Tests all API endpoints as specified in the review request
"""

import requests
import json
import os
from datetime import datetime

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except FileNotFoundError:
        pass
    return "https://etf-members.preview.emergentagent.com"

BASE_URL = get_backend_url()
API_URL = f"{BASE_URL}/api"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.conversation_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response": response_data
        })
    
    def test_health_checks(self):
        """Test health check endpoints"""
        print("=== HEALTH CHECKS ===")
        
        # Test root endpoint
        try:
            response = self.session.get(f"{API_URL}/")
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/", True, f"Status: {response.status_code}, Message: {data.get('message', '')}")
            else:
                self.log_test("GET /api/", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/", False, f"Exception: {str(e)}")
        
        # Test health endpoint
        try:
            response = self.session.get(f"{API_URL}/health")
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/health", True, f"Status: {response.status_code}, Health: {data.get('status', '')}")
            else:
                self.log_test("GET /api/health", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/health", False, f"Exception: {str(e)}")
    
    def test_authentication(self):
        """Test authentication endpoints"""
        print("=== AUTHENTICATION TESTS ===")
        
        # Test user registration
        register_data = {
            "email": "marie.martin@example.fr",
            "password": "motdepasse123",
            "firstName": "Marie",
            "lastName": "Martin",
            "phone": "0612345678",
            "businessName": "Boulangerie Martin",
            "businessType": "Boulangerie",
            "membershipType": "professional"
        }
        
        try:
            response = self.session.post(f"{API_URL}/auth/register", json=register_data)
            if response.status_code == 200:
                data = response.json()
                self.log_test("POST /api/auth/register", True, f"Status: {response.status_code}, Message: {data.get('message', '')}")
            else:
                # User might already exist, that's okay for testing
                if response.status_code == 400 and "déjà utilisé" in response.text:
                    self.log_test("POST /api/auth/register", True, "User already exists (expected for repeated tests)")
                else:
                    self.log_test("POST /api/auth/register", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/auth/register", False, f"Exception: {str(e)}")
        
        # Test user login with test credentials
        login_data = {
            "email": "test@example.fr",
            "password": "password123"
        }
        
        try:
            response = self.session.post(f"{API_URL}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('token')
                self.user_id = data.get('user', {}).get('id')
                self.session.headers.update({'Authorization': f'Bearer {self.token}'})
                self.log_test("POST /api/auth/login (test user)", True, f"Status: {response.status_code}, Token received: {bool(self.token)}")
            else:
                # Try with the registered user instead
                login_data["email"] = "marie.martin@example.fr"
                login_data["password"] = "motdepasse123"
                response = self.session.post(f"{API_URL}/auth/login", json=login_data)
                if response.status_code == 200:
                    data = response.json()
                    self.token = data.get('token')
                    self.user_id = data.get('user', {}).get('id')
                    self.session.headers.update({'Authorization': f'Bearer {self.token}'})
                    self.log_test("POST /api/auth/login (registered user)", True, f"Status: {response.status_code}, Token received: {bool(self.token)}")
                else:
                    self.log_test("POST /api/auth/login", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/auth/login", False, f"Exception: {str(e)}")
    
    def test_user_profile(self):
        """Test user profile endpoints"""
        print("=== USER PROFILE TESTS ===")
        
        if not self.token:
            self.log_test("User Profile Tests", False, "No authentication token available")
            return
        
        # Test get profile
        try:
            response = self.session.get(f"{API_URL}/users/profile")
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/users/profile", True, f"Status: {response.status_code}, User: {data.get('firstName', '')} {data.get('lastName', '')}")
            else:
                self.log_test("GET /api/users/profile", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/users/profile", False, f"Exception: {str(e)}")
        
        # Test update profile
        update_data = {
            "phone": "0687654321",
            "businessName": "Nouvelle Boulangerie Martin"
        }
        
        try:
            response = self.session.put(f"{API_URL}/users/profile", json=update_data)
            if response.status_code == 200:
                data = response.json()
                self.log_test("PUT /api/users/profile", True, f"Status: {response.status_code}, Updated phone: {data.get('phone', '')}")
            else:
                self.log_test("PUT /api/users/profile", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("PUT /api/users/profile", False, f"Exception: {str(e)}")
    
    def test_ai_assistant(self):
        """Test AI assistant endpoints"""
        print("=== AI ASSISTANT TESTS ===")
        
        if not self.token:
            self.log_test("AI Assistant Tests", False, "No authentication token available")
            return
        
        # Test create conversation
        conv_data = {
            "title": "Question juridique sur les contrats"
        }
        
        try:
            response = self.session.post(f"{API_URL}/ai/conversations", json=conv_data)
            if response.status_code == 200:
                data = response.json()
                self.conversation_id = data.get('conversationId')
                self.log_test("POST /api/ai/conversations", True, f"Status: {response.status_code}, Conversation ID: {self.conversation_id}")
            else:
                self.log_test("POST /api/ai/conversations", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/ai/conversations", False, f"Exception: {str(e)}")
        
        # Test get conversations
        try:
            response = self.session.get(f"{API_URL}/ai/conversations")
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/ai/conversations", True, f"Status: {response.status_code}, Conversations count: {len(data)}")
            else:
                self.log_test("GET /api/ai/conversations", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/ai/conversations", False, f"Exception: {str(e)}")
        
        if self.conversation_id:
            # Test send message
            message_data = {
                "content": "Quelles sont les clauses essentielles dans un contrat de franchise ?"
            }
            
            try:
                response = self.session.post(f"{API_URL}/ai/conversations/{self.conversation_id}/messages", json=message_data)
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("POST /api/ai/conversations/{id}/messages", True, f"Status: {response.status_code}, AI response received")
                else:
                    self.log_test("POST /api/ai/conversations/{id}/messages", False, f"Status: {response.status_code}", response.text)
            except Exception as e:
                self.log_test("POST /api/ai/conversations/{id}/messages", False, f"Exception: {str(e)}")
            
            # Test get messages
            try:
                response = self.session.get(f"{API_URL}/ai/conversations/{self.conversation_id}/messages")
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("GET /api/ai/conversations/{id}/messages", True, f"Status: {response.status_code}, Messages count: {len(data)}")
                else:
                    self.log_test("GET /api/ai/conversations/{id}/messages", False, f"Status: {response.status_code}", response.text)
            except Exception as e:
                self.log_test("GET /api/ai/conversations/{id}/messages", False, f"Exception: {str(e)}")
    
    def test_resources_and_articles(self):
        """Test resources and articles endpoints"""
        print("=== RESOURCES AND ARTICLES TESTS ===")
        
        if not self.token:
            self.log_test("Resources and Articles Tests", False, "No authentication token available")
            return
        
        # Test get resources
        try:
            response = self.session.get(f"{API_URL}/resources")
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/resources", True, f"Status: {response.status_code}, Resources count: {len(data)}")
            else:
                self.log_test("GET /api/resources", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/resources", False, f"Exception: {str(e)}")
        
        # Test get articles (no auth required)
        try:
            # Remove auth header temporarily for articles
            auth_header = self.session.headers.get('Authorization')
            if auth_header:
                del self.session.headers['Authorization']
            
            response = self.session.get(f"{API_URL}/articles")
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/articles", True, f"Status: {response.status_code}, Articles count: {len(data)}")
            else:
                self.log_test("GET /api/articles", False, f"Status: {response.status_code}", response.text)
            
            # Restore auth header
            if auth_header:
                self.session.headers['Authorization'] = auth_header
                
        except Exception as e:
            self.log_test("GET /api/articles", False, f"Exception: {str(e)}")
    
    def test_subscriptions(self):
        """Test subscription endpoints"""
        print("=== SUBSCRIPTION TESTS ===")
        
        if not self.token:
            self.log_test("Subscription Tests", False, "No authentication token available")
            return
        
        # Test get current subscription
        try:
            response = self.session.get(f"{API_URL}/subscriptions/current")
            if response.status_code == 200:
                data = response.json()
                membership = data.get('membership', {})
                self.log_test("GET /api/subscriptions/current", True, f"Status: {response.status_code}, Membership type: {membership.get('type', '')}")
            else:
                self.log_test("GET /api/subscriptions/current", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/subscriptions/current", False, f"Exception: {str(e)}")
        
        # Test get invoices
        try:
            response = self.session.get(f"{API_URL}/subscriptions/invoices")
            if response.status_code == 200:
                data = response.json()
                self.log_test("GET /api/subscriptions/invoices", True, f"Status: {response.status_code}, Invoices count: {len(data)}")
            else:
                self.log_test("GET /api/subscriptions/invoices", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("GET /api/subscriptions/invoices", False, f"Exception: {str(e)}")
    
    def test_contact(self):
        """Test contact endpoint"""
        print("=== CONTACT TESTS ===")
        
        # Remove auth header for contact (no auth required)
        auth_header = self.session.headers.get('Authorization')
        if auth_header:
            del self.session.headers['Authorization']
        
        contact_data = {
            "name": "Pierre Dubois",
            "email": "pierre.dubois@example.fr",
            "phone": "0123456789",
            "subject": "Question sur l'adhésion",
            "message": "Bonjour, j'aimerais avoir plus d'informations sur les différents types d'adhésion disponibles."
        }
        
        try:
            response = self.session.post(f"{API_URL}/contact", json=contact_data)
            if response.status_code == 200:
                data = response.json()
                self.log_test("POST /api/contact", True, f"Status: {response.status_code}, Message: {data.get('message', '')}")
            else:
                self.log_test("POST /api/contact", False, f"Status: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("POST /api/contact", False, f"Exception: {str(e)}")
        
        # Restore auth header
        if auth_header:
            self.session.headers['Authorization'] = auth_header
    
    def run_all_tests(self):
        """Run all API tests"""
        print(f"Starting API tests for: {BASE_URL}")
        print(f"API Base URL: {API_URL}")
        print("=" * 60)
        
        self.test_health_checks()
        self.test_authentication()
        self.test_user_profile()
        self.test_ai_assistant()
        self.test_resources_and_articles()
        self.test_subscriptions()
        self.test_contact()
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\nFailed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['details']}")
        
        return passed, total

if __name__ == "__main__":
    tester = APITester()
    passed, total = tester.run_all_tests()
    
    # Exit with error code if tests failed
    if passed < total:
        exit(1)
    else:
        print("\n🎉 All tests passed!")
        exit(0)