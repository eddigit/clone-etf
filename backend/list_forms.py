"""
Script pour lister tous les formulaires HelloAsso
"""

import asyncio
import httpx
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

HELLOASSO_API_BASE = "https://api.helloasso.com/v5"
HELLOASSO_AUTH_URL = "https://api.helloasso.com/oauth2/token"
HELLOASSO_CLIENT_ID = os.environ.get('HELLOASSO_CLIENT_ID', '')
HELLOASSO_CLIENT_SECRET = os.environ.get('HELLOASSO_CLIENT_SECRET', '')
HELLOASSO_ORGANIZATION_SLUG = os.environ.get('HELLOASSO_ORGANIZATION_SLUG', 'en-toute-franchise')

async def main():
    async with httpx.AsyncClient() as client:
        # Auth
        response = await client.post(
            HELLOASSO_AUTH_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": HELLOASSO_CLIENT_ID,
                "client_secret": HELLOASSO_CLIENT_SECRET
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        data = response.json()
        access_token = data["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Get all forms
        response = await client.get(
            f"{HELLOASSO_API_BASE}/organizations/{HELLOASSO_ORGANIZATION_SLUG}/forms",
            headers=headers,
            params={"pageSize": 100}
        )
        forms = response.json()
        print("FORMULAIRES HELLOASSO DISPONIBLES:")
        print("="*100)
        for form in forms.get("data", []):
            form_type = form.get("formType", "N/A")
            form_slug = form.get("formSlug", "N/A")
            title = form.get("title", "N/A")
            url = form.get("url", "")
            print(f"Type: {form_type:15} | Slug: {form_slug}")
            print(f"  Titre: {title}")
            print(f"  URL: {url}")
            print("-"*100)
        print("="*100)

if __name__ == "__main__":
    asyncio.run(main())
