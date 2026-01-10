"""Test d'envoi d'email avec Resend"""
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

# Charger les variables d'environnement
load_dotenv(Path(__file__).parent / '.env')

from email_service import email_service

async def test_email():
    print(f"Resend API configurée: {email_service.is_configured()}")
    
    # Test d'envoi
    result = await email_service.send_email(
        to=["clarisse.ramora@gmail.com"],
        subject="Test Email Resend - En Toute Franchise",
        body_html="""
        <html>
        <body>
            <h1>Test Email</h1>
            <p>Ceci est un test d'envoi d'email via Resend.</p>
            <p>Si vous recevez cet email, la configuration fonctionne !</p>
        </body>
        </html>
        """
    )
    
    print(f"Résultat: {'Succès' if result else 'Échec'}")

if __name__ == "__main__":
    asyncio.run(test_email())
