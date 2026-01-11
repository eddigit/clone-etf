import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import sys
sys.path.append('.')
from auth_utils import hash_password

load_dotenv('.env')

async def create_admins():
    client = AsyncIOMotorClient(os.getenv('MONGO_URL'))
    db = client[os.getenv('DB_NAME')]
    
    admins = [
        {
            "id": "admin-etf-001",
            "email": "assoentoutefranchise@sfr.fr",
            "password": hash_password("$EnTouteFranchise2026!"),
            "firstName": "Association",
            "lastName": "En Toute Franchise",
            "phone": "+33612345678",
            "businessName": "En Toute Franchise",
            "businessType": None,
            "membershipType": "association",
            "role": "admin",
            "membershipStatus": "active",
            "membershipStartDate": datetime.utcnow(),
            "membershipEndDate": datetime.utcnow() + timedelta(days=3650),  # 10 ans
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "profilePhoto": None,
            "bio": "Administrateur principal - Association En Toute Franchise",
            "expertise": ["administration", "gestion", "juridique"],
            "location": "France",
            "isProfilePublic": False
        },
        {
            "id": "admin-webmaster-001",
            "email": "coachdigitalparis@gmail.com",
            "password": hash_password("$$Reussite888!!"),
            "firstName": "Webmaster",
            "lastName": "ETF",
            "phone": "+33612345679",
            "businessName": "Coach Digital Paris",
            "businessType": None,
            "membershipType": "professional",
            "role": "admin",
            "membershipStatus": "active",
            "membershipStartDate": datetime.utcnow(),
            "membershipEndDate": datetime.utcnow() + timedelta(days=3650),  # 10 ans
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "profilePhoto": None,
            "bio": "Webmaster et administrateur technique",
            "expertise": ["technique", "développement", "support"],
            "location": "Paris",
            "isProfilePublic": False
        }
    ]
    
    created = 0
    for admin in admins:
        # Vérifier si l'admin existe déjà
        existing = await db.users.find_one({'email': admin['email']})
        if existing:
            print(f"⚠️  L'admin {admin['email']} existe déjà")
        else:
            await db.users.insert_one(admin)
            print(f"✅ Compte admin créé: {admin['email']}")
            created += 1
    
    print(f"\n🎉 {created} compte(s) administrateur(s) créé(s) avec succès!")
    print("\n📧 Identifiants des administrateurs:")
    print("=" * 60)
    print("\n1. Compte Association:")
    print("   Email: assoentoutefranchise@sfr.fr")
    print("   Mot de passe: $EnTouteFranchise2026!")
    print("\n2. Compte Webmaster:")
    print("   Email: coachdigitalparis@gmail.com")
    print("   Mot de passe: $$Reussite888!!")
    print("\n" + "=" * 60)
    print("\n🔗 Connexion: https://www.en-toutefranchise.com/login")
    print("🔗 Admin: https://www.en-toutefranchise.com/admin")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admins())
