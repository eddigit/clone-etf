"""
Agent de Test du Parcours Adhésion - En Toute Franchise
=======================================================
Cet agent simule le parcours complet d'un utilisateur qui veut:
1. Visiter le site
2. S'inscrire (créer un compte)
3. Se connecter
4. Naviguer vers la page d'adhésion
5. Choisir un type d'adhésion
6. Remplir le formulaire
7. Soumettre l'adhésion
8. Vérifier le PDF généré

Il audit toutes les erreurs rencontrées et génère un rapport détaillé.
"""

import asyncio
import aiohttp
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
import json
import uuid
import random
import string
import time
from urllib.parse import urljoin

logger = logging.getLogger(__name__)


class AuditSeverity(str, Enum):
    """Niveau de sévérité des problèmes détectés"""
    CRITICAL = "critical"      # Bloquant, empêche le parcours
    ERROR = "error"            # Erreur mais contournable
    WARNING = "warning"        # Problème potentiel
    INFO = "info"              # Information
    SUCCESS = "success"        # Succès


class TestPhase(str, Enum):
    """Phases du parcours utilisateur"""
    SITE_ACCESS = "site_access"
    REGISTRATION = "registration"
    LOGIN = "login"
    NAVIGATION = "navigation"
    ADHESION_CHOICE = "adhesion_choice"
    FORM_FILLING = "form_filling"
    FORM_SUBMISSION = "form_submission"
    PAYMENT_REDIRECT = "payment_redirect"
    PDF_VERIFICATION = "pdf_verification"
    PROFILE_CHECK = "profile_check"
    CLEANUP = "cleanup"


@dataclass
class AuditIssue:
    """Représente un problème détecté lors de l'audit"""
    severity: AuditSeverity
    phase: TestPhase
    title: str
    description: str
    endpoint: Optional[str] = None
    http_status: Optional[int] = None
    expected_status: Optional[int] = None
    response_data: Optional[Any] = None
    suggestion: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    
    def to_dict(self) -> dict:
        return {
            "severity": self.severity.value,
            "phase": self.phase.value,
            "title": self.title,
            "description": self.description,
            "endpoint": self.endpoint,
            "http_status": self.http_status,
            "expected_status": self.expected_status,
            "response_data": self.response_data,
            "suggestion": self.suggestion,
            "timestamp": self.timestamp
        }


@dataclass
class PhaseResult:
    """Résultat d'une phase de test"""
    phase: TestPhase
    name: str
    description: str
    success: bool
    duration_ms: float
    issues: List[AuditIssue] = field(default_factory=list)
    details: Dict[str, Any] = field(default_factory=dict)
    started_at: str = ""
    completed_at: str = ""
    
    def to_dict(self) -> dict:
        return {
            "phase": self.phase.value,
            "name": self.name,
            "description": self.description,
            "success": self.success,
            "duration_ms": self.duration_ms,
            "issues": [i.to_dict() for i in self.issues],
            "details": self.details,
            "started_at": self.started_at,
            "completed_at": self.completed_at
        }


@dataclass  
class AdhesionTestReport:
    """Rapport complet du test du parcours adhésion"""
    id: str
    started_at: str
    completed_at: Optional[str] = None
    environment: str = "development"
    api_base_url: str = ""
    frontend_url: str = ""
    
    # Résultats
    overall_success: bool = False
    total_phases: int = 0
    passed_phases: int = 0
    failed_phases: int = 0
    
    # Données de test
    test_user_email: Optional[str] = None
    test_user_id: Optional[str] = None
    test_membership_id: Optional[str] = None
    test_membership_type: Optional[str] = None
    
    # Phases et issues
    phases: List[PhaseResult] = field(default_factory=list)
    all_issues: List[AuditIssue] = field(default_factory=list)
    
    # Statistiques
    total_duration_ms: float = 0
    critical_issues: int = 0
    errors: int = 0
    warnings: int = 0
    
    # Résumé
    summary: str = ""
    recommendations: List[str] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "environment": self.environment,
            "api_base_url": self.api_base_url,
            "frontend_url": self.frontend_url,
            "overall_success": self.overall_success,
            "total_phases": self.total_phases,
            "passed_phases": self.passed_phases,
            "failed_phases": self.failed_phases,
            "test_user_email": self.test_user_email,
            "test_user_id": self.test_user_id,
            "test_membership_id": self.test_membership_id,
            "test_membership_type": self.test_membership_type,
            "phases": [p.to_dict() for p in self.phases],
            "all_issues": [i.to_dict() for i in self.all_issues],
            "total_duration_ms": self.total_duration_ms,
            "critical_issues": self.critical_issues,
            "errors": self.errors,
            "warnings": self.warnings,
            "summary": self.summary,
            "recommendations": self.recommendations
        }


