"""
Script pour vérifier et afficher tous les comptes administrateurs
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

MONGO_URL = os.environ.get('MONGO_URL')

async def verify_admins():
    """Vérifie tous les comptes admin"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.etf_db
    
    try:
        print("🔍 Recherche des comptes administrateurs...")
        print("=" * 60)
        
        # Trouver tous les admins
        admins = await db.users.find({"role": "admin"}).to_list(None)
        
        if not admins:
            print("❌ Aucun compte administrateur trouvé!")
            return
        
        print(f"✅ {len(admins)} compte(s) administrateur(s) trouvé(s):\n")
        
        for i, admin in enumerate(admins, 1):
            print(f"Admin #{i}:")
            print(f"  - ID: {admin.get('id')}")
            print(f"  - Email: {admin.get('email')}")
            print(f"  - Nom: {admin.get('firstName', '')} {admin.get('lastName', '')}")
            print(f"  - Rôle: {admin.get('role')}")
            print(f"  - Créé le: {admin.get('createdAt', 'N/A')}")
            print()
        
        # Vérifier les articles créés par chaque admin
        print("\n📝 Articles créés par chaque admin:")
        print("=" * 60)
        
        for admin in admins:
            articles = await db.articles.find({"authorId": admin.get('id')}).to_list(None)
            print(f"{admin.get('email')}: {len(articles)} article(s)")
        
        print("\n" + "=" * 60)
        print("✅ Vérification terminée")
        
    except Exception as e:
        print(f"❌ Erreur: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(verify_admins())
