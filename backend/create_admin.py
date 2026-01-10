import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import sys
sys.path.append('.')
from auth_utils import hash_password

load_dotenv('.env')

async def create_admin():
    client = AsyncIOMotorClient(os.getenv('MONGO_URL'))
    db = client[os.getenv('DB_NAME')]
    
    # Vérifier si l'admin existe déjà
    existing = await db.users.find_one({'email': 'admin@entoutefranchise.fr'})
    if existing:
        print("✅ Admin existe déjà")
        client.close()
        return
    
    # Créer l'admin
    admin_user = {
        "id": "admin-user-789",
        "email": "admin@entoutefranchise.fr",
        "password": hash_password("Admin2026!"),
        "firstName": "Admin",
        "lastName": "ETF",
        "phone": "+33612345678",
        "businessName": None,
        "businessType": None,
        "membershipType": "professional",
        "role": "admin",
        "membershipStatus": "active",
        "membershipStartDate": datetime.utcnow(),
        "membershipEndDate": datetime.utcnow() + timedelta(days=3650),  # 10 ans
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "profilePhoto": None,
        "bio": "Administrateur de la plateforme",
        "expertise": ["administration", "support"],
        "location": "Paris",
        "isProfilePublic": True
    }
    
    await db.users.insert_one(admin_user)
    print("✅ Compte admin créé avec succès!")
    print(f"Email: admin@entoutefranchise.fr")
    print(f"Mot de passe: Admin2026!")
    
    client.close()

asyncio.run(create_admin())
