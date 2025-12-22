"""
Seed script to populate initial data for testing
Run this once: python seed_data.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from auth_utils import hash_password
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed_database():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🌱 Seeding database...")
    
    # Create test user
    test_user = {
        "id": "test-user-123",
        "email": "test@example.fr",
        "password": hash_password("password123"),
        "firstName": "Jean",
        "lastName": "Dupont",
        "phone": "0612345678",
        "businessName": "Boulangerie Dupont",
        "businessType": "Boulangerie",
        "membershipType": "professional",
        "membershipStatus": "active",
        "membershipStartDate": datetime.utcnow(),
        "membershipEndDate": datetime.utcnow() + timedelta(days=365),
        "role": "user",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    # Check if user exists
    existing = await db.users.find_one({"email": test_user["email"]})
    if not existing:
        await db.users.insert_one(test_user)
        print(f"✓ Created test user: {test_user['email']} / password123")
    else:
        print(f"ℹ Test user already exists: {test_user['email']}")
    
    # Create admin user
    admin_user = {
        "id": "admin-user-123",
        "email": "admin@example.fr",
        "password": hash_password("admin123"),
        "firstName": "Admin",
        "lastName": "ETF",
        "phone": "0756974419",
        "businessName": None,
        "businessType": None,
        "membershipType": "individual",
        "membershipStatus": "active",
        "membershipStartDate": datetime.utcnow(),
        "membershipEndDate": datetime.utcnow() + timedelta(days=365),
        "role": "admin",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    existing_admin = await db.users.find_one({"email": admin_user["email"]})
    if not existing_admin:
        await db.users.insert_one(admin_user)
        print(f"✓ Created admin user: {admin_user['email']} / admin123")
    else:
        print(f"ℹ Admin user already exists: {admin_user['email']}")
    
    # Seed articles
    articles = [
        {
            "id": "article-1",
            "title": "Guide complet du bail commercial en 2025",
            "excerpt": "Tout ce que vous devez savoir sur les baux commerciaux : droits, obligations, renouvellement et résiliation.",
            "content": "Contenu complet de l'article...",
            "image": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800",
            "author": "Jean Dupont",
            "category": "Juridique",
            "readTime": "8 min",
            "createdAt": datetime.utcnow() - timedelta(days=5),
            "updatedAt": datetime.utcnow() - timedelta(days=5)
        },
        {
            "id": "article-2",
            "title": "Concurrence déloyale : comment se défendre",
            "excerpt": "Les recours juridiques disponibles pour protéger votre commerce contre la concurrence déloyale.",
            "content": "Contenu complet de l'article...",
            "image": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800",
            "author": "Marie Martin",
            "category": "Défense",
            "readTime": "6 min",
            "createdAt": datetime.utcnow() - timedelta(days=10),
            "updatedAt": datetime.utcnow() - timedelta(days=10)
        }
    ]
    
    for article in articles:
        existing = await db.articles.find_one({"id": article["id"]})
        if not existing:
            await db.articles.insert_one(article)
            print(f"✓ Created article: {article['title']}")
    
    # Seed resources
    resources = [
        {
            "id": "resource-1",
            "title": "Modèle de lettre de mise en demeure",
            "type": "document",
            "category": "Modèles juridiques",
            "format": "DOCX",
            "size": "45 KB",
            "downloads": 234,
            "filePath": "/mock/path/resource1.docx",
            "createdAt": datetime.utcnow()
        },
        {
            "id": "resource-2",
            "title": "Guide du renouvellement de bail",
            "type": "guide",
            "category": "Guides pratiques",
            "format": "PDF",
            "size": "2.3 MB",
            "downloads": 567,
            "filePath": "/mock/path/resource2.pdf",
            "createdAt": datetime.utcnow()
        }
    ]
    
    for resource in resources:
        existing = await db.resources.find_one({"id": resource["id"]})
        if not existing:
            await db.resources.insert_one(resource)
            print(f"✓ Created resource: {resource['title']}")
    
    # Create test invoices for test user
    invoices = [
        {
            "id": "invoice-1",
            "userId": "test-user-123",
            "description": "Adhésion Commerçant - Artisan 2025",
            "amount": "50€",
            "status": "Payé",
            "date": datetime.utcnow() - timedelta(days=20)
        }
    ]
    
    for invoice in invoices:
        existing = await db.invoices.find_one({"id": invoice["id"]})
        if not existing:
            await db.invoices.insert_one(invoice)
            print(f"✓ Created invoice: {invoice['description']}")
    
    print("\n✅ Database seeded successfully!")
    print("\n📝 Test credentials:")
    print("   User: test@example.fr / password123")
    print("   Admin: admin@example.fr / admin123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
