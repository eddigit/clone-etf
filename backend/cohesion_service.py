"""
Service de Cohésion pour En Toute Franchise
Module de gestion des contacts et d'envoi d'emails via Resend API

Fonctionnalités:
- Import de fichiers CSV de contacts
- Analyse et suppression des doublons
- Validation et conformité des emails
- Envoi d'emails via Resend API (compatible Render/cloud)
- Gestion des campagnes d'emails
"""
import os
import re
import csv
import io
import logging
import httpx
from typing import Optional, List, Dict, Tuple, Set
from datetime import datetime
from dataclasses import dataclass
import hashlib

logger = logging.getLogger(__name__)

# Configuration Resend API (compatible avec les hébergeurs cloud comme Render)
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
MAIL_FROM = os.environ.get('MAIL_FROM', 'En Toute Franchise <noreply@en-toutefranchise.com>')
RESEND_API_URL = "https://api.resend.com/emails"


@dataclass
class EmailValidationResult:
    """Résultat de la validation d'un email"""
    email: str
    is_valid: bool
    error_type: Optional[str] = None  # 'format', 'domain', 'disposable', 'syntax'
    error_message: Optional[str] = None


@dataclass
class ContactImportResult:
    """Résultat de l'import d'un fichier CSV"""
    total_rows: int = 0
    imported: int = 0
    duplicates: int = 0
    invalid_emails: int = 0
    errors: List[Dict] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []


