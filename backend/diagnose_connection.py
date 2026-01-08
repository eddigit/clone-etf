"""
Script de diagnostic de connexion MongoDB Atlas
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import socket

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def diagnose():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    print("=" * 70)
    print("  🔍 DIAGNOSTIC DE CONNEXION MONGODB ATLAS")
    print("=" * 70)
    print()
    print(f"📡 URL: {mongo_url}")
    print(f"📊 Database: {db_name}")
    print()
    
    # Extraire le hostname
    if "@" in mongo_url:
        host_part = mongo_url.split("@")[1].split("/")[0].split("?")[0]
        print(f"🌐 Hostname: {host_part}")
        
        # Test DNS
        print(f"\n🔍 Test de résolution DNS...")
        try:
            # Pour mongodb+srv, on teste le SRV record
            if "mongodb+srv://" in mongo_url:
                srv_host = f"_mongodb._tcp.{host_part}"
                print(f"   Recherche SRV: {srv_host}")
                try:
                    import dns.resolver
                    answers = dns.resolver.resolve(srv_host, 'SRV')
                    print(f"   ✓ DNS SRV résolu: {len(list(answers))} entrées trouvées")
                except ImportError:
                    print(f"   ⚠️  Module dns.resolver non installé")
                    print(f"   Installez avec: pip install dnspython")
                except Exception as e:
                    print(f"   ✗ Erreur DNS SRV: {str(e)}")
            else:
                # Test DNS classique
                ip = socket.gethostbyname(host_part)
                print(f"   ✓ DNS résolu: {ip}")
        except Exception as e:
            print(f"   ✗ Erreur DNS: {str(e)}")
    
    # Test de connexion MongoDB
    print(f"\n⏳ Test de connexion MongoDB...")
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=10000)
        info = await client.server_info()
        print(f"   ✓ Connexion réussie!")
        print(f"   Version MongoDB: {info.get('version', 'unknown')}")
        
        db = client[db_name]
        collections = await db.list_collection_names()
        print(f"\n📦 Collections ({len(collections)}):")
        if collections:
            for col in collections:
                count = await db[col].count_documents({})
                print(f"   • {col}: {count} documents")
        else:
            print(f"   (aucune collection)")
        
        print(f"\n✅ Connexion fonctionnelle!")
        client.close()
        return True
        
    except Exception as e:
        print(f"   ✗ Erreur: {str(e)}")
        print(f"\n💡 Solutions possibles:")
        print(f"   1. Vérifiez l'URL dans MongoDB Atlas Dashboard")
        print(f"   2. Allez dans Database > Connect > Connect your application")
        print(f"   3. Copiez l'URL exacte (Driver: Python, Version: 3.12)")
        print(f"   4. Vérifiez que votre IP est autorisée (Network Access)")
        print(f"   5. Attendez 2-3 minutes si le cluster vient d'être créé")
        print(f"\n📋 URL actuelle dans .env:")
        print(f"   {mongo_url}")
        return False

if __name__ == "__main__":
    result = asyncio.run(diagnose())
    exit(0 if result else 1)