class AdhesionTestAgent:
    """
    Agent de test automatisé pour le parcours d'adhésion
    Simule un utilisateur réel qui souhaite adhérer à l'association
    """
    
    # Types d'adhésion à tester
    MEMBERSHIP_TYPES = {
        "individual": {
            "label": "Particuliers",
            "min_amount": 10,
            "max_amount": 50,
            "test_amount": 15
        },
        "professional": {
            "label": "Commerçants - Artisans",
            "amount": 50
        },
        "professional_plus": {
            "label": "Commerçants +100m²",
            "amount": 152.32
        },
        "association": {
            "label": "Associations",
            "amount": 152.32
        }
    }
    
    def __init__(
        self,
        api_base_url: str,
        frontend_url: Optional[str] = None,
        membership_type: str = "individual",
        cleanup_after: bool = True
    ):
        self.api_base_url = api_base_url.rstrip('/')
        self.frontend_url = frontend_url or "http://localhost:3000"
        self.membership_type = membership_type
        self.cleanup_after = cleanup_after
        
        self.session: Optional[aiohttp.ClientSession] = None
        self.report: Optional[AdhesionTestReport] = None
        
        # Données utilisateur de test
        self.test_user_email: Optional[str] = None
        self.test_user_password: Optional[str] = None
        self.test_user_token: Optional[str] = None
        self.test_user_id: Optional[str] = None
        self.test_membership_id: Optional[str] = None
    
    def _generate_test_email(self) -> str:
        """Génère un email unique pour le test"""
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
        timestamp = int(time.time())
        return f"test_adhesion_{timestamp}_{random_suffix}@test-etf.com"
    
    def _generate_test_password(self) -> str:
        """Génère un mot de passe sécurisé"""
        return f"TestAdhesion2026!{uuid.uuid4().hex[:8]}"
    
    def _generate_test_member_data(self) -> dict:
        """Génère des données de membre fictives pour le test"""
        random_id = ''.join(random.choices(string.digits, k=6))
        
        base_data = {
            "nom": f"TestNom{random_id}",
            "prenom": f"TestPrenom{random_id}",
            "email": self.test_user_email,
            "telephone": f"06{random_id}1234",
            "adresse_commerciale": f"{random_id} Rue du Test",
            "code_postal": "75001",
            "ville": "Paris"
        }
        
        if self.membership_type in ["professional", "professional_plus"]:
            base_data.update({
                "rcs": f"RCS PARIS {random_id}",
                "type_activite": "Commerce",
                "activite_detail": "Commerce de détail alimentaire",
                "date_creation_commerce": "2020-01-15",
                "is_franchise": True,
                "franchise_status": "franchisé",
                "enseigne": "Enseigne Test"
            })
        elif self.membership_type == "association":
            base_data.update({
                "nom_association": f"Association Test {random_id}",
                "siret": f"12345678{random_id}"
            })
        
        return base_data
    
    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        headers: Optional[Dict] = None,
        expected_status: int = 200,
        timeout: int = 30
    ) -> Tuple[bool, Any, Optional[int], str]:
        """
        Effectue une requête HTTP
        Retourne (success, response_data, status_code, error_message)
        """
        url = f"{self.api_base_url}{endpoint}"
        request_headers = headers or {}
        request_headers["Content-Type"] = "application/json"
        
        if self.test_user_token and 'Authorization' not in request_headers:
            request_headers['Authorization'] = f"Bearer {self.test_user_token}"
        
        try:
            async with self.session.request(
                method, url, json=data, headers=request_headers,
                timeout=aiohttp.ClientTimeout(total=timeout)
            ) as response:
                status_code = response.status
                
                try:
                    response_data = await response.json()
                except:
                    response_data = await response.text()
                
                if status_code == expected_status:
                    return True, response_data, status_code, ""
                else:
                    error_msg = f"HTTP {status_code}: {response_data}"
                    return False, response_data, status_code, error_msg
                    
        except asyncio.TimeoutError:
            return False, None, None, f"Timeout après {timeout}s"
        except aiohttp.ClientError as e:
            return False, None, None, f"Erreur connexion: {str(e)}"
        except Exception as e:
            return False, None, None, f"Erreur inattendue: {str(e)}"
    
    def _add_issue(
        self,
        phase: TestPhase,
        severity: AuditSeverity,
        title: str,
        description: str,
        **kwargs
    ) -> AuditIssue:
        """Ajoute un problème au rapport"""
        issue = AuditIssue(
            severity=severity,
            phase=phase,
            title=title,
            description=description,
            **kwargs
        )
        self.report.all_issues.append(issue)
        
        # Mettre à jour les compteurs
        if severity == AuditSeverity.CRITICAL:
            self.report.critical_issues += 1
        elif severity == AuditSeverity.ERROR:
            self.report.errors += 1
        elif severity == AuditSeverity.WARNING:
            self.report.warnings += 1
            
        return issue
    
    async def _run_phase(
        self,
        phase: TestPhase,
        name: str,
        description: str,
        test_func
    ) -> PhaseResult:
        """Exécute une phase de test"""
        result = PhaseResult(
            phase=phase,
            name=name,
            description=description,
            success=False,
            duration_ms=0,
            started_at=datetime.utcnow().isoformat()
        )
        
        start_time = time.time()
        
        try:
            success, details = await test_func()
            result.success = success
            result.details = details or {}
            
            if not success:
                # Récupérer les issues de cette phase
                result.issues = [
                    i for i in self.report.all_issues 
                    if i.phase == phase
                ]
                
        except Exception as e:
            result.success = False
            result.details = {"exception": str(e)}
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.CRITICAL,
                title=f"Exception lors de {name}",
                description=str(e),
                suggestion="Vérifier les logs du serveur pour plus de détails"
            )
            logger.exception(f"Exception during phase {phase}: {e}")
        
        result.duration_ms = (time.time() - start_time) * 1000
        result.completed_at = datetime.utcnow().isoformat()
        
        # Ajouter au rapport
        self.report.phases.append(result)
        if result.success:
            self.report.passed_phases += 1
        else:
            self.report.failed_phases += 1
        
        return result
    
    # ===================== PHASES DE TEST =====================
    
    async def phase_site_access(self) -> Tuple[bool, dict]:
        """Phase 1: Vérifier l'accès au site (API health check)"""
        phase = TestPhase.SITE_ACCESS
        details = {}
        
        # Test 1: Health check API
        success, data, status, error = await self._make_request("GET", "/api/health")
        details["health_check"] = {"success": success, "status": status}
        
        if not success:
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.CRITICAL,
                title="API inaccessible",
                description=f"Impossible d'accéder à l'API: {error}",
                endpoint="/api/health",
                http_status=status,
                expected_status=200,
                suggestion="Vérifier que le serveur backend est démarré et accessible"
            )
            return False, details
        
        # Test 2: Vérifier les endpoints publics
        public_endpoints = [
            ("/api/articles", "Articles du blog"),
            # Note: /api/cases nécessite une authentification
        ]
        
        for endpoint, name in public_endpoints:
            success, data, status, error = await self._make_request("GET", endpoint)
            details[endpoint] = {"success": success, "status": status}
            
            if not success:
                self._add_issue(
                    phase=phase,
                    severity=AuditSeverity.WARNING,
                    title=f"Endpoint {name} inaccessible",
                    description=f"Le endpoint {endpoint} retourne une erreur",
                    endpoint=endpoint,
                    http_status=status,
                    expected_status=200
                )
        
        return True, details
    
    async def phase_registration(self) -> Tuple[bool, dict]:
        """Phase 2: Créer un compte utilisateur"""
        phase = TestPhase.REGISTRATION
        details = {}
        
        self.test_user_email = self._generate_test_email()
        self.test_user_password = self._generate_test_password()
        
        user_data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "firstName": "AgentTest",
            "lastName": "Adhesion",
            "phone": "0600000000"
        }
        
        details["user_data"] = {
            "email": self.test_user_email,
            "firstName": user_data["firstName"],
            "lastName": user_data["lastName"]
        }
        
        success, data, status, error = await self._make_request(
            "POST", "/api/auth/register", data=user_data
        )
        
        details["registration_response"] = {"success": success, "status": status}
        
        if not success:
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.CRITICAL,
                title="Échec de l'inscription",
                description=f"Impossible de créer un compte: {error}",
                endpoint="/api/auth/register",
                http_status=status,
                expected_status=200,
                response_data=data,
                suggestion="Vérifier la validation des données d'inscription et les messages d'erreur"
            )
            return False, details
        
        # Vérifier le message de succès
        if isinstance(data, dict):
            details["registration_message"] = data.get("message", "")
        
        self.report.test_user_email = self.test_user_email
        
        return True, details
    
    async def phase_login(self) -> Tuple[bool, dict]:
        """Phase 3: Connexion au compte"""
        phase = TestPhase.LOGIN
        details = {}
        
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        success, data, status, error = await self._make_request(
            "POST", "/api/auth/login", data=login_data
        )
        
        details["login_response"] = {"success": success, "status": status}
        
        if not success:
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.CRITICAL,
                title="Échec de la connexion",
                description=f"Impossible de se connecter après inscription: {error}",
                endpoint="/api/auth/login",
                http_status=status,
                expected_status=200,
                response_data=data,
                suggestion="Vérifier la cohérence entre inscription et connexion"
            )
            return False, details
        
        # Extraire le token
        if isinstance(data, dict):
            self.test_user_token = data.get("token") or data.get("access_token")
            user_info = data.get("user", {})
            self.test_user_id = user_info.get("id")
            
            details["user_info"] = {
                "id": self.test_user_id,
                "email": user_info.get("email"),
                "role": user_info.get("role")
            }
            
            self.report.test_user_id = self.test_user_id
        
        if not self.test_user_token:
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.ERROR,
                title="Token non reçu",
                description="La connexion a réussi mais aucun token n'a été retourné",
                endpoint="/api/auth/login",
                response_data=data,
                suggestion="Vérifier le format de la réponse de login"
            )
            return False, details
        
        return True, details
    
    async def phase_navigation(self) -> Tuple[bool, dict]:
        """Phase 4: Navigation et vérification du profil"""
        phase = TestPhase.NAVIGATION
        details = {}
        
        # Test 1: Accéder au profil
        success, data, status, error = await self._make_request("GET", "/api/users/profile")
        details["profile_access"] = {"success": success, "status": status}
        
        if not success:
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.ERROR,
                title="Profil inaccessible",
                description=f"Impossible d'accéder au profil utilisateur: {error}",
                endpoint="/api/users/profile",
                http_status=status,
                expected_status=200,
                suggestion="Vérifier l'authentification et les permissions"
            )
        else:
            details["profile_data"] = {
                "email": data.get("email") if isinstance(data, dict) else None,
                "hasMembership": data.get("isMember", False) if isinstance(data, dict) else False
            }
        
        # Test 2: Vérifier le statut d'adhésion (devrait être vide)
        success, data, status, error = await self._make_request("GET", "/api/memberships/me")
        details["membership_status"] = {"success": success, "status": status}
        
        if success:
            memberships = data if isinstance(data, list) else []
            details["existing_memberships"] = len(memberships)
            
            if len(memberships) > 0:
                self._add_issue(
                    phase=phase,
                    severity=AuditSeverity.WARNING,
                    title="Adhésions existantes",
                    description=f"L'utilisateur test a déjà {len(memberships)} adhésion(s)",
                    suggestion="Vérifier le nettoyage des données de test"
                )
        
        return True, details
    
    async def phase_adhesion_choice(self) -> Tuple[bool, dict]:
        """Phase 5: Simuler le choix d'un type d'adhésion"""
        phase = TestPhase.ADHESION_CHOICE
        details = {}
        
        # Récupérer les infos sur le type choisi
        type_info = self.MEMBERSHIP_TYPES.get(self.membership_type)
        
        if not type_info:
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.ERROR,
                title="Type d'adhésion invalide",
                description=f"Le type '{self.membership_type}' n'est pas reconnu",
                suggestion=f"Types valides: {list(self.MEMBERSHIP_TYPES.keys())}"
            )
            return False, details
        
        details["selected_type"] = {
            "type": self.membership_type,
            "label": type_info["label"],
            "amount": type_info.get("amount") or type_info.get("test_amount")
        }
        
        self.report.test_membership_type = self.membership_type
        
        # Vérifier que les ressources nécessaires sont accessibles
        # (Cette phase simule l'affichage de la page d'adhésion)
        
        return True, details
    
    async def phase_form_filling(self) -> Tuple[bool, dict]:
        """Phase 6: Remplir le formulaire d'adhésion"""
        phase = TestPhase.FORM_FILLING
        details = {}
        
        # Générer les données de test
        member_data = self._generate_test_member_data()
        details["member_data"] = {
            "nom": member_data["nom"],
            "prenom": member_data["prenom"],
            "ville": member_data["ville"],
            "type": self.membership_type
        }
        
        # Valider les données localement (simulation de la validation frontend)
        validations = []
        
        # Validation email
        if "@" not in member_data["email"]:
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.ERROR,
                title="Email invalide",
                description="L'email de test n'a pas le bon format",
                suggestion="Vérifier la génération de l'email de test"
            )
            validations.append({"field": "email", "valid": False})
        else:
            validations.append({"field": "email", "valid": True})
        
        # Validation code postal
        if not member_data["code_postal"].isdigit() or len(member_data["code_postal"]) != 5:
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.WARNING,
                title="Code postal mal formaté",
                description="Le code postal doit être composé de 5 chiffres",
                suggestion="Améliorer la validation côté frontend"
            )
            validations.append({"field": "code_postal", "valid": False})
        else:
            validations.append({"field": "code_postal", "valid": True})
        
        details["validations"] = validations
        details["all_fields_valid"] = all(v["valid"] for v in validations)
        
        # Stocker pour la phase suivante
        self._pending_member_data = member_data
        
        return True, details
    
    async def phase_form_submission(self) -> Tuple[bool, dict]:
        """Phase 7: Soumettre le formulaire d'adhésion"""
        phase = TestPhase.FORM_SUBMISSION
        details = {}
        
        # Préparer les données
        type_info = self.MEMBERSHIP_TYPES.get(self.membership_type)
        amount = type_info.get("amount") or type_info.get("test_amount", 10)
        
        payload = {
            "membership_type": self.membership_type,
            "amount": amount,
            "member_data": self._pending_member_data
        }
        
        details["submission_payload"] = {
            "membership_type": self.membership_type,
            "amount": amount,
            "member_name": f"{self._pending_member_data['prenom']} {self._pending_member_data['nom']}"
        }
        
        # Mesurer le temps de réponse
        start_time = time.time()
        
        success, data, status, error = await self._make_request(
            "POST", "/api/memberships", data=payload, timeout=60
        )
        
        response_time = (time.time() - start_time) * 1000
        details["response_time_ms"] = response_time
        
        if response_time > 5000:
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.WARNING,
                title="Temps de réponse lent",
                description=f"La création d'adhésion a pris {response_time:.0f}ms (> 5000ms)",
                endpoint="/api/memberships",
                suggestion="Optimiser la génération du PDF ou utiliser un traitement async"
            )
        
        details["submission_response"] = {"success": success, "status": status}
        
        if not success:
            # Analyser l'erreur
            error_detail = ""
            if isinstance(data, dict):
                error_detail = data.get("detail", str(data))
            else:
                error_detail = str(data)
            
            severity = AuditSeverity.CRITICAL
            suggestion = "Vérifier les logs du serveur"
            
            # Erreurs courantes
            if "déjà une adhésion" in error_detail.lower():
                severity = AuditSeverity.WARNING
                suggestion = "L'utilisateur a déjà une adhésion pour cette année"
            elif status == 401:
                suggestion = "Vérifier que le token est valide et non expiré"
            elif status == 422:
                suggestion = "Vérifier le format des données envoyées"
            
            self._add_issue(
                phase=phase,
                severity=severity,
                title="Échec création adhésion",
                description=f"Erreur lors de la soumission: {error_detail}",
                endpoint="/api/memberships",
                http_status=status,
                expected_status=200,
                response_data=data,
                suggestion=suggestion
            )
            return False, details
        
        # Extraire les infos de l'adhésion créée
        if isinstance(data, dict):
            self.test_membership_id = data.get("id")
            details["membership_created"] = {
                "id": self.test_membership_id,
                "status": data.get("status"),
                "amount": data.get("amount"),
                "pdf_available": data.get("pdf_available", False)
            }
            
            self.report.test_membership_id = self.test_membership_id
            
            if not data.get("pdf_available"):
                self._add_issue(
                    phase=phase,
                    severity=AuditSeverity.WARNING,
                    title="PDF non disponible",
                    description="L'adhésion a été créée mais le PDF n'est pas disponible",
                    suggestion="Vérifier la génération du PDF (reportlab installé?)"
                )
        
        return True, details
    
    async def phase_pdf_verification(self) -> Tuple[bool, dict]:
        """Phase 8: Vérifier la disponibilité du PDF"""
        phase = TestPhase.PDF_VERIFICATION
        details = {}
        
        if not self.test_membership_id:
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.ERROR,
                title="ID adhésion manquant",
                description="Impossible de vérifier le PDF sans ID d'adhésion",
                suggestion="La phase précédente a probablement échoué"
            )
            return False, details
        
        # Tenter de récupérer le PDF
        endpoint = f"/api/memberships/{self.test_membership_id}/pdf"
        
        try:
            url = f"{self.api_base_url}{endpoint}"
            headers = {"Authorization": f"Bearer {self.test_user_token}"}
            
            async with self.session.get(url, headers=headers) as response:
                status = response.status
                content_type = response.headers.get("Content-Type", "")
                
                details["pdf_request"] = {
                    "status": status,
                    "content_type": content_type
                }
                
                if status == 200:
                    if "application/pdf" in content_type:
                        # Lire quelques bytes pour vérifier
                        content = await response.read()
                        details["pdf_size_bytes"] = len(content)
                        
                        # Vérifier le header PDF
                        if content.startswith(b'%PDF'):
                            details["pdf_valid"] = True
                            return True, details
                        else:
                            self._add_issue(
                                phase=phase,
                                severity=AuditSeverity.ERROR,
                                title="PDF invalide",
                                description="Le fichier retourné n'est pas un PDF valide",
                                endpoint=endpoint,
                                suggestion="Vérifier la génération du PDF"
                            )
                            return False, details
                    else:
                        self._add_issue(
                            phase=phase,
                            severity=AuditSeverity.WARNING,
                            title="Content-Type incorrect",
                            description=f"Content-Type attendu: application/pdf, reçu: {content_type}",
                            endpoint=endpoint
                        )
                elif status == 404:
                    self._add_issue(
                        phase=phase,
                        severity=AuditSeverity.ERROR,
                        title="PDF non trouvé",
                        description="Le PDF n'a pas été généré ou le fichier est manquant",
                        endpoint=endpoint,
                        http_status=status,
                        suggestion="Vérifier que reportlab est installé et que le dossier pdf_memberships existe"
                    )
                    return False, details
                else:
                    self._add_issue(
                        phase=phase,
                        severity=AuditSeverity.ERROR,
                        title="Erreur récupération PDF",
                        description=f"HTTP {status} lors de la récupération du PDF",
                        endpoint=endpoint,
                        http_status=status
                    )
                    return False, details
                    
        except Exception as e:
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.ERROR,
                title="Exception PDF",
                description=str(e),
                endpoint=endpoint
            )
            return False, details
        
        return True, details
    
    async def phase_profile_check(self) -> Tuple[bool, dict]:
        """Phase 9: Vérifier que l'adhésion apparaît dans le profil"""
        phase = TestPhase.PROFILE_CHECK
        details = {}
        
        # Récupérer les adhésions
        success, data, status, error = await self._make_request("GET", "/api/memberships/me")
        
        details["memberships_fetch"] = {"success": success, "status": status}
        
        if not success:
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.ERROR,
                title="Erreur récupération adhésions",
                description=error,
                endpoint="/api/memberships/me",
                http_status=status
            )
            return False, details
        
        memberships = data if isinstance(data, list) else []
        details["membership_count"] = len(memberships)
        
        # Chercher notre adhésion
        our_membership = None
        for m in memberships:
            if m.get("id") == self.test_membership_id:
                our_membership = m
                break
        
        if not our_membership:
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.ERROR,
                title="Adhésion non trouvée",
                description=f"L'adhésion {self.test_membership_id} n'apparaît pas dans la liste",
                suggestion="Vérifier la cohérence des données en base"
            )
            return False, details
        
        details["found_membership"] = {
            "id": our_membership.get("id"),
            "status": our_membership.get("status"),
            "year": our_membership.get("year"),
            "type": our_membership.get("membership_type")
        }
        
        # Vérifier le statut
        if our_membership.get("status") != "pending":
            self._add_issue(
                phase=phase,
                severity=AuditSeverity.INFO,
                title="Statut adhésion",
                description=f"Statut: {our_membership.get('status')} (attendu: pending)"
            )
        
        return True, details
    
    async def phase_cleanup(self) -> Tuple[bool, dict]:
        """Phase 10: Nettoyage des données de test"""
        phase = TestPhase.CLEANUP
        details = {"cleanup_requested": self.cleanup_after}
        
        if not self.cleanup_after:
            details["message"] = "Nettoyage désactivé, données conservées"
            return True, details
        
        # Le nettoyage sera fait par le serveur avec accès direct à la DB
        details["message"] = "Nettoyage prévu par le serveur"
        details["items_to_cleanup"] = {
            "user_email": self.test_user_email,
            "membership_id": self.test_membership_id
        }
        
        return True, details
    
    # ===================== EXÉCUTION PRINCIPALE =====================
    
    async def run_full_test(self) -> AdhesionTestReport:
        """Exécute le test complet du parcours adhésion"""
        
        # Initialiser le rapport
        self.report = AdhesionTestReport(
            id=str(uuid.uuid4()),
            started_at=datetime.utcnow().isoformat(),
            api_base_url=self.api_base_url,
            frontend_url=self.frontend_url,
            environment="production" if "render.com" in self.api_base_url else "development"
        )
        
        # Définir les phases
        phases = [
            (TestPhase.SITE_ACCESS, "Accès au site", "Vérification de l'accessibilité de l'API", self.phase_site_access),
            (TestPhase.REGISTRATION, "Inscription", "Création d'un compte utilisateur", self.phase_registration),
            (TestPhase.LOGIN, "Connexion", "Authentification de l'utilisateur", self.phase_login),
            (TestPhase.NAVIGATION, "Navigation", "Accès au profil et vérification pré-adhésion", self.phase_navigation),
            (TestPhase.ADHESION_CHOICE, "Choix adhésion", f"Sélection du type: {self.membership_type}", self.phase_adhesion_choice),
            (TestPhase.FORM_FILLING, "Formulaire", "Remplissage des données d'adhésion", self.phase_form_filling),
            (TestPhase.FORM_SUBMISSION, "Soumission", "Envoi du formulaire d'adhésion", self.phase_form_submission),
            (TestPhase.PDF_VERIFICATION, "PDF", "Vérification du bordereau PDF", self.phase_pdf_verification),
            (TestPhase.PROFILE_CHECK, "Vérification", "Contrôle de l'adhésion dans le profil", self.phase_profile_check),
            (TestPhase.CLEANUP, "Nettoyage", "Suppression des données de test", self.phase_cleanup),
        ]
        
        self.report.total_phases = len(phases)
        
        # Créer la session HTTP
        connector = aiohttp.TCPConnector(ssl=False)
        self.session = aiohttp.ClientSession(connector=connector)
        
        try:
            for phase, name, description, test_func in phases:
                result = await self._run_phase(phase, name, description, test_func)
                
                # Si une phase critique échoue, on peut s'arrêter
                critical_phases = [TestPhase.SITE_ACCESS, TestPhase.REGISTRATION, TestPhase.LOGIN]
                if not result.success and phase in critical_phases:
                    logger.warning(f"Phase critique '{name}' échouée, arrêt des tests")
                    
                    # Marquer les phases restantes comme non exécutées
                    remaining_phases = phases[phases.index((phase, name, description, test_func)) + 1:]
                    for rp, rn, rd, _ in remaining_phases:
                        skipped = PhaseResult(
                            phase=rp,
                            name=rn,
                            description=rd,
                            success=False,
                            duration_ms=0,
                            details={"skipped": True, "reason": f"Phase {name} a échoué"}
                        )
                        self.report.phases.append(skipped)
                        self.report.failed_phases += 1
                    break
                    
        finally:
            await self.session.close()
        
        # Finaliser le rapport
        self.report.completed_at = datetime.utcnow().isoformat()
        self.report.total_duration_ms = sum(p.duration_ms for p in self.report.phases)
        
        # Déterminer le succès global
        self.report.overall_success = (
            self.report.failed_phases == 0 and 
            self.report.critical_issues == 0
        )
        
        # Générer le résumé
        self._generate_summary()
        
        return self.report
    
    def _generate_summary(self):
        """Génère le résumé et les recommandations"""
        if self.report.overall_success:
            self.report.summary = (
                f"✅ Parcours adhésion réussi! {self.report.passed_phases}/{self.report.total_phases} phases OK. "
                f"Type testé: {self.membership_type}. Durée: {self.report.total_duration_ms:.0f}ms"
            )
        else:
            self.report.summary = (
                f"❌ Échec du parcours adhésion. {self.report.failed_phases} phase(s) en erreur. "
                f"Problèmes critiques: {self.report.critical_issues}, Erreurs: {self.report.errors}, "
                f"Avertissements: {self.report.warnings}"
            )
        
        # Générer les recommandations basées sur les issues
        recommendations = set()
        
        for issue in self.report.all_issues:
            if issue.suggestion:
                recommendations.add(issue.suggestion)
            
            # Recommandations génériques basées sur les types d'erreurs
            if issue.severity == AuditSeverity.CRITICAL:
                if "API" in issue.title or "inaccessible" in issue.description.lower():
                    recommendations.add("Vérifier le déploiement et la configuration du serveur backend")
                if "inscription" in issue.title.lower() or "register" in str(issue.endpoint).lower():
                    recommendations.add("Tester manuellement le formulaire d'inscription")
            
            if issue.http_status == 500:
                recommendations.add("Consulter les logs du serveur pour identifier l'erreur interne")
            
            if issue.http_status == 422:
                recommendations.add("Vérifier le format des données envoyées (validation Pydantic)")
        
        self.report.recommendations = list(recommendations)