class CohesionService:
    """Service principal de gestion de la cohésion/communauté"""
    
    # Liste des domaines jetables/temporaires connus
    DISPOSABLE_DOMAINS = {
        'tempmail.com', 'throwaway.com', 'guerrillamail.com', 'mailinator.com',
        'yopmail.com', 'temp-mail.org', '10minutemail.com', 'fakeinbox.com',
        'trashmail.com', 'getnada.com', 'mohmal.com', 'discard.email',
        'maildrop.cc', 'sharklasers.com', 'mailnesia.com', 'mytrashmail.com',
        'dispostable.com', 'tempinbox.com', 'jetable.org', 'spamgourmet.com'
    }
    
    # Pattern regex pour validation d'email
    EMAIL_REGEX = re.compile(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    )
    
    # Patterns d'emails clairement invalides
    INVALID_PATTERNS = [
        r'^test@',  # Emails de test
        r'^admin@example\.',
        r'@example\.(com|org|net)$',
        r'^[a-z]@',  # Email d'une seule lettre
        r'@localhost$',
        r'^(no-?reply|noreply|do-?not-?reply)',
        r'\.\.+',  # Points consécutifs
        r'^\.|\.$',  # Commence ou termine par un point
        r'@\d+\.\d+\.\d+\.\d+$',  # Adresse IP
    ]
    
    def __init__(self):
        self.api_configured = bool(RESEND_API_KEY)
        if not self.api_configured:
            logger.warning("Resend API non configuré - vérifiez RESEND_API_KEY")
    
    def is_configured(self) -> bool:
        """Vérifie si le service email (Resend) est configuré"""
        return self.api_configured
    
    # ==================== VALIDATION D'EMAILS ====================
    
    def validate_email_format(self, email: str) -> EmailValidationResult:
        """
        Valide le format d'un email
        
        Vérifie:
        - Format syntaxique correct
        - Pas de patterns invalides évidents
        - Pas de domaine jetable
        """
        email = email.strip().lower()
        
        # Vérification basique
        if not email:
            return EmailValidationResult(
                email=email,
                is_valid=False,
                error_type='syntax',
                error_message="Email vide"
            )
        
        # Vérification du format
        if not self.EMAIL_REGEX.match(email):
            return EmailValidationResult(
                email=email,
                is_valid=False,
                error_type='format',
                error_message="Format d'email invalide"
            )
        
        # Vérification des patterns invalides
        for pattern in self.INVALID_PATTERNS:
            if re.search(pattern, email, re.IGNORECASE):
                return EmailValidationResult(
                    email=email,
                    is_valid=False,
                    error_type='syntax',
                    error_message=f"Email correspond à un pattern invalide"
                )
        
        # Vérification du domaine jetable
        domain = email.split('@')[1]
        if domain in self.DISPOSABLE_DOMAINS:
            return EmailValidationResult(
                email=email,
                is_valid=False,
                error_type='disposable',
                error_message="Domaine d'email jetable/temporaire"
            )
        
        # Vérification de caractères spéciaux problématiques
        local_part = email.split('@')[0]
        if '..' in local_part or local_part.startswith('.') or local_part.endswith('.'):
            return EmailValidationResult(
                email=email,
                is_valid=False,
                error_type='syntax',
                error_message="Points mal placés dans la partie locale"
            )
        
        return EmailValidationResult(email=email, is_valid=True)
    
    async def validate_email_domain(self, email: str) -> EmailValidationResult:
        """
        Valide le domaine d'un email (vérification basique via DNS-over-HTTPS)
        Note: Vérification simplifiée pour compatibilité cloud
        """
        # D'abord valider le format
        format_result = self.validate_email_format(email)
        if not format_result.is_valid:
            return format_result
        
        domain = email.split('@')[1]
        
        try:
            # Utiliser DNS-over-HTTPS de Google pour vérifier le domaine
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"https://dns.google/resolve?name={domain}&type=MX"
                )
                if response.status_code == 200:
                    data = response.json()
                    # Status 0 = NOERROR, 3 = NXDOMAIN
                    if data.get("Status") == 3:
                        return EmailValidationResult(
                            email=email,
                            is_valid=False,
                            error_type='domain',
                            error_message="Le domaine n'existe pas"
                        )
                    # Si pas de réponse MX mais domaine existe, on accepte
        except Exception as e:
            logger.warning(f"Erreur lors de la vérification DNS pour {domain}: {e}")
            # En cas d'erreur, on ne refuse pas l'email
            pass
        
        return EmailValidationResult(email=email, is_valid=True)
    
    def validate_emails_batch(self, emails: List[str]) -> Dict[str, List[EmailValidationResult]]:
        """
        Valide un lot d'emails et les catégorise
        
        Returns:
            Dict avec 'valid' et 'invalid' contenant les résultats
        """
        results = {'valid': [], 'invalid': []}
        
        for email in emails:
            result = self.validate_email_format(email)
            if result.is_valid:
                results['valid'].append(result)
            else:
                results['invalid'].append(result)
        
        return results
    
    # ==================== GESTION DES DOUBLONS ====================
    
    def find_duplicates(self, emails: List[str]) -> Tuple[List[str], List[str]]:
        """
        Trouve et sépare les emails uniques des doublons
        
        Returns:
            Tuple (emails_uniques, emails_doublons)
        """
        seen = set()
        unique = []
        duplicates = []
        
        for email in emails:
            email_lower = email.strip().lower()
            if email_lower in seen:
                duplicates.append(email)
            else:
                seen.add(email_lower)
                unique.append(email)
        
        return unique, duplicates
    
    def find_duplicates_in_contacts(self, contacts: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """
        Trouve les doublons dans une liste de contacts basé sur l'email
        
        Returns:
            Tuple (contacts_uniques, contacts_doublons)
        """
        seen_emails = set()
        unique = []
        duplicates = []
        
        for contact in contacts:
            email = contact.get('email', '').strip().lower()
            if email in seen_emails:
                duplicates.append(contact)
            else:
                seen_emails.add(email)
                unique.append(contact)
        
        return unique, duplicates
    
    def deduplicate_with_existing(
        self, 
        new_emails: List[str], 
        existing_emails: Set[str]
    ) -> Tuple[List[str], List[str]]:
        """
        Compare les nouveaux emails avec une liste existante
        
        Returns:
            Tuple (nouveaux_uniques, déjà_existants)
        """
        new_unique = []
        already_exist = []
        
        existing_lower = {e.lower() for e in existing_emails}
        
        for email in new_emails:
            email_lower = email.strip().lower()
            if email_lower in existing_lower:
                already_exist.append(email)
            else:
                new_unique.append(email)
                existing_lower.add(email_lower)  # Éviter doublons dans les nouveaux
        
        return new_unique, already_exist
    
    # ==================== IMPORT CSV ====================
    
    def parse_csv_contacts(
        self, 
        csv_content: str,
        email_column: str = 'email',
        delimiter: str = ',',
        has_header: bool = True
    ) -> Tuple[List[Dict], List[str]]:
        """
        Parse un fichier CSV et extrait les contacts
        
        Args:
            csv_content: Contenu du fichier CSV
            email_column: Nom de la colonne email (ou index si pas de header)
            delimiter: Délimiteur CSV
            has_header: Indique si le CSV a une ligne d'en-tête
        
        Returns:
            Tuple (liste_contacts, liste_erreurs)
        """
        contacts = []
        errors = []
        
        try:
            # Détecter l'encodage et nettoyer
            csv_content = csv_content.replace('\r\n', '\n').replace('\r', '\n')
            
            reader = csv.reader(io.StringIO(csv_content), delimiter=delimiter)
            rows = list(reader)
            
            if not rows:
                errors.append("Fichier CSV vide")
                return contacts, errors
            
            # Gérer les en-têtes
            if has_header:
                headers = [h.strip().lower() for h in rows[0]]
                data_rows = rows[1:]
                
                # Trouver la colonne email
                email_idx = None
                for i, h in enumerate(headers):
                    if h == email_column.lower() or 'email' in h or 'mail' in h:
                        email_idx = i
                        break
                
                if email_idx is None:
                    errors.append(f"Colonne email non trouvée. Colonnes disponibles: {headers}")
                    return contacts, errors
            else:
                headers = None
                data_rows = rows
                email_idx = 0  # Première colonne par défaut
            
            # Parser les lignes
            for row_num, row in enumerate(data_rows, start=2 if has_header else 1):
                if not row or all(not cell.strip() for cell in row):
                    continue  # Ignorer lignes vides
                
                try:
                    email = row[email_idx].strip() if len(row) > email_idx else ''
                    
                    if not email:
                        errors.append(f"Ligne {row_num}: Email manquant")
                        continue
                    
                    # Construire le contact
                    contact = {'email': email, 'row_number': row_num}
                    
                    # Ajouter les autres colonnes si disponibles
                    if headers:
                        for i, header in enumerate(headers):
                            if i < len(row) and i != email_idx:
                                if header in ['nom', 'name', 'lastname', 'last_name']:
                                    contact['lastName'] = row[i].strip()
                                elif header in ['prenom', 'firstname', 'first_name', 'prénom']:
                                    contact['firstName'] = row[i].strip()
                                elif header in ['telephone', 'phone', 'tel', 'téléphone']:
                                    contact['phone'] = row[i].strip()
                                elif header in ['entreprise', 'company', 'societe', 'société']:
                                    contact['company'] = row[i].strip()
                                else:
                                    contact[header] = row[i].strip()
                    
                    contacts.append(contact)
                    
                except Exception as e:
                    errors.append(f"Ligne {row_num}: Erreur de parsing - {str(e)}")
            
        except Exception as e:
            errors.append(f"Erreur de lecture CSV: {str(e)}")
        
        return contacts, errors
    
    async def import_csv(
        self,
        csv_content: str,
        existing_emails: Set[str] = None,
        validate_domains: bool = False
    ) -> ContactImportResult:
        """
        Import complet d'un fichier CSV avec validation et déduplication
        
        Args:
            csv_content: Contenu du fichier CSV
            existing_emails: Set d'emails déjà existants en base
            validate_domains: Valider les domaines DNS (plus lent)
        
        Returns:
            ContactImportResult avec les statistiques d'import
        """
        result = ContactImportResult()
        
        # 1. Parser le CSV
        contacts, parse_errors = self.parse_csv_contacts(csv_content)
        result.total_rows = len(contacts)
        result.errors.extend([{'type': 'parse', 'message': e} for e in parse_errors])
        
        if not contacts:
            return result
        
        # 2. Valider les emails
        valid_contacts = []
        for contact in contacts:
            email = contact.get('email', '')
            
            if validate_domains:
                validation = await self.validate_email_domain(email)
            else:
                validation = self.validate_email_format(email)
            
            if validation.is_valid:
                valid_contacts.append(contact)
            else:
                result.invalid_emails += 1
                result.errors.append({
                    'type': 'validation',
                    'email': email,
                    'row': contact.get('row_number'),
                    'message': validation.error_message
                })
        
        # 3. Supprimer les doublons internes
        unique_contacts, dup_contacts = self.find_duplicates_in_contacts(valid_contacts)
        result.duplicates += len(dup_contacts)
        
        # 4. Comparer avec les emails existants
        if existing_emails:
            final_contacts = []
            for contact in unique_contacts:
                if contact['email'].lower() not in existing_emails:
                    final_contacts.append(contact)
                else:
                    result.duplicates += 1
            unique_contacts = final_contacts
        
        result.imported = len(unique_contacts)
        
        # Retourner les contacts importés dans le résultat
        result.contacts = unique_contacts
        
        return result
    
    # ==================== ENVOI D'EMAILS VIA RESEND API ====================
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None,
        reply_to: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Envoie un email via Resend API (compatible Render/cloud)
        
        Args:
            to_email: Email du destinataire
            subject: Sujet de l'email
            body_html: Corps HTML
            body_text: Corps texte (optionnel)
            reply_to: Adresse de réponse (optionnel)
        
        Returns:
            Tuple (success, error_message)
        """
        if not self.api_configured:
            return False, "Resend API non configuré (RESEND_API_KEY manquant)"
        
        try:
            payload = {
                "from": MAIL_FROM,
                "to": [to_email],
                "subject": subject,
                "html": body_html
            }
            
            if body_text:
                payload["text"] = body_text
            
            if reply_to:
                payload["reply_to"] = reply_to
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    RESEND_API_URL,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {RESEND_API_KEY}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    logger.info(f"Email envoyé avec succès à {to_email}, id: {data.get('id')}")
                    return True, None
                else:
                    error = f"Erreur Resend: {response.status_code} - {response.text}"
                    logger.error(error)
                    return False, error
                    
        except httpx.TimeoutException:
            error = "Timeout lors de l'envoi de l'email"
            logger.error(error)
            return False, error
        except Exception as e:
            error = f"Erreur d'envoi: {str(e)}"
            logger.error(error)
            return False, error
    
    async def send_email_async(
        self,
        to_email: str,
        subject: str,
        body_html: str,
        body_text: Optional[str] = None,
        reply_to: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """Alias pour send_email (déjà asynchrone)"""
        return await self.send_email(to_email, subject, body_html, body_text, reply_to)
    
    async def send_bulk_emails(
        self,
        recipients: List[Dict],
        subject: str,
        body_template: str,
        is_html: bool = True,
        delay_seconds: float = 0.5
    ) -> Dict:
        """
        Envoie des emails en masse avec personnalisation
        
        Args:
            recipients: Liste de dicts avec au minimum 'email'
            subject: Sujet (peut contenir {variables})
            body_template: Template du corps (peut contenir {variables})
            is_html: Si True, body_template est du HTML
            delay_seconds: Délai entre chaque envoi pour éviter le rate limiting
        
        Returns:
            Dict avec statistiques d'envoi
        """
        import asyncio
        
        stats = {
            'total': len(recipients),
            'sent': 0,
            'failed': 0,
            'errors': []
        }
        
        for recipient in recipients:
            email = recipient.get('email')
            if not email:
                stats['failed'] += 1
                stats['errors'].append({'email': None, 'error': 'Email manquant'})
                continue
            
            # Personnaliser le sujet et le corps
            personalized_subject = subject
            personalized_body = body_template
            
            for key, value in recipient.items():
                placeholder = '{' + key + '}'
                personalized_subject = personalized_subject.replace(placeholder, str(value or ''))
                personalized_body = personalized_body.replace(placeholder, str(value or ''))
            
            # Envoyer l'email
            if is_html:
                success, error = await self.send_email_async(
                    email, personalized_subject, personalized_body
                )
            else:
                success, error = await self.send_email_async(
                    email, personalized_subject, '', personalized_body
                )
            
            if success:
                stats['sent'] += 1
            else:
                stats['failed'] += 1
                stats['errors'].append({'email': email, 'error': error})
            
            # Délai pour éviter le rate limiting
            if delay_seconds > 0:
                await asyncio.sleep(delay_seconds)
        
        return stats
    
    # ==================== UTILITAIRES ====================
    
    def generate_contact_hash(self, contact: Dict) -> str:
        """Génère un hash unique pour un contact basé sur l'email"""
        email = contact.get('email', '').lower().strip()
        return hashlib.md5(email.encode()).hexdigest()
    
    def normalize_email(self, email: str) -> str:
        """Normalise un email (minuscules, suppression espaces)"""
        return email.strip().lower()
    
    def get_email_stats(self, emails: List[str]) -> Dict:
        """
        Retourne des statistiques sur une liste d'emails
        """
        validation_results = self.validate_emails_batch(emails)
        unique, duplicates = self.find_duplicates(emails)
        
        # Comptage par domaine
        domain_counts = {}
        for email in emails:
            if '@' in email:
                domain = email.split('@')[1].lower()
                domain_counts[domain] = domain_counts.get(domain, 0) + 1
        
        # Top 10 domaines
        top_domains = sorted(domain_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            'total': len(emails),
            'valid': len(validation_results['valid']),
            'invalid': len(validation_results['invalid']),
            'unique': len(unique),
            'duplicates': len(duplicates),
            'top_domains': top_domains,
            'invalid_details': [
                {'email': r.email, 'reason': r.error_message}
                for r in validation_results['invalid'][:20]  # Limiter à 20
            ]
        }


# Instance globale du service
cohesion_service = CohesionService()
