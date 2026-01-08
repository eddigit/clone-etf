"""
Script d'export de la base de données MongoDB distante
Exporte toutes les collections dans des fichiers JSON
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json
from datetime import datetime
from pathlib import Path
import os
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Créer le dossier d'export
EXPORT_DIR = ROOT_DIR / 'db_export'
EXPORT_DIR.mkdir(exist_ok=True)

async def export_database():
    """Exporte toutes les collections de la base MongoDB"""
    
    # Connexion à la base distante
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    print(f"📡 Connexion à MongoDB: {mongo_url}")
    print(f"📊 Base de données: {db_name}")
    
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Tester la connexion
        await client.server_info()
        print("✓ Connexion réussie!\n")
        
        # Obtenir la liste des collections
        collections = await db.list_collection_names()
        print(f"📦 Collections trouvées: {len(collections)}")
        print(f"   {', '.join(collections)}\n")
        
        total_docs = 0
        exported_data = {
            'export_date': datetime.utcnow().isoformat(),
            'database': db_name,
            'collections': {}
        }
        
        # Exporter chaque collection
        for collection_name in collections:
            print(f"📥 Export de '{collection_name}'...", end=' ')
            
            collection = db[collection_name]
            documents = await collection.find({}).to_list(length=None)
            
            # Convertir les ObjectId en string pour JSON
            for doc in documents:
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
                # Convertir les dates en ISO format
                for key, value in doc.items():
                    if isinstance(value, datetime):
                        doc[key] = value.isoformat()
            
            exported_data['collections'][collection_name] = documents
            total_docs += len(documents)
            
            print(f"✓ {len(documents)} documents")
        
        # Sauvegarder dans un fichier JSON
        export_file = EXPORT_DIR / f'db_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        with open(export_file, 'w', encoding='utf-8') as f:
            json.dump(exported_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Export terminé!")
        print(f"📁 Fichier: {export_file}")
        print(f"📊 Total: {total_docs} documents dans {len(collections)} collections")
        
        # Créer aussi des fichiers séparés par collection
        print(f"\n📁 Création des fichiers par collection...")
        for collection_name, documents in exported_data['collections'].items():
            collection_file = EXPORT_DIR / f'{collection_name}.json'
            with open(collection_file, 'w', encoding='utf-8') as f:
                json.dump(documents, f, indent=2, ensure_ascii=False)
            print(f"   ✓ {collection_name}.json ({len(documents)} docs)")
        
        print(f"\n🎉 Export complet dans: {EXPORT_DIR}")
        
        client.close()
        
    except Exception as e:
        print(f"\n❌ Erreur lors de l'export: {str(e)}")
        print(f"\n💡 Vérifiez:")
        print(f"   - La chaîne de connexion MongoDB dans backend/.env")
        print(f"   - Que la base de données distante est accessible")
        print(f"   - Que les credentials sont corrects")
        raise

if __name__ == "__main__":
    print("=" * 70)
    print("  📦 EXPORT BASE DE DONNÉES MONGODB")
    print("=" * 70)
    print()
    
    asyncio.run(export_database())
