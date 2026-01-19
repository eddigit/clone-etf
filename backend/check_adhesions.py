"""
Script pour vérifier les dernières adhésions et logs
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, timezone

async def check_recent_users():
    MONGO_URL = 'mongodb+srv://associationentoutefranchise_db_user:yCXkIQQUA0GPYd2F@clone-etf.cqbuiow.mongodb.net/test_database?retryWrites=true&w=majority&appName=Clone-ETF'
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['test_database']
    
    # Derniers 10 utilisateurs créés
    print('='*60)
    print('DERNIERS 10 UTILISATEURS CRÉÉS')
    print('='*60)
    users = await db.users.find().sort('createdAt', -1).limit(10).to_list(length=10)
    for u in users:
        created = u.get('createdAt', 'N/A')
        if isinstance(created, datetime):
            created = created.strftime('%Y-%m-%d %H:%M')
        print(f"{created} | {u.get('email', 'N/A'):40} | {u.get('firstName', '')} {u.get('lastName', '')} | Status: {u.get('membershipStatus', 'N/A')}")
    
    # Utilisateurs créés dans les dernières 72h
    yesterday = datetime.now(timezone.utc) - timedelta(hours=72)
    print('\n' + '='*60)
    print('UTILISATEURS DES DERNIÈRES 72H')
    print('='*60)
    recent = await db.users.find({'createdAt': {'$gte': yesterday}}).sort('createdAt', -1).to_list(length=20)
    if recent:
        for u in recent:
            created = u.get('createdAt', 'N/A')
            if isinstance(created, datetime):
                created = created.strftime('%Y-%m-%d %H:%M')
            print(f"{created} | {u.get('email', 'N/A'):40} | {u.get('firstName', '')} {u.get('lastName', '')} | Status: {u.get('membershipStatus', 'N/A')}")
    else:
        print('Aucun nouvel utilisateur dans les 72 dernières heures')
    
    # MEMBERSHIPS (adhésions créées via le formulaire)
    print('\n' + '='*60)
    print('ADHÉSIONS RÉCENTES (collection memberships - 10 dernières)')
    print('='*60)
    memberships = await db.memberships.find().sort('created_at', -1).limit(10).to_list(length=10)
    if memberships:
        for m in memberships:
            created = m.get('created_at', 'N/A')
            if isinstance(created, datetime):
                created = created.strftime('%Y-%m-%d %H:%M')
            member_data = m.get('member_data', {})
            email = member_data.get('email', 'N/A') if isinstance(member_data, dict) else 'N/A'
            nom = member_data.get('nom', '') if isinstance(member_data, dict) else ''
            prenom = member_data.get('prenom', '') if isinstance(member_data, dict) else ''
            print(f"{created} | {email:40} | {prenom} {nom} | Status: {m.get('status', 'N/A')} | Type: {m.get('membership_type', 'N/A')}")
    else:
        print('Aucune adhésion dans la collection memberships')
    
    # Paiements HelloAsso récents
    print('\n' + '='*60)
    print('PAIEMENTS HELLOASSO RÉCENTS (10 derniers)')
    print('='*60)
    payments = await db.helloasso_payments.find().sort('date', -1).limit(10).to_list(length=10)
    if payments:
        for p in payments:
            date = p.get('date', 'N/A')
            if isinstance(date, datetime):
                date = date.strftime('%Y-%m-%d %H:%M')
            print(f"{date} | {p.get('email', p.get('payerEmail', 'N/A')):40} | {p.get('amount', 'N/A'):>6}€ | State: {p.get('state', 'N/A')}")
    else:
        print('Aucun paiement HelloAsso enregistré')
    
    # Webhooks HelloAsso récents
    print('\n' + '='*60)
    print('WEBHOOKS HELLOASSO RÉCENTS (10 derniers)')
    print('='*60)
    webhooks = await db.helloasso_webhooks.find().sort('received_at', -1).limit(10).to_list(length=10)
    if webhooks:
        for w in webhooks:
            date = w.get('received_at', 'N/A')
            if isinstance(date, datetime):
                date = date.strftime('%Y-%m-%d %H:%M')
            print(f"{date} | Type: {w.get('eventType', 'N/A'):20} | Status: {w.get('status', 'N/A')}")
    else:
        print('Aucun webhook enregistré')
    
    # Vérifier les membres HelloAsso
    print('\n' + '='*60)
    print('MEMBRES HELLOASSO RÉCENTS (10 derniers)')
    print('='*60)
    members = await db.helloasso_members.find().sort('syncedAt', -1).limit(10).to_list(length=10)
    if members:
        for m in members:
            synced = m.get('syncedAt', 'N/A')
            if isinstance(synced, datetime):
                synced = synced.strftime('%Y-%m-%d %H:%M')
            print(f"{synced} | {m.get('email', 'N/A'):40} | {m.get('firstName', '')} {m.get('lastName', '')} | Form: {m.get('formSlug', 'N/A')}")
    else:
        print('Aucun membre HelloAsso synchronisé')
    
    # Toutes les collections
    print('\n' + '='*60)
    print('COLLECTIONS DANS LA BASE DE DONNÉES')
    print('='*60)
    collections = await db.list_collection_names()
    for c in sorted(collections):
        count = await db[c].count_documents({})
        print(f"  {c:40} : {count:>6} documents")
    
    # Total des utilisateurs
    print('\n' + '='*60)
    total = await db.users.count_documents({})
    active = await db.users.count_documents({'membershipStatus': 'active'})
    pending = await db.users.count_documents({'membershipStatus': 'pending'})
    print(f'TOTAL: {total} utilisateurs | {active} actifs | {pending} en attente')
    print('='*60)
    
    client.close()

if __name__ == '__main__':
    asyncio.run(check_recent_users())