# ===================== CACHE DES RAPPORTS =====================
adhesion_test_reports_cache: Dict[str, dict] = {}


async def run_adhesion_test_agent(
    api_base_url: str,
    frontend_url: Optional[str] = None,
    membership_type: str = "individual",
    cleanup: bool = True
) -> dict:
    """
    Lance l'agent de test du parcours adhésion
    
    Args:
        api_base_url: URL de base de l'API
        frontend_url: URL du frontend (optionnel)
        membership_type: Type d'adhésion à tester (individual, professional, professional_plus, association)
        cleanup: Si True, supprime les données de test après
    
    Returns:
        Rapport de test complet
    """
    agent = AdhesionTestAgent(
        api_base_url=api_base_url,
        frontend_url=frontend_url,
        membership_type=membership_type,
        cleanup_after=cleanup
    )
    
    report = await agent.run_full_test()
    report_dict = report.to_dict()
    
    # Stocker le rapport
    adhesion_test_reports_cache[report.id] = report_dict
    
    # Garder les 50 derniers rapports
    if len(adhesion_test_reports_cache) > 50:
        oldest_key = min(
            adhesion_test_reports_cache.keys(),
            key=lambda k: adhesion_test_reports_cache[k]['started_at']
        )
        del adhesion_test_reports_cache[oldest_key]
    
    return report_dict


