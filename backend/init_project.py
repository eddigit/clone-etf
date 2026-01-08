"""
🚀 INITIALISATION COMPLÈTE DU PROJET
Initialise la base de données avec toutes les données de départ
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

async def init_project():
    """Initialise complètement le projet"""
    
    print("=" * 70)
    print("  🚀 INITIALISATION DU PROJET EN TOUTE FRANCHISE")
    print("=" * 70)
    print()
    
    # Connexion
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'test_database')
    
    print(f"📡 Connexion: {mongo_url}")
    print(f"📊 Database: {db_name}")
    print()
    
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        await client.server_info()
        print("✓ Connexion réussie!\n")
    except Exception as e:
        print(f"❌ Impossible de se connecter à MongoDB!")
        print(f"   Erreur: {str(e)}")
        print()
        print("💡 Solutions:")
        print("   1. Créez un compte MongoDB Atlas (gratuit)")
        print("   2. Obtenez l'URL de connexion")
        print("   3. Modifiez backend/.env avec cette URL")
        print("   4. Relancez ce script")
        print()
        print("📚 Voir: DATABASE_MIGRATION_TODO.md")
        return False
    
    db = client[db_name]
    
    # Demander confirmation
    print("⚠️  Cette opération va:")
    print("   • Supprimer toutes les données existantes")
    print("   • Créer 8 collections")
    print("   • Insérer les données de départ")
    print()
    response = input("Continuer? (oui/non): ").strip().lower()
    
    if response not in ['oui', 'o', 'yes', 'y']:
        print("❌ Initialisation annulée")
        return False
    
    print()
    print("🗑️  Suppression des données existantes...")
    
    # Supprimer toutes les collections
    collections = await db.list_collection_names()
    for col in collections:
        await db[col].drop()
    print(f"   ✓ {len(collections)} collections supprimées")
    
    print()
    print("📦 Création des données de départ...")
    
    # ============ USERS ============
    users = [
        {
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
        },
        {
            "id": "admin-user-456",
            "email": "admin@example.fr",
            "password": hash_password("admin123"),
            "firstName": "Marie",
            "lastName": "Martin",
            "phone": "0623456789",
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
    ]
    await db.users.insert_many(users)
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    print(f"   ✓ users: {len(users)} utilisateurs")
    
    # ============ RESOURCES ============
    resources = [
        {
            "id": "res-1",
            "title": "Guide Juridique - Créer son Entreprise",
            "description": "Guide complet pour créer son entreprise en toute légalité",
            "category": "guide",
            "type": "pdf",
            "url": "/resources/guide-creation-entreprise.pdf",
            "accessLevel": "all",
            "createdAt": datetime.utcnow()
        },
        {
            "id": "res-2",
            "title": "Modèle de Contrat Commercial",
            "description": "Modèle de contrat type pour vos relations commerciales",
            "category": "template",
            "type": "docx",
            "url": "/resources/modele-contrat-commercial.docx",
            "accessLevel": "professional",
            "createdAt": datetime.utcnow()
        },
        {
            "id": "res-3",
            "title": "Vidéo - Vos Droits en tant que Commerçant",
            "description": "Formation vidéo sur les droits des commerçants",
            "category": "video",
            "type": "video",
            "url": "https://youtube.com/watch?v=exemple",
            "accessLevel": "all",
            "createdAt": datetime.utcnow()
        }
    ]
    await db.resources.insert_many(resources)
    print(f"   ✓ resources: {len(resources)} ressources")
    
    # ============ ARTICLES ============
    articles = [
        {
            "id": "art-1",
            "title": "Les nouveautés juridiques 2026",
            "slug": "nouveautes-juridiques-2026",
            "excerpt": "Découvrez les changements juridiques qui impactent votre activité",
            "content": "Contenu complet de l'article...",
            "author": "Marie Martin",
            "category": "Actualités",
            "tags": ["juridique", "2026", "nouveautés"],
            "published": True,
            "publishedAt": datetime.utcnow() - timedelta(days=5),
            "createdAt": datetime.utcnow() - timedelta(days=7),
            "updatedAt": datetime.utcnow() - timedelta(days=5)
        },
        {
            "id": "art-2",
            "title": "Comment protéger sa marque ?",
            "slug": "comment-proteger-sa-marque",
            "excerpt": "Guide pratique pour protéger votre marque commerciale",
            "content": "Contenu de l'article sur la protection des marques...",
            "author": "Jean Dupont",
            "category": "Guides",
            "tags": ["marque", "propriété intellectuelle", "protection"],
            "published": True,
            "publishedAt": datetime.utcnow() - timedelta(days=2),
            "createdAt": datetime.utcnow() - timedelta(days=3),
            "updatedAt": datetime.utcnow() - timedelta(days=2)
        }
    ]
    await db.articles.insert_many(articles)
    print(f"   ✓ articles: {len(articles)} articles")
    
    # ============ COLLECTIONS VIDES ============
    # Créer les collections même si vides
    await db.ai_conversations.insert_one({"_temp": True})
    await db.ai_conversations.delete_one({"_temp": True})
    await db.ai_conversations.create_index("userId")
    await db.ai_conversations.create_index("id", unique=True)
    print(f"   ✓ ai_conversations: structure créée")
    
    await db.ai_messages.insert_one({"_temp": True})
    await db.ai_messages.delete_one({"_temp": True})
    await db.ai_messages.create_index("conversationId")
    await db.ai_messages.create_index("userId")
    print(f"   ✓ ai_messages: structure créée")
    
    await db.documents.insert_one({"_temp": True})
    await db.documents.delete_one({"_temp": True})
    await db.documents.create_index("userId")
    await db.documents.create_index("id", unique=True)
    print(f"   ✓ documents: structure créée")
    
    await db.invoices.insert_one({"_temp": True})
    await db.invoices.delete_one({"_temp": True})
    print(f"   ✓ invoices: structure créée")
    
    await db.contact_messages.insert_one({"_temp": True})
    await db.contact_messages.delete_one({"_temp": True})
    print(f"   ✓ contact_messages: structure créée")
    
    print()
    print("=" * 70)
    print("  ✅ INITIALISATION TERMINÉE!")
    print("=" * 70)
    print()
    print("📊 Base de données créée avec:")
    print(f"   • 2 utilisateurs (test + admin)")
    print(f"   • 3 ressources")
    print(f"   • 2 articles de blog")
    print(f"   • 8 collections avec index")
    print()
    print("🔐 Comptes créés:")
    print("   • User:  test@example.fr / password123")
    print("   • Admin: admin@example.fr / admin123")
    print()
    print("🚀 Prochaines étapes:")
    print("   1. Démarrer le backend: python -m uvicorn server:app --reload --port 8001")
    print("   2. Démarrer le frontend: cd ../frontend && npm start")
    print("   3. Tester: http://localhost:3000")
    print()
    
    client.close()
    return True

if __name__ == "__main__":
    success = asyncio.run(init_project())
    exit(0 if success else 1)
