import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('.env')

async def check_admin():
    client = AsyncIOMotorClient(os.getenv('MONGO_URL'))
    db = client[os.getenv('DB_NAME')]
    
    user = await db.users.find_one({'email': 'admin@entoutefranchise.fr'})
    
    if user:
        print(f"✅ ADMIN EXISTE")
        print(f"Email: {user.get('email')}")
        print(f"Role: {user.get('role')}")
        print(f"ID: {user.get('id')}")
        print(f"membershipStatus: {user.get('membershipStatus')}")
    else:
        print("❌ ADMIN N'EXISTE PAS - Il faut le créer!")
    
    client.close()

asyncio.run(check_admin())