def get_all_adhesion_test_reports() -> List[dict]:
    """Récupère tous les rapports de test adhésion"""
    return sorted(
        adhesion_test_reports_cache.values(),
        key=lambda r: r['started_at'],
        reverse=True
    )


def get_adhesion_test_report(report_id: str) -> Optional[dict]:
    """Récupère un rapport spécifique"""
    return adhesion_test_reports_cache.get(report_id)


# ===================== EXÉCUTION STANDALONE =====================
if __name__ == "__main__":
    import sys
    
    async def main():
        api_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8001"
        membership_type = sys.argv[2] if len(sys.argv) > 2 else "individual"
        
        print(f"\n🤖 Agent de Test du Parcours Adhésion")
        print(f"{'='*50}")
        print(f"API: {api_url}")
        print(f"Type: {membership_type}")
        print(f"{'='*50}\n")
        
        report = await run_adhesion_test_agent(
            api_base_url=api_url,
            membership_type=membership_type,
            cleanup=True
        )
        
        print(f"\n📊 RÉSULTAT: {report['summary']}")
        print(f"\n📋 Phases:")
        for phase in report['phases']:
            status = "✅" if phase['success'] else "❌"
            print(f"  {status} {phase['name']}: {phase['description']} ({phase['duration_ms']:.0f}ms)")
        
        if report['all_issues']:
            print(f"\n⚠️ Problèmes détectés ({len(report['all_issues'])}):")
            for issue in report['all_issues']:
                icon = {"critical": "🔴", "error": "🟠", "warning": "🟡", "info": "🔵"}.get(issue['severity'], "⚪")
                print(f"  {icon} [{issue['phase']}] {issue['title']}")
                print(f"     {issue['description']}")
                if issue.get('suggestion'):
                    print(f"     💡 {issue['suggestion']}")
        
        if report['recommendations']:
            print(f"\n💡 Recommandations:")
            for rec in report['recommendations']:
                print(f"  • {rec}")
        
        print(f"\n📊 Statistiques:")
        print(f"  • Durée totale: {report['total_duration_ms']:.0f}ms")
        print(f"  • Phases: {report['passed_phases']}/{report['total_phases']} réussies")
        print(f"  • Critiques: {report['critical_issues']}, Erreurs: {report['errors']}, Avertissements: {report['warnings']}")
    
    asyncio.run(main())
