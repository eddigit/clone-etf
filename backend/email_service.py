"""
Service d'envoi d'emails pour En Toute Franchise
Utilise Resend API
"""
import os
import logging
import httpx
from typing import Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)

# Configuration Resend
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
MAIL_FROM = os.environ.get('MAIL_FROM', 'En Toute Franchise <noreply@en-toutefranchise.com>')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://www.en-toutefranchise.com')


class EmailService:
    """Service d'envoi d'emails via Resend"""

    def __init__(self):
        self.api_key = RESEND_API_KEY
        self.api_url = "https://api.resend.com/emails"

    def is_configured(self) -> bool:
        """Verifie si le service email est configure"""
        return bool(self.api_key)

    async def send_email(
        self,
        to: List[str],
        subject: str,
        body_html: str,
        body_text: Optional[str] = None
    ) -> bool:
        """
        Envoie un email via Resend

        Args:
            to: Liste des destinataires
            subject: Sujet de l'email
            body_html: Corps HTML de l'email
            body_text: Corps texte (optionnel)

        Returns:
            True si envoi reussi, False sinon
        """
        if not self.is_configured():
            logger.warning("Resend API key not configured - email not sent")
            return False

        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "from": MAIL_FROM,
                    "to": to,
                    "subject": subject,
                    "html": body_html
                }
                
                if body_text:
                    payload["text"] = body_text

                response = await client.post(
                    self.api_url,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )

                if response.status_code in [200, 201]:
                    data = response.json()
                    logger.info(f"Email sent successfully to {to}, id: {data.get('id')}")
                    return True
                else:
                    logger.error(f"Failed to send email: {response.status_code} - {response.text}")
                    return False

        except Exception as e:
            logger.error(f"Failed to send email to {to}: {str(e)}")
            return False

    async def send_welcome_email(
        self,
        to_email: str,
        first_name: str,
        last_name: str,
        reset_token: str
    ) -> bool:
        """
        Envoie un email de bienvenue avec lien de creation de mot de passe

        Args:
            to_email: Email du destinataire
            first_name: Prenom
            last_name: Nom
            reset_token: Token de reinitialisation
        """
        reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

        subject = "Bienvenue chez En Toute Franchise - Activez votre compte"

        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #1e3a8a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .button:hover {{ background: #1e40af; }}
                .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
                .highlight {{ background: #dbeafe; padding: 15px; border-radius: 5px; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Bienvenue chez En Toute Franchise</h1>
                </div>
                <div class="content">
                    <p>Bonjour <strong>{first_name} {last_name}</strong>,</p>

                    <p>Nous sommes ravis de vous accueillir parmi nos adherents !</p>

                    <p>Votre compte a ete cree sur notre plateforme. Pour y acceder, vous devez d'abord creer votre mot de passe en cliquant sur le bouton ci-dessous :</p>

                    <p style="text-align: center;">
                        <a href="{reset_link}" class="button">Creer mon mot de passe</a>
                    </p>

                    <div class="highlight">
                        <p><strong>Votre email de connexion :</strong> {to_email}</p>
                    </div>

                    <p>Ce lien est valable pendant <strong>48 heures</strong>.</p>

                    <p>Une fois connecte, vous aurez acces a :</p>
                    <ul>
                        <li>La communaute des adherents</li>
                        <li>L'assistant IA d'orientation</li>
                        <li>Les dossiers collectifs ETF</li>
                        <li>La messagerie entre membres</li>
                        <li>Les ressources et guides</li>
                    </ul>

                    <p>Si vous n'avez pas demande ce compte, vous pouvez ignorer cet email.</p>

                    <p>A bientot sur la plateforme !</p>
                    <p><strong>L'equipe En Toute Franchise</strong></p>
                </div>
                <div class="footer">
                    <p>En Toute Franchise - Association loi 1901</p>
                    <p>1 rue Francois Boucher, 13700 MARIGNANE</p>
                    <p>Tel : 06 09 78 09 53 | Email : assoentoutefranchise@sfr.fr</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email([to_email], subject, body_html)

    async def send_password_reset_email(
        self,
        to_email: str,
        first_name: str,
        reset_token: str
    ) -> bool:
        """
        Envoie un email de reinitialisation de mot de passe

        Args:
            to_email: Email du destinataire
            first_name: Prenom
            reset_token: Token de reinitialisation
        """
        reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

        subject = "Reinitialisation de votre mot de passe - En Toute Franchise"

        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #1e3a8a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
                .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Reinitialisation de mot de passe</h1>
                </div>
                <div class="content">
                    <p>Bonjour <strong>{first_name}</strong>,</p>

                    <p>Vous avez demande la reinitialisation de votre mot de passe.</p>

                    <p>Cliquez sur le bouton ci-dessous pour creer un nouveau mot de passe :</p>

                    <p style="text-align: center;">
                        <a href="{reset_link}" class="button">Reinitialiser mon mot de passe</a>
                    </p>

                    <div class="warning">
                        <p><strong>Ce lien expire dans 1 heure.</strong></p>
                        <p>Si vous n'avez pas fait cette demande, ignorez cet email. Votre mot de passe actuel reste inchange.</p>
                    </div>

                    <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
                    <p style="word-break: break-all; font-size: 12px; color: #6b7280;">{reset_link}</p>

                    <p>Cordialement,</p>
                    <p><strong>L'equipe En Toute Franchise</strong></p>
                </div>
                <div class="footer">
                    <p>En Toute Franchise - Association loi 1901</p>
                    <p>1 rue Francois Boucher, 13700 MARIGNANE</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email([to_email], subject, body_html)

    async def send_renewal_reminder_email(
        self,
        to_email: str,
        first_name: str,
        end_date: datetime,
        days_left: int
    ) -> bool:
        """
        Envoie un rappel de renouvellement d'adhesion

        Args:
            to_email: Email du destinataire
            first_name: Prenom
            end_date: Date de fin d'adhesion
            days_left: Jours restants avant expiration
        """
        renewal_link = f"{FRONTEND_URL}/dashboard/adhesions"
        formatted_date = end_date.strftime('%d/%m/%Y')

        if days_left > 0:
            subject = f"Votre adhesion expire dans {days_left} jours - En Toute Franchise"
            urgency_text = f"dans <strong>{days_left} jours</strong> (le {formatted_date})"
            urgency_color = "#f59e0b" if days_left <= 7 else "#3b82f6"
        else:
            subject = "Votre adhesion a expire - En Toute Franchise"
            urgency_text = f"le <strong>{formatted_date}</strong>"
            urgency_color = "#dc2626"

        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, {urgency_color} 0%, #1e3a8a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #1e3a8a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
                .highlight {{ background: #dbeafe; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid {urgency_color}; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{"Renouvellement requis" if days_left <= 0 else "Rappel de renouvellement"}</h1>
                </div>
                <div class="content">
                    <p>Bonjour <strong>{first_name}</strong>,</p>

                    <div class="highlight">
                        <p>Votre adhesion a En Toute Franchise {"a expire" if days_left <= 0 else "expire"} {urgency_text}.</p>
                    </div>

                    <p>{"Pour continuer a beneficier de tous vos avantages adherent, pensez a renouveler votre adhesion :" if days_left > 0 else "Renouvelez maintenant pour retrouver l'acces a tous vos avantages adherent :"}</p>

                    <ul>
                        <li>Acces a la communaute des adherents</li>
                        <li>Assistant IA d'orientation</li>
                        <li>Dossiers collectifs ETF</li>
                        <li>Messagerie entre membres</li>
                        <li>20% de reduction sur la Boite a Outils Digitale</li>
                    </ul>

                    <p style="text-align: center;">
                        <a href="{renewal_link}" class="button">Renouveler mon adhesion</a>
                    </p>

                    <p>Vous pouvez egalement nous contacter directement pour renouveler par cheque ou virement.</p>

                    <p>Cordialement,</p>
                    <p><strong>L'equipe En Toute Franchise</strong></p>
                </div>
                <div class="footer">
                    <p>En Toute Franchise - Association loi 1901</p>
                    <p>Tel : 06 09 78 09 53 | Email : assoentoutefranchise@sfr.fr</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email([to_email], subject, body_html)

    async def send_invitation_email(
        self,
        to_email: str,
        first_name: str,
        last_name: str,
        membership_type: str
    ) -> bool:
        """
        Envoie un email d'invitation a adherer via HelloAsso

        Args:
            to_email: Email du destinataire
            first_name: Prenom
            last_name: Nom
            membership_type: Type d'adhesion
        """
        helloasso_link = "https://www.helloasso.com/associations/en-toute-franchise/adhesions/adhesion-en-toute-franchise-2025"

        membership_labels = {
            'individual': 'Particulier (30€)',
            'professional': 'Commerçant - Artisan (30€)',
            'professional_plus': 'Commerçant +100m² (50€)',
            'association': 'Association (50€)'
        }
        membership_label = membership_labels.get(membership_type, 'Adhésion')

        subject = "Invitation à rejoindre En Toute Franchise Association"

        body_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }}
                .button:hover {{ background: #15803d; }}
                .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }}
                .highlight {{ background: #dbeafe; padding: 15px; border-radius: 5px; margin: 15px 0; }}
                .benefits {{ background: #f0fdf4; padding: 15px; border-radius: 5px; border-left: 4px solid #16a34a; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🤝 Invitation a rejoindre<br>En Toute Franchise Association</h1>
                </div>
                <div class="content">
                    <p>Bonjour <strong>{first_name} {last_name}</strong>,</p>

                    <p>Vous avez ete invite(e) a rejoindre <strong>En Toute Franchise Association</strong>, 
                    l'association nationale de defense des franchises et commercants.</p>

                    <div class="highlight">
                        <p><strong>Votre type d'adhesion :</strong> {membership_label}</p>
                    </div>

                    <p>Pour finaliser votre adhesion et acceder a tous les services de la plateforme, 
                    cliquez sur le bouton ci-dessous :</p>

                    <p style="text-align: center;">
                        <a href="{helloasso_link}" class="button">✅ Finaliser mon adhesion</a>
                    </p>

                    <div class="benefits">
                        <p><strong>En devenant adherent, vous aurez acces a :</strong></p>
                        <ul>
                            <li>🤖 L'assistant IA d'orientation juridique</li>
                            <li>👥 La communaute des adherents</li>
                            <li>📁 Les dossiers collectifs ETF</li>
                            <li>💬 La messagerie entre membres</li>
                            <li>📚 Les ressources et guides exclusifs</li>
                            <li>🎁 20% de reduction sur la Boite a Outils Digitale</li>
                        </ul>
                    </div>

                    <p>Le paiement est securise et gere par <strong>HelloAsso</strong>.</p>

                    <p>Une fois votre paiement effectue, vous recevrez un email pour activer votre compte 
                    et creer votre mot de passe.</p>

                    <p>A tres bientot parmi nous !</p>
                    <p><strong>L'equipe En Toute Franchise</strong></p>
                </div>
                <div class="footer">
                    <p>En Toute Franchise Association - Loi 1901</p>
                    <p>1 rue Francois Boucher, 13700 MARIGNANE</p>
                    <p>Tel : 06 09 78 09 53 | Email : assoentoutefranchise@sfr.fr</p>
                </div>
            </div>
        </body>
        </html>
        """

        return await self.send_email([to_email], subject, body_html)


# Instance globale du service
email_service = EmailService()
