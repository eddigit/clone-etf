"""
Script pour tester la connexion MongoDB
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def test_connection():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    print("=" * 70)
    print("  🔍 TEST DE CONNEXION MONGODB")
    print("=" * 70)
    print()
    print(f"📡 URL: {mongo_url}")
    print(f"📊 Database: {db_name}")
    print()
    
    try:
        print("⏳ Connexion en cours...", end=' ')
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        
        # Tester la connexion
        await client.server_info()
        print("✓")
        
        db = client[db_name]
        
        # Lister les collections
        print("\n📦 Collections:")
        collections = await db.list_collection_names()
        
        if not collections:
            print("   (aucune collection)")
        else:
            total_docs = 0
            for collection_name in sorted(collections):
                count = await db[collection_name].count_documents({})
                total_docs += count
                print(f"   ✓ {collection_name:<20} {count:>6} documents")
            
            print(f"\n📊 Total: {total_docs} documents dans {len(collections)} collections")
        
        print("\n✅ Connexion réussie!")
        print("💡 La base de données est accessible et fonctionnelle")
        
        client.close()
        return True
        
    except Exception as e:
        print("✗")
        print(f"\n❌ Erreur de connexion: {str(e)}")
        print("\n💡 Vérifications:")
        print("   1. L'URL MongoDB dans backend/.env est correcte")
        print("   2. MongoDB est démarré (si local)")
        print("   3. Les credentials sont corrects (si distant)")
        print("   4. Les IPs sont autorisées (MongoDB Atlas)")
        print("   5. Votre connexion internet fonctionne (si distant)")
        print("\n📚 Voir MIGRATION_GUIDE.md pour plus d'aide")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_connection())
    exit(0 if result else 1)
