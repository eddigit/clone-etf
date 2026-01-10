import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('.env')

async def list_all_admins():
    client = AsyncIOMotorClient(os.getenv('MONGO_URL'))
    db = client[os.getenv('DB_NAME')]
    
    # Chercher tous les users avec role admin
    admins = await db.users.find({'role': 'admin'}).to_list(length=100)
    
    print(f"📋 {len(admins)} compte(s) admin trouvé(s):\n")
    for admin in admins:
        print(f"ID: {admin.get('id')}")
        print(f"Email: {admin.get('email')}")
        print(f"Nom: {admin.get('firstName')} {admin.get('lastName')}")
        print(f"Role: {admin.get('role')}")
        print(f"membershipStatus: {admin.get('membershipStatus')}")
        print("-" * 50)
    
    client.close()

asyncio.run(list_all_admins())
