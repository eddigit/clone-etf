"""
Script d'import de la base de données MongoDB
Importe les données depuis un fichier d'export JSON
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json
from datetime import datetime
from pathlib import Path
import os
from dotenv import load_dotenv
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

EXPORT_DIR = ROOT_DIR / 'db_export'

async def import_database(import_file=None):
    """Importe toutes les collections depuis un fichier d'export"""
    
    # Trouver le fichier d'export le plus récent si non spécifié
    if import_file is None:
        export_files = list(EXPORT_DIR.glob('db_export_*.json'))
        if not export_files:
            print("❌ Aucun fichier d'export trouvé!")
            print(f"📁 Recherche dans: {EXPORT_DIR}")
            return
        import_file = max(export_files, key=lambda p: p.stat().st_mtime)
    
    print(f"📁 Fichier d'import: {import_file}")
    
    # Charger les données
    with open(import_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"📅 Date d'export: {data.get('export_date', 'Inconnue')}")
    print(f"📊 Collections: {len(data['collections'])}")
    
    # Connexion à la nouvelle base
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    print(f"\n📡 Connexion à MongoDB: {mongo_url}")
    print(f"📊 Base de données cible: {db_name}")
    
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Tester la connexion
        await client.server_info()
        print("✓ Connexion réussie!\n")
        
        # Demander confirmation
        print("⚠️  ATTENTION: Cette opération va:")
        print("   1. Supprimer toutes les collections existantes")
        print("   2. Importer les nouvelles données")
        print()
        response = input("Continuer? (oui/non): ").strip().lower()
        
        if response not in ['oui', 'o', 'yes', 'y']:
            print("❌ Import annulé")
            return
        
        print()
        total_imported = 0
        
        # Importer chaque collection
        for collection_name, documents in data['collections'].items():
            print(f"📥 Import de '{collection_name}'...", end=' ')
            
            # Supprimer la collection existante
            await db[collection_name].drop()
            
            if not documents:
                print("✓ (vide)")
                continue
            
            # Convertir les dates ISO en datetime
            for doc in documents:
                for key, value in doc.items():
                    if isinstance(value, str):
                        # Essayer de parser les dates ISO
                        try:
                            if 'T' in value and (value.endswith('Z') or '+' in value or value.count(':') >= 2):
                                doc[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                        except:
                            pass
            
            # Insérer les documents
            await db[collection_name].insert_many(documents)
            total_imported += len(documents)
            
            print(f"✓ {len(documents)} documents")
        
        print(f"\n✅ Import terminé!")
        print(f"📊 Total: {total_imported} documents importés")
        
        # Créer les index si nécessaire
        print(f"\n🔍 Création des index...")
        
        # Index pour users
        await db.users.create_index("email", unique=True)
        await db.users.create_index("id", unique=True)
        print("   ✓ Index users (email, id)")
        
        # Index pour ai_conversations
        await db.ai_conversations.create_index("userId")
        await db.ai_conversations.create_index("id", unique=True)
        print("   ✓ Index ai_conversations (userId, id)")
        
        # Index pour ai_messages
        await db.ai_messages.create_index("conversationId")
        await db.ai_messages.create_index("userId")
        await db.ai_messages.create_index("id", unique=True)
        print("   ✓ Index ai_messages (conversationId, userId, id)")
        
        # Index pour documents
        await db.documents.create_index("userId")
        await db.documents.create_index("id", unique=True)
        print("   ✓ Index documents (userId, id)")
        
        print(f"\n🎉 Base de données prête!")
        
        client.close()
        
    except Exception as e:
        print(f"\n❌ Erreur lors de l'import: {str(e)}")
        print(f"\n💡 Vérifiez:")
        print(f"   - La chaîne de connexion MongoDB dans backend/.env")
        print(f"   - Que la base de données cible est accessible")
        print(f"   - Que vous avez les permissions nécessaires")
        raise

if __name__ == "__main__":
    print("=" * 70)
    print("  📦 IMPORT BASE DE DONNÉES MONGODB")
    print("=" * 70)
    print()
    
    asyncio.run(import_database())
