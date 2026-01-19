"""
Script pour synchroniser les adhérents HelloAsso
"""

import asyncio
import httpx
import os
from dotenv import load_dotenv
from pathlib import Path
import json

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

HELLOASSO_API_BASE = "https://api.helloasso.com/v5"
HELLOASSO_AUTH_URL = "https://api.helloasso.com/oauth2/token"
HELLOASSO_CLIENT_ID = os.environ.get('HELLOASSO_CLIENT_ID', '')
HELLOASSO_CLIENT_SECRET = os.environ.get('HELLOASSO_CLIENT_SECRET', '')
HELLOASSO_ORGANIZATION_SLUG = os.environ.get('HELLOASSO_ORGANIZATION_SLUG', 'en-toute-franchise')


async def main():
    print("="*60)
    print("SYNCHRONISATION HELLOASSO")
    print("="*60)
    
    # Authentification
    print("\n1. Authentification HelloAsso...")
    async with httpx.AsyncClient() as client:
        response = await client.post(
            HELLOASSO_AUTH_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": HELLOASSO_CLIENT_ID,
                "client_secret": HELLOASSO_CLIENT_SECRET
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code != 200:
            print(f"   ❌ ERREUR: {response.status_code} - {response.text}")
            return
        
        data = response.json()
        access_token = data["access_token"]
        print("   ✅ Authentifié avec succès")
        
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Récupérer les items (adhésions)
        print("\n2. Récupération des adhésions récentes (items)...")
        
        items_url = f"{HELLOASSO_API_BASE}/organizations/{HELLOASSO_ORGANIZATION_SLUG}/items?withDetails=true&pageSize=30&sortOrder=desc"
        response = await client.get(items_url, headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            items = result.get('data', result) if isinstance(result, dict) else result
            
            print(f"   ✅ {len(items)} adhésion(s) récente(s)")
            print("\n" + "="*100)
            print(f"{'Date':12} | {'Email':40} | {'Nom':25} | {'Montant':>10} | {'Form'}")
            print("="*100)
            
            for item in items:
                # Extraire les données utilisateur
                user = item.get('user', {})
                payer = item.get('payer', {})
                order = item.get('order', {})
                
                # Email (plusieurs sources possibles)
                email = user.get('email') or payer.get('email') or 'N/A'
                
                # Nom
                first_name = user.get('firstName') or payer.get('firstName') or ''
                last_name = user.get('lastName') or payer.get('lastName') or ''
                name = f"{first_name} {last_name}".strip() or 'N/A'
                
                # Date
                date = order.get('date', item.get('date', 'N/A'))
                if date and date != 'N/A':
                    date = date[:10]
                
                # Montant
                amount = item.get('amount', 0)
                if isinstance(amount, (int, float)):
                    amount = f"{amount/100:.2f}€"
                else:
                    amount = 'N/A'
                
                # Form
                form = order.get('formSlug', item.get('formSlug', 'N/A'))
                
                print(f"{date:12} | {email:40} | {name:25} | {amount:>10} | {form}")
            
            print("="*100)
        else:
            print(f"   ❌ Erreur: {response.status_code}")


if __name__ == "__main__":
    asyncio.run(main())
