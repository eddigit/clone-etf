"""
Service de génération de bordereaux d'adhésion PDF
Utilise reportlab pour créer des documents professionnels
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime
from pathlib import Path
import os

class MembershipPDFGenerator:
    """Générateur de bordereau d'adhésion PDF"""
    
    # Montants par type d'adhésion
    MEMBERSHIP_AMOUNTS = {
        "individual": {"min": 10, "max": 50, "label": "Particuliers"},
        "professional": {"amount": 50, "label": "Commerçants - Artisans"},
        "professional_plus": {"amount": 152.32, "label": "Commerçants +100m²"},
        "association": {"amount": 152.32, "label": "Associations"}
    }
    
    def __init__(self, output_dir: str = "pdf_memberships"):
        """
        Initialise le générateur
        
        Args:
            output_dir: Répertoire de sortie des PDF
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Configure les styles personnalisés"""
        # Titre principal
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1e3a8a'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Sous-titre
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1e3a8a'),
            spaceAfter=12,
            fontName='Helvetica-Bold'
        ))
        
        # Texte normal justifié
        self.styles.add(ParagraphStyle(
            name='Justified',
            parent=self.styles['Normal'],
            alignment=TA_JUSTIFY,
            fontSize=10,
            leading=14
        ))
        
        # Texte en-tête
        self.styles.add(ParagraphStyle(
            name='Header',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#374151'),
            alignment=TA_CENTER
        ))
    
    def generate(self, membership_data: dict, membership_id: str) -> str:
        """
        Génère le bordereau d'adhésion PDF
        
        Args:
            membership_data: Données de l'adhésion
            membership_id: ID unique de l'adhésion
            
        Returns:
            Chemin du fichier PDF généré
        """
        filename = f"adhesion_{membership_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
        filepath = self.output_dir / filename
        
        # Créer le document
        doc = SimpleDocTemplate(
            str(filepath),
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        # Construire le contenu
        story = []
        story.extend(self._build_page1(membership_data))
        story.append(PageBreak())
        story.extend(self._build_page2())
        
        # Générer le PDF
        doc.build(story)
        
        return str(filepath)
    
    def _build_page1(self, data: dict) -> list:
        """Construit la page 1 du bordereau"""
        story = []
        
        # En-tête association
        header_text = """
        <b>EN TOUTE FRANCHISE - Région PACA</b><br/>
        1 rue François Boucher – 13700 MARIGNANE<br/>
        Tél : 06 09 78 09 53<br/>
        Email : assoentoutefranchise@sfr.fr
        """
        story.append(Paragraph(header_text, self.styles['Header']))
        story.append(Spacer(1, 1*cm))
        
        # Titre
        year = data.get('year', datetime.now().year)
        story.append(Paragraph(f"BULLETIN D'ADHÉSION {year}", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.5*cm))
        
        # Présentation de l'association
        intro_text = """
        <b>En Toute Franchise</b> est une association loi 1901 créée pour accompagner et défendre 
        les commerçants indépendants et franchisés de la région PACA. Nos objectifs principaux sont :
        """
        story.append(Paragraph(intro_text, self.styles['Justified']))
        story.append(Spacer(1, 0.3*cm))
        
        objectives = [
            "• Accompagner les commerçants dans leurs démarches administratives et juridiques",
            "• Informer sur les droits et obligations en matière de franchise",
            "• Favoriser les échanges d'expérience entre professionnels",
            "• Mettre en relation avec des avocats et experts spécialisés",
            "• Organiser des formations et événements de networking"
        ]
        
        for obj in objectives:
            story.append(Paragraph(obj, self.styles['Normal']))
        
        story.append(Spacer(1, 0.8*cm))
        
        # Type d'adhésion
        membership_type = data.get('membership_type', 'professional')
        amount = data.get('amount', 50)
        type_label = self.MEMBERSHIP_AMOUNTS.get(membership_type, {}).get('label', 'Adhésion')
        
        story.append(Paragraph(f"<b>Type d'adhésion : {type_label}</b>", self.styles['CustomSubtitle']))
        story.append(Paragraph(f"<b>Montant : {amount:.2f} €</b>", self.styles['Normal']))
        story.append(Spacer(1, 0.5*cm))
        
        # Informations du membre
        member_data = data.get('member_data', {})
        story.append(Paragraph("INFORMATIONS DU MEMBRE", self.styles['CustomSubtitle']))
        
        # Tableau des informations
        info_data = [
            ["Nom :", member_data.get('nom', '')],
            ["Prénom :", member_data.get('prenom', '')],
            ["Email :", member_data.get('email', '')],
            ["Téléphone :", member_data.get('telephone', '')],
        ]
        
        if member_data.get('fax'):
            info_data.append(["Fax :", member_data.get('fax', '')])
        
        info_data.extend([
            ["Adresse :", member_data.get('adresse_commerciale', '')],
            ["Code postal :", member_data.get('code_postal', '')],
            ["Ville :", member_data.get('ville', '')]
        ])
        
        # Informations professionnelles pour professional et professional_plus
        if membership_type in ['professional', 'professional_plus']:
            info_data.extend([
                ["", ""],  # Ligne vide
                ["<b>INFORMATIONS PROFESSIONNELLES</b>", ""],
                ["RCS :", member_data.get('rcs', '')],
                ["Type d'activité :", member_data.get('type_activite', '').capitalize()],
                ["Activité :", member_data.get('activite_detail', '')],
            ])
            
            if member_data.get('date_creation_commerce'):
                date_creation = member_data.get('date_creation_commerce')
                if isinstance(date_creation, str):
                    date_str = date_creation
                else:
                    date_str = date_creation.strftime('%d/%m/%Y')
                info_data.append(["Date de création :", date_str])
            
            if member_data.get('is_franchise'):
                info_data.extend([
                    ["Franchisé :", "Oui"],
                    ["Statut franchise :", member_data.get('franchise_status', '').capitalize()],
                    ["Enseigne :", member_data.get('enseigne', '')]
                ])
        
        # Informations pour associations
        if membership_type == 'association':
            info_data.extend([
                ["", ""],
                ["<b>INFORMATIONS ASSOCIATION</b>", ""],
                ["Nom de l'association :", member_data.get('nom_association', '')],
                ["SIRET :", member_data.get('siret', '')]
            ])
        
        table = Table(info_data, colWidths=[5*cm, 10*cm])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#374151')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 1*cm))
        
        # Signature
        signature_text = """
        Je soussigné(e), certifie l'exactitude des informations fournies et souhaite adhérer 
        à l'association En Toute Franchise pour l'année {year}.
        """.format(year=year)
        
        story.append(Paragraph(signature_text, self.styles['Justified']))
        story.append(Spacer(1, 0.8*cm))
        
        # Zones date et signature
        sig_data = [
            ["Fait à :", member_data.get('ville', '________________')],
            ["Le :", datetime.now().strftime('%d/%m/%Y')],
            ["", ""],
            ["Signature :", ""]
        ]
        
        sig_table = Table(sig_data, colWidths=[3*cm, 8*cm])
        sig_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -2), 5),
            ('BOTTOMPADDING', (0, -1), (-1, -1), 30),
        ]))
        
        story.append(sig_table)
        
        return story
    
    def _build_page2(self) -> list:
        """Construit la page 2 avec les droits fondamentaux"""
        story = []
        
        story.append(Paragraph("DROITS FONDAMENTAUX DES ADHÉRENTS", self.styles['CustomTitle']))
        story.append(Spacer(1, 0.5*cm))
        
        rights_text = """
        <b>Article 1 - Adhésion</b><br/>
        Toute personne physique ou morale exerçant une activité commerciale ou artisanale peut 
        adhérer à l'association En Toute Franchise, sous réserve de l'acceptation de son dossier 
        par le bureau. L'adhésion est valable pour l'année civile en cours.
        <br/><br/>
        
        <b>Article 2 - Droits des membres</b><br/>
        Les adhérents ont accès à :
        <br/>
        • Un accompagnement personnalisé dans leurs démarches administratives et juridiques
        <br/>
        • Des formations et ateliers thématiques
        <br/>
        • Un réseau de professionnels et d'experts (avocats, experts-comptables, consultants)
        <br/>
        • Une veille réglementaire et informative via la newsletter mensuelle
        <br/>
        • La participation aux assemblées générales avec droit de vote
        <br/><br/>
        
        <b>Article 3 - Obligations des membres</b><br/>
        Les adhérents s'engagent à :
        <br/>
        • Respecter les statuts et le règlement intérieur de l'association
        <br/>
        • S'acquitter de leur cotisation annuelle
        <br/>
        • Participer activement à la vie de l'association
        <br/>
        • Faire preuve de solidarité envers les autres membres
        <br/><br/>
        
        <b>Article 4 - Protection des données</b><br/>
        Conformément au RGPD, les données personnelles collectées sont utilisées uniquement dans 
        le cadre de la gestion de l'adhésion et des activités de l'association. Les membres disposent 
        d'un droit d'accès, de modification et de suppression de leurs données en contactant 
        l'association à : en.toutefranchise@wanadoo.fr
        <br/><br/>
        
        <b>Article 5 - Confidentialité</b><br/>
        Les échanges et informations partagés au sein de l'association restent confidentiels. 
        Les membres s'engagent à ne pas divulguer les informations sensibles dont ils pourraient 
        avoir connaissance dans le cadre des activités associatives.
        <br/><br/>
        
        <b>Article 6 - Résiliation</b><br/>
        La démission d'un membre doit être adressée par écrit au président de l'association. 
        Les cotisations versées restent acquises à l'association. Le bureau peut également prononcer 
        l'exclusion d'un membre en cas de manquement grave aux obligations statutaires.
        <br/><br/>
        
        <b>Article 7 - Responsabilité</b><br/>
        L'association décline toute responsabilité en cas de litige entre membres ou avec des tiers. 
        Elle agit en tant qu'intermédiaire et facilitateur, sans se substituer aux professionnels 
        du droit et du conseil.
        """
        
        story.append(Paragraph(rights_text, self.styles['Justified']))
        story.append(Spacer(1, 1*cm))
        
        # Zone tampon et signature
        story.append(Paragraph("<b>Cachet de l'association :</b>", self.styles['Normal']))
        story.append(Spacer(1, 2*cm))
        
        story.append(Paragraph("<b>Signature du président :</b>", self.styles['Normal']))
        story.append(Spacer(1, 1.5*cm))
        
        # Pied de page
        footer_text = """
        <i>En Toute Franchise - Association loi 1901<br/>
        1 rue François Boucher, 13700 MARIGNANE<br/>
        SIRET : [À compléter] - RNA : [À compléter]</i>
        """
        story.append(Paragraph(footer_text, self.styles['Header']))
        
        return story


def generate_membership_pdf(membership_data: dict, membership_id: str, output_dir: str = "pdf_memberships") -> str:
    """
    Fonction utilitaire pour générer un bordereau d'adhésion
    
    Args:
        membership_data: Données de l'adhésion (dict)
        membership_id: ID unique de l'adhésion
        output_dir: Répertoire de sortie
        
    Returns:
        Chemin du fichier PDF généré
    """
    generator = MembershipPDFGenerator(output_dir=output_dir)
    return generator.generate(membership_data, membership_id)
