"""
Routes API pour le module Cohésion
Gestion des contacts et campagnes d'emails
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query, BackgroundTasks
from typing import Optional, List
from datetime import datetime
import logging

from models import (
    CohesionContact, CohesionContactCreate, CohesionContactUpdate,
    CohesionCampaign, CohesionCampaignCreate, CohesionCampaignUpdate,
    CohesionEmailLog, CohesionImportResult, CohesionStats,
    CohesionCategory, CohesionCategoryCreate, CohesionCategoryUpdate
)
from cohesion_service import cohesion_service

logger = logging.getLogger(__name__)


def create_cohesion_router(db, get_current_admin_user):
    """
    Crée le routeur pour les routes cohésion
    
    Args:
        db: Instance de la base de données MongoDB
        get_current_admin_user: Dépendance pour vérifier l'admin
    """
    router = APIRouter(prefix="/cohesion", tags=["Cohésion"])
    
    # ==================== CONTACTS ====================
    
    @router.get("/contacts", response_model=dict)
    async def get_contacts(
        page: int = Query(1, ge=1),
        limit: int = Query(50, ge=1, le=200),
        search: Optional[str] = None,
        status: Optional[str] = None,
        tags: Optional[str] = None,
        categoryId: Optional[str] = None,
        hasCategory: Optional[str] = None,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Récupère la liste des contacts avec pagination et filtres"""
        query = {}
        and_conditions = []
        
        if search:
            and_conditions.append({
                "$or": [
                    {"email": {"$regex": search, "$options": "i"}},
                    {"firstName": {"$regex": search, "$options": "i"}},
                    {"lastName": {"$regex": search, "$options": "i"}},
                    {"company": {"$regex": search, "$options": "i"}}
                ]
            })
        
        if status:
            query["status"] = status
        
        if tags:
            tag_list = [t.strip() for t in tags.split(",")]
            query["tags"] = {"$in": tag_list}
        
        if categoryId:
            query["categoryId"] = categoryId
        # Filtrer par présence/absence de catégorie
        elif hasCategory is not None:
            if hasCategory.lower() == 'false':
                # Contacts sans catégorie
                and_conditions.append({
                    "$or": [
                        {"categoryId": None}, 
                        {"categoryId": {"$exists": False}},
                        {"categoryId": ""}
                    ]
                })
            elif hasCategory.lower() == 'true':
                query["categoryId"] = {"$nin": [None, ""]}
        
        # Combiner les conditions AND si nécessaire
        if and_conditions:
            if len(and_conditions) == 1:
                query.update(and_conditions[0])
            else:
                query["$and"] = and_conditions
        
        total = await db.cohesion_contacts.count_documents(query)
        skip = (page - 1) * limit
        
        cursor = db.cohesion_contacts.find(query).skip(skip).limit(limit).sort("importedAt", -1)
        contacts = await cursor.to_list(length=limit)
        
        # Convertir ObjectId en string
        for contact in contacts:
            contact["_id"] = str(contact["_id"])
        
        return {
            "contacts": contacts,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
    
    @router.post("/contacts", response_model=dict)
    async def create_contact(
        contact_data: CohesionContactCreate,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Crée un nouveau contact"""
        # Vérifier si l'email existe déjà
        existing = await db.cohesion_contacts.find_one(
            {"email": contact_data.email.lower().strip()}
        )
        if existing:
            raise HTTPException(status_code=400, detail="Cet email existe déjà")
        
        # Valider l'email
        validation = cohesion_service.validate_email_format(contact_data.email)
        if not validation.is_valid:
            raise HTTPException(
                status_code=400, 
                detail=f"Email invalide: {validation.error_message}"
            )
        
        # Récupérer le nom de la catégorie si categoryId fourni
        category_name = None
        if contact_data.categoryId:
            category = await db.cohesion_categories.find_one({"id": contact_data.categoryId})
            if category:
                category_name = category.get("name")
        
        contact = CohesionContact(
            email=contact_data.email.lower().strip(),
            firstName=contact_data.firstName,
            lastName=contact_data.lastName,
            phone=contact_data.phone,
            company=contact_data.company,
            tags=contact_data.tags or [],
            categoryId=contact_data.categoryId,
            categoryName=category_name,
            source=contact_data.source,
            emailValidated=True
        )
        
        await db.cohesion_contacts.insert_one(contact.model_dump())
        
        # Mettre à jour le compteur de la catégorie
        if contact_data.categoryId:
            await db.cohesion_categories.update_one(
                {"id": contact_data.categoryId},
                {"$inc": {"contactsCount": 1}}
            )
        
        return {"message": "Contact créé avec succès", "contact": contact.model_dump()}
    
    @router.put("/contacts/{contact_id}", response_model=dict)
    async def update_contact(
        contact_id: str,
        contact_data: CohesionContactUpdate,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Met à jour un contact"""
        existing = await db.cohesion_contacts.find_one({"id": contact_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Contact non trouvé")
        
        update_data = {k: v for k, v in contact_data.model_dump().items() if v is not None}
        
        # Gérer le changement de catégorie
        if "categoryId" in update_data:
            old_category_id = existing.get("categoryId")
            new_category_id = update_data.get("categoryId")
            
            # Récupérer le nom de la nouvelle catégorie
            if new_category_id:
                category = await db.cohesion_categories.find_one({"id": new_category_id})
                if category:
                    update_data["categoryName"] = category.get("name")
                    # Incrémenter le compteur de la nouvelle catégorie
                    await db.cohesion_categories.update_one(
                        {"id": new_category_id},
                        {"$inc": {"contactsCount": 1}}
                    )
            else:
                update_data["categoryName"] = None
            
            # Décrémenter le compteur de l'ancienne catégorie
            if old_category_id and old_category_id != new_category_id:
                await db.cohesion_categories.update_one(
                    {"id": old_category_id},
                    {"$inc": {"contactsCount": -1}}
                )
        
        if update_data:
            await db.cohesion_contacts.update_one(
                {"id": contact_id},
                {"$set": update_data}
            )
        
        return {"message": "Contact mis à jour avec succès"}
    
    @router.delete("/contacts/{contact_id}", response_model=dict)
    async def delete_contact(
        contact_id: str,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Supprime un contact"""
        result = await db.cohesion_contacts.delete_one({"id": contact_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Contact non trouvé")
        
        return {"message": "Contact supprimé avec succès"}
    
    @router.delete("/contacts", response_model=dict)
    async def delete_contacts_bulk(
        contact_ids: List[str],
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Supprime plusieurs contacts"""
        result = await db.cohesion_contacts.delete_many({"id": {"$in": contact_ids}})
        return {"message": f"{result.deleted_count} contacts supprimés"}
    
    # ==================== ACTIONS EN MASSE ====================
    
    @router.get("/contacts/count", response_model=dict)
    async def count_contacts(
        status: Optional[str] = None,
        categoryId: Optional[str] = None,
        hasCategory: Optional[bool] = None,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Compte les contacts selon les filtres"""
        query = {}
        if status:
            query["status"] = status
        if categoryId:
            query["categoryId"] = categoryId
        if hasCategory is not None:
            if hasCategory:
                query["categoryId"] = {"$ne": None, "$exists": True}
            else:
                query["$or"] = [{"categoryId": None}, {"categoryId": {"$exists": False}}]
        
        count = await db.cohesion_contacts.count_documents(query)
        return {"count": count}
    
    @router.post("/contacts/bulk-assign-category", response_model=dict)
    async def bulk_assign_category(
        category_id: str = Query(..., description="ID de la catégorie à affecter"),
        filter_no_category: bool = Query(False, description="Affecter uniquement aux contacts sans catégorie"),
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Affecte une catégorie à tous les contacts (ou seulement ceux sans catégorie)"""
        # Récupérer la catégorie
        category = await db.cohesion_categories.find_one({"id": category_id})
        if not category:
            raise HTTPException(status_code=404, detail="Catégorie non trouvée")
        
        # Construire le filtre
        query = {}
        if filter_no_category:
            query["$or"] = [{"categoryId": None}, {"categoryId": {"$exists": False}}]
        
        # Mettre à jour les contacts
        result = await db.cohesion_contacts.update_many(
            query,
            {"$set": {"categoryId": category_id, "categoryName": category.get("name")}}
        )
        
        return {"message": f"Catégorie affectée à {result.modified_count} contacts"}
    
    @router.delete("/contacts/bulk-delete", response_model=dict)
    async def bulk_delete_contacts(
        filter_no_category: bool = Query(False, description="Supprimer uniquement les contacts sans catégorie"),
        category_id: Optional[str] = Query(None, description="Supprimer les contacts de cette catégorie"),
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Supprime des contacts en masse selon les filtres"""
        query = {}
        
        if filter_no_category:
            query["$or"] = [{"categoryId": None}, {"categoryId": {"$exists": False}}]
        elif category_id:
            query["categoryId"] = category_id
        else:
            raise HTTPException(status_code=400, detail="Vous devez spécifier un filtre (filter_no_category ou category_id)")
        
        # Compter d'abord
        count = await db.cohesion_contacts.count_documents(query)
        
        # Supprimer
        result = await db.cohesion_contacts.delete_many(query)
        
        return {"message": f"{result.deleted_count} contacts supprimés", "deleted": result.deleted_count}
    
    @router.get("/contacts/all-ids", response_model=dict)
    async def get_all_contact_ids(
        status: Optional[str] = None,
        categoryId: Optional[str] = None,
        hasCategory: Optional[str] = None,
        tags: Optional[str] = None,
        search: Optional[str] = None,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Récupère tous les IDs des contacts selon les filtres (pour sélection en masse)"""
        query = {}
        and_conditions = []
        
        if search:
            and_conditions.append({
                "$or": [
                    {"email": {"$regex": search, "$options": "i"}},
                    {"firstName": {"$regex": search, "$options": "i"}},
                    {"lastName": {"$regex": search, "$options": "i"}},
                    {"company": {"$regex": search, "$options": "i"}}
                ]
            })
        
        if status:
            query["status"] = status
        
        if tags:
            tag_list = [t.strip() for t in tags.split(",")]
            query["tags"] = {"$in": tag_list}
        
        if categoryId:
            query["categoryId"] = categoryId
        elif hasCategory is not None:
            if hasCategory.lower() == 'false':
                # Contacts sans catégorie
                and_conditions.append({
                    "$or": [
                        {"categoryId": None}, 
                        {"categoryId": {"$exists": False}},
                        {"categoryId": ""}
                    ]
                })
            elif hasCategory.lower() == 'true':
                query["categoryId"] = {"$nin": [None, ""]}
        
        # Combiner les conditions AND si nécessaire
        if and_conditions:
            if len(and_conditions) == 1:
                query.update(and_conditions[0])
            else:
                query["$and"] = and_conditions
        
        cursor = db.cohesion_contacts.find(query, {"id": 1})
        docs = await cursor.to_list(length=100000)
        ids = [doc["id"] for doc in docs]
        
        return {"ids": ids, "count": len(ids)}
    
    # ==================== IMPORT CSV ====================
    
    # Mapping intelligent des colonnes CSV vers les champs du système
    COLUMN_MAPPING_SUGGESTIONS = {
        # Email
        'email': 'email',
        'e-mail': 'email',
        'mail': 'email',
        'courriel': 'email',
        'adresse_email': 'email',
        'adresse email': 'email',
        'email_address': 'email',
        'emailaddress': 'email',
        'contact_email': 'email',
        'adresse mail': 'email',
        # Prénom
        'prenom': 'firstName',
        'prénom': 'firstName',
        'firstname': 'firstName',
        'first_name': 'firstName',
        'first name': 'firstName',
        'given_name': 'firstName',
        'givenname': 'firstName',
        'forename': 'firstName',
        # Nom
        'nom': 'lastName',
        'lastname': 'lastName',
        'last_name': 'lastName',
        'last name': 'lastName',
        'family_name': 'lastName',
        'familyname': 'lastName',
        'surname': 'lastName',
        'name': 'lastName',
        'nom de famille': 'lastName',
        # Nom adhérent
        'adherent_nom': 'adherentNom',
        'adherent nom': 'adherentNom',
        'nom_adherent': 'adherentNom',
        'nom adherent': 'adherentNom',
        'adherent': 'adherentNom',
        'nom_complet': 'adherentNom',
        'fullname': 'adherentNom',
        'full_name': 'adherentNom',
        # Téléphone
        'telephone': 'phone',
        'téléphone': 'phone',
        'phone': 'phone',
        'tel': 'phone',
        'tél': 'phone',
        'mobile': 'phone',
        'portable': 'phone',
        'phone_number': 'phone',
        'phonenumber': 'phone',
        'numero_telephone': 'phone',
        'numéro téléphone': 'phone',
        'cell': 'phone',
        'cellphone': 'phone',
        # Entreprise
        'entreprise': 'company',
        'societe': 'company',
        'société': 'company',
        'company': 'company',
        'organization': 'company',
        'organisation': 'company',
        'org': 'company',
        'company_name': 'company',
        'companyname': 'company',
        'nom_entreprise': 'company',
        'raison_sociale': 'company',
        'raison sociale': 'company',
        'business': 'company',
        'employer': 'company',
        # Point de vente
        'point_de_vente_id': 'pointDeVenteId',
        'point_de_vente': 'pointDeVenteId',
        'pointdevente': 'pointDeVenteId',
        'pdv_id': 'pointDeVenteId',
        'pdv': 'pointDeVenteId',
        'store_id': 'pointDeVenteId',
        'magasin_id': 'pointDeVenteId',
        'id_magasin': 'pointDeVenteId',
        # Département
        'departement': 'departement',
        'département': 'departement',
        'dept': 'departement',
        'dpt': 'departement',
        'department': 'departement',
        'code_dept': 'departement',
        'code_departement': 'departement',
        # Ville
        'ville': 'ville',
        'city': 'ville',
        'commune': 'ville',
        'localite': 'ville',
        'localité': 'ville',
        'town': 'ville',
        # Code postal
        'code_postal': 'codePostal',
        'codepostal': 'codePostal',
        'cp': 'codePostal',
        'zipcode': 'codePostal',
        'zip_code': 'codePostal',
        'zip': 'codePostal',
        'postal_code': 'codePostal',
        'postalcode': 'codePostal',
        # Adresse
        'adresse': 'adresse',
        'address': 'adresse',
        'adresse_complete': 'adresse',
        'rue': 'adresse',
        'street': 'adresse',
        'adresse_postale': 'adresse',
        # Montant adhésion
        'montant_adhesion': 'montantAdhesion',
        'montant adhesion': 'montantAdhesion',
        'montant': 'montantAdhesion',
        'amount': 'montantAdhesion',
        'cotisation': 'montantAdhesion',
        'adhesion_montant': 'montantAdhesion',
        'prix': 'montantAdhesion',
        'price': 'montantAdhesion',
        # Règlements par année
        'reglement_2023': 'reglement2023',
        'reglement2023': 'reglement2023',
        'paiement_2023': 'reglement2023',
        'paye_2023': 'reglement2023',
        'reglement_2024': 'reglement2024',
        'reglement2024': 'reglement2024',
        'paiement_2024': 'reglement2024',
        'paye_2024': 'reglement2024',
        'reglement_2025': 'reglement2025',
        'reglement2025': 'reglement2025',
        'paiement_2025': 'reglement2025',
        'paye_2025': 'reglement2025',
        'reglement_2026': 'reglement2026',
        'reglement2026': 'reglement2026',
        'paiement_2026': 'reglement2026',
        'paye_2026': 'reglement2026',
        # Tags
        'tags': 'tags',
        'tag': 'tags',
        'etiquettes': 'tags',
        'étiquettes': 'tags',
        'labels': 'tags',
        'categories': 'tags',
        'catégories': 'tags',
    }
    
    # Champs disponibles pour le mapping
    AVAILABLE_FIELDS = [
        {'key': 'email', 'label': 'Email', 'required': True, 'type': 'email'},
        {'key': 'firstName', 'label': 'Prénom', 'required': False, 'type': 'text'},
        {'key': 'lastName', 'label': 'Nom', 'required': False, 'type': 'text'},
        {'key': 'adherentNom', 'label': 'Nom adhérent', 'required': False, 'type': 'text'},
        {'key': 'phone', 'label': 'Téléphone', 'required': False, 'type': 'phone'},
        {'key': 'company', 'label': 'Entreprise', 'required': False, 'type': 'text'},
        {'key': 'pointDeVenteId', 'label': 'ID Point de vente', 'required': False, 'type': 'text'},
        {'key': 'departement', 'label': 'Département', 'required': False, 'type': 'text'},
        {'key': 'ville', 'label': 'Ville', 'required': False, 'type': 'text'},
        {'key': 'codePostal', 'label': 'Code postal', 'required': False, 'type': 'text'},
        {'key': 'adresse', 'label': 'Adresse', 'required': False, 'type': 'text'},
        {'key': 'montantAdhesion', 'label': 'Montant adhésion', 'required': False, 'type': 'number'},
        {'key': 'reglement2023', 'label': 'Règlement 2023', 'required': False, 'type': 'boolean'},
        {'key': 'reglement2024', 'label': 'Règlement 2024', 'required': False, 'type': 'boolean'},
        {'key': 'reglement2025', 'label': 'Règlement 2025', 'required': False, 'type': 'boolean'},
        {'key': 'reglement2026', 'label': 'Règlement 2026', 'required': False, 'type': 'boolean'},
        {'key': 'tags', 'label': 'Tags', 'required': False, 'type': 'tags'},
        {'key': '__ignore__', 'label': 'Ignorer cette colonne', 'required': False, 'type': 'ignore'},
    ]
    
    @router.post("/analyze-csv", response_model=dict)
    async def analyze_csv(
        file: UploadFile = File(...),
        current_user: dict = Depends(get_current_admin_user)
    ):
        """
        Analyse un fichier CSV et propose un mapping intelligent des colonnes
        
        Returns:
            - columns: Liste des colonnes trouvées avec les suggestions de mapping
            - preview: Aperçu des premières lignes
            - availableFields: Champs disponibles pour le mapping
        """
        import csv
        import io
        
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Le fichier doit être au format CSV")
        
        content = await file.read()
        
        # Essayer différents encodages
        csv_content = None
        detected_encoding = None
        for encoding in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']:
            try:
                csv_content = content.decode(encoding)
                detected_encoding = encoding
                break
            except UnicodeDecodeError:
                continue
        
        if csv_content is None:
            raise HTTPException(status_code=400, detail="Impossible de décoder le fichier CSV")
        
        # Détecter le délimiteur
        csv_content = csv_content.replace('\r\n', '\n').replace('\r', '\n')
        first_line = csv_content.split('\n')[0] if csv_content else ''
        
        # Compter les délimiteurs potentiels
        delimiters = {',': 0, ';': 0, '\t': 0, '|': 0}
        for delim in delimiters:
            delimiters[delim] = first_line.count(delim)
        
        # Choisir le délimiteur le plus fréquent
        detected_delimiter = max(delimiters, key=delimiters.get)
        if delimiters[detected_delimiter] == 0:
            detected_delimiter = ','
        
        # Parser le CSV
        reader = csv.reader(io.StringIO(csv_content), delimiter=detected_delimiter)
        rows = list(reader)
        
        if not rows:
            raise HTTPException(status_code=400, detail="Fichier CSV vide")
        
        # Analyser les en-têtes
        headers = rows[0]
        data_rows = rows[1:] if len(rows) > 1 else []
        
        # Proposer un mapping intelligent pour chaque colonne
        columns = []
        for idx, header in enumerate(headers):
            header_clean = header.strip()
            header_lower = header_clean.lower().strip()
            
            # Chercher une correspondance dans le mapping
            suggested_field = COLUMN_MAPPING_SUGGESTIONS.get(header_lower)
            
            # Si pas de correspondance exacte, chercher par contenu partiel
            if not suggested_field:
                for key, field in COLUMN_MAPPING_SUGGESTIONS.items():
                    if key in header_lower or header_lower in key:
                        suggested_field = field
                        break
            
            # Analyser le contenu de la colonne pour affiner la suggestion
            sample_values = []
            for row in data_rows[:5]:
                if idx < len(row) and row[idx].strip():
                    sample_values.append(row[idx].strip())
            
            # Si toujours pas de suggestion, analyser le format des données
            if not suggested_field and sample_values:
                # Vérifier si c'est un email
                email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                import re
                if all(re.match(email_pattern, v) for v in sample_values if v):
                    suggested_field = 'email'
                # Vérifier si c'est un téléphone
                elif all(re.match(r'^[\d\s\+\-\.\(\)]+$', v) for v in sample_values if v):
                    if all(len(re.sub(r'[^\d]', '', v)) >= 8 for v in sample_values if v):
                        suggested_field = 'phone'
            
            # Calculer le taux de remplissage
            filled_count = sum(1 for row in data_rows if idx < len(row) and row[idx].strip())
            fill_rate = (filled_count / len(data_rows) * 100) if data_rows else 0
            
            columns.append({
                'index': idx,
                'originalName': header_clean,
                'suggestedField': suggested_field,
                'sampleValues': sample_values[:3],
                'fillRate': round(fill_rate, 1),
                'isEmpty': fill_rate == 0
            })
        
        # Prévisualisation des données
        preview = []
        for row in data_rows[:5]:
            row_data = {}
            for idx, header in enumerate(headers):
                row_data[header.strip()] = row[idx].strip() if idx < len(row) else ''
            preview.append(row_data)
        
        return {
            "filename": file.filename,
            "encoding": detected_encoding,
            "delimiter": detected_delimiter,
            "totalRows": len(data_rows),
            "columns": columns,
            "preview": preview,
            "availableFields": AVAILABLE_FIELDS,
            "headers": [h.strip() for h in headers]
        }
    
    @router.post("/import-with-mapping", response_model=dict)
    async def import_csv_with_mapping(
        file: UploadFile = File(...),
        mapping: str = Query(..., description="JSON mapping des colonnes: {colIndex: fieldName}"),
        validate_domains: bool = Query(False),
        category_id: Optional[str] = Query(None, description="ID de la catégorie à affecter"),
        delimiter: str = Query(',', description="Délimiteur CSV"),
        current_user: dict = Depends(get_current_admin_user)
    ):
        """
        Importe un fichier CSV avec un mapping personnalisé des colonnes
        
        Args:
            mapping: JSON string avec le mapping {index_colonne: nom_champ}
                     Ex: {"0": "email", "1": "firstName", "2": "lastName"}
        """
        import csv
        import io
        import json
        
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Le fichier doit être au format CSV")
        
        # Parser le mapping
        try:
            column_mapping = json.loads(mapping)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Format de mapping invalide")
        
        # Vérifier qu'il y a au moins une colonne email
        if 'email' not in column_mapping.values():
            raise HTTPException(status_code=400, detail="Le mapping doit contenir au moins une colonne 'email'")
        
        # Récupérer la catégorie si fournie
        category_name = None
        if category_id:
            category = await db.cohesion_categories.find_one({"id": category_id})
            if category:
                category_name = category.get("name")
        
        # Lire le contenu du fichier
        content = await file.read()
        
        # Essayer différents encodages
        csv_content = None
        for encoding in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']:
            try:
                csv_content = content.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        
        if csv_content is None:
            raise HTTPException(status_code=400, detail="Impossible de décoder le fichier CSV")
        
        # Parser le CSV
        csv_content = csv_content.replace('\r\n', '\n').replace('\r', '\n')
        reader = csv.reader(io.StringIO(csv_content), delimiter=delimiter)
        rows = list(reader)
        
        if len(rows) < 2:
            raise HTTPException(status_code=400, detail="Le fichier doit contenir au moins une ligne de données")
        
        # Ignorer l'en-tête
        data_rows = rows[1:]
        
        # Récupérer les emails existants
        existing_cursor = db.cohesion_contacts.find({}, {"email": 1})
        existing_docs = await existing_cursor.to_list(length=100000)
        existing_emails = {doc["email"].lower() for doc in existing_docs}
        
        # Traiter les lignes
        stats = {
            "total": len(data_rows),
            "imported": 0,
            "duplicates": 0,
            "invalidEmails": 0,
            "errors": []
        }
        
        contacts_to_insert = []
        
        for row_num, row in enumerate(data_rows, start=2):
            try:
                contact_data = {}
                
                # Appliquer le mapping
                for col_idx_str, field_name in column_mapping.items():
                    col_idx = int(col_idx_str)
                    if field_name == '__ignore__' or col_idx >= len(row):
                        continue
                    
                    value = row[col_idx].strip()
                    if value:
                        if field_name == 'tags':
                            # Séparer les tags par virgule ou point-virgule
                            contact_data['tags'] = [t.strip() for t in value.replace(';', ',').split(',') if t.strip()]
                        elif field_name == 'montantAdhesion':
                            # Convertir en float
                            try:
                                contact_data['montantAdhesion'] = float(value.replace(',', '.').replace('€', '').replace(' ', ''))
                            except ValueError:
                                contact_data['montantAdhesion'] = None
                        elif field_name in ('reglement2023', 'reglement2024', 'reglement2025', 'reglement2026'):
                            # Convertir en boolean
                            val_lower = value.lower()
                            contact_data[field_name] = val_lower in ('oui', 'yes', '1', 'true', 'o', 'x', 'ok', 'payé', 'paye', 'réglé', 'regle')
                        else:
                            contact_data[field_name] = value
                
                # Vérifier l'email
                email = contact_data.get('email', '').lower().strip()
                if not email:
                    stats['errors'].append(f"Ligne {row_num}: Email manquant")
                    continue
                
                # Valider le format de l'email
                email_validation = cohesion_service.validate_email_format(email)
                if not email_validation.is_valid:
                    stats['invalidEmails'] += 1
                    stats['errors'].append(f"Ligne {row_num}: {email_validation.error_message}")
                    continue
                
                # Vérifier les doublons
                if email in existing_emails:
                    stats['duplicates'] += 1
                    continue
                
                # Ajouter à la liste des contacts à insérer
                existing_emails.add(email)  # Éviter les doublons dans le même fichier
                
                contact = CohesionContact(
                    email=email,
                    firstName=contact_data.get('firstName'),
                    lastName=contact_data.get('lastName'),
                    phone=contact_data.get('phone'),
                    company=contact_data.get('company'),
                    # Nouveaux champs
                    pointDeVenteId=contact_data.get('pointDeVenteId'),
                    departement=contact_data.get('departement'),
                    ville=contact_data.get('ville'),
                    codePostal=contact_data.get('codePostal'),
                    adresse=contact_data.get('adresse'),
                    adherentNom=contact_data.get('adherentNom'),
                    montantAdhesion=contact_data.get('montantAdhesion'),
                    reglement2023=contact_data.get('reglement2023'),
                    reglement2024=contact_data.get('reglement2024'),
                    reglement2025=contact_data.get('reglement2025'),
                    reglement2026=contact_data.get('reglement2026'),
                    # Champs existants
                    tags=contact_data.get('tags', []),
                    categoryId=category_id,
                    categoryName=category_name,
                    source="import",
                    emailValidated=True
                )
                contacts_to_insert.append(contact.model_dump())
                stats['imported'] += 1
                
            except Exception as e:
                stats['errors'].append(f"Ligne {row_num}: Erreur - {str(e)}")
        
        # Insérer les contacts
        if contacts_to_insert:
            await db.cohesion_contacts.insert_many(contacts_to_insert)
            
            # Mettre à jour le compteur de la catégorie
            if category_id:
                await db.cohesion_categories.update_one(
                    {"id": category_id},
                    {"$inc": {"contactsCount": len(contacts_to_insert)}}
                )
        
        return {
            "message": "Import terminé",
            "result": {
                "totalRows": stats['total'],
                "imported": stats['imported'],
                "duplicates": stats['duplicates'],
                "invalidEmails": stats['invalidEmails'],
                "errors": stats['errors'][:20]
            }
        }
    
    @router.post("/import", response_model=dict)
    async def import_csv(
        file: UploadFile = File(...),
        validate_domains: bool = Query(False),
        category_id: Optional[str] = Query(None, description="ID de la catégorie à affecter aux contacts importés"),
        current_user: dict = Depends(get_current_admin_user)
    ):
        """
        Importe un fichier CSV de contacts (mode automatique)
        
        Le fichier doit contenir au minimum une colonne 'email'.
        Colonnes optionnelles: nom, prenom, telephone, entreprise
        
        Note: Pour un contrôle plus précis du mapping, utilisez /analyze-csv puis /import-with-mapping
        """
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Le fichier doit être au format CSV")
        
        # Récupérer la catégorie si fournie
        category_name = None
        if category_id:
            category = await db.cohesion_categories.find_one({"id": category_id})
            if category:
                category_name = category.get("name")
        
        # Lire le contenu du fichier
        content = await file.read()
        
        # Essayer différents encodages
        csv_content = None
        for encoding in ['utf-8', 'latin-1', 'cp1252']:
            try:
                csv_content = content.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        
        if csv_content is None:
            raise HTTPException(status_code=400, detail="Impossible de décoder le fichier CSV")
        
        # Récupérer les emails existants
        existing_cursor = db.cohesion_contacts.find({}, {"email": 1})
        existing_docs = await existing_cursor.to_list(length=100000)
        existing_emails = {doc["email"].lower() for doc in existing_docs}
        
        # Importer
        result = await cohesion_service.import_csv(
            csv_content, 
            existing_emails, 
            validate_domains
        )
        
        # Insérer les contacts valides
        if hasattr(result, 'contacts') and result.contacts:
            contacts_to_insert = []
            for contact_data in result.contacts:
                contact = CohesionContact(
                    email=contact_data['email'].lower().strip(),
                    firstName=contact_data.get('firstName'),
                    lastName=contact_data.get('lastName'),
                    phone=contact_data.get('phone'),
                    company=contact_data.get('company'),
                    categoryId=category_id,
                    categoryName=category_name,
                    source="import",
                    emailValidated=True
                )
                contacts_to_insert.append(contact.model_dump())
            
            if contacts_to_insert:
                await db.cohesion_contacts.insert_many(contacts_to_insert)
                
                # Mettre à jour le compteur de la catégorie
                if category_id:
                    await db.cohesion_categories.update_one(
                        {"id": category_id},
                        {"$inc": {"contactsCount": len(contacts_to_insert)}}
                    )
        
        return {
            "message": "Import terminé",
            "result": {
                "totalRows": result.total_rows,
                "imported": result.imported,
                "duplicates": result.duplicates,
                "invalidEmails": result.invalid_emails,
                "errors": result.errors[:20]  # Limiter les erreurs retournées
            }
        }
    
    @router.post("/validate-emails", response_model=dict)
    async def validate_emails(
        emails: List[str],
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Valide une liste d'emails"""
        stats = cohesion_service.get_email_stats(emails)
        return stats
    
    @router.post("/find-duplicates", response_model=dict)
    async def find_duplicates(
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Trouve et retourne les doublons dans la base"""
        pipeline = [
            {"$group": {
                "_id": {"$toLower": "$email"},
                "count": {"$sum": 1},
                "ids": {"$push": "$id"}
            }},
            {"$match": {"count": {"$gt": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        duplicates = await db.cohesion_contacts.aggregate(pipeline).to_list(length=1000)
        
        return {
            "totalDuplicates": len(duplicates),
            "duplicates": duplicates
        }
    
    @router.post("/remove-duplicates", response_model=dict)
    async def remove_duplicates(
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Supprime les doublons (garde le premier de chaque email)"""
        pipeline = [
            {"$group": {
                "_id": {"$toLower": "$email"},
                "count": {"$sum": 1},
                "ids": {"$push": "$id"},
                "firstId": {"$first": "$id"}
            }},
            {"$match": {"count": {"$gt": 1}}}
        ]
        
        duplicates = await db.cohesion_contacts.aggregate(pipeline).to_list(length=100000)
        
        removed_count = 0
        for dup in duplicates:
            ids_to_remove = [id for id in dup["ids"] if id != dup["firstId"]]
            if ids_to_remove:
                result = await db.cohesion_contacts.delete_many({"id": {"$in": ids_to_remove}})
                removed_count += result.deleted_count
        
        return {"message": f"{removed_count} doublons supprimés"}
    
    @router.post("/clean-invalid", response_model=dict)
    async def clean_invalid_emails(
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Identifie et marque les emails invalides"""
        cursor = db.cohesion_contacts.find({"status": "active"})
        contacts = await cursor.to_list(length=100000)
        
        invalid_count = 0
        for contact in contacts:
            validation = cohesion_service.validate_email_format(contact["email"])
            if not validation.is_valid:
                await db.cohesion_contacts.update_one(
                    {"id": contact["id"]},
                    {"$set": {"status": "invalid", "emailValidated": False}}
                )
                invalid_count += 1
        
        return {"message": f"{invalid_count} emails marqués comme invalides"}
    
    # ==================== TAGS ====================
    
    @router.get("/tags", response_model=dict)
    async def get_tags(
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Récupère la liste des tags utilisés"""
        pipeline = [
            {"$unwind": "$tags"},
            {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        tags = await db.cohesion_contacts.aggregate(pipeline).to_list(length=100)
        
        return {"tags": [{"name": t["_id"], "count": t["count"]} for t in tags]}
    
    @router.post("/contacts/{contact_id}/tags", response_model=dict)
    async def add_tags(
        contact_id: str,
        tags: List[str],
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Ajoute des tags à un contact"""
        result = await db.cohesion_contacts.update_one(
            {"id": contact_id},
            {"$addToSet": {"tags": {"$each": tags}}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Contact non trouvé")
        
        return {"message": "Tags ajoutés avec succès"}
    
    @router.post("/contacts/bulk-tags", response_model=dict)
    async def add_tags_bulk(
        contact_ids: List[str],
        tags: List[str],
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Ajoute des tags à plusieurs contacts"""
        result = await db.cohesion_contacts.update_many(
            {"id": {"$in": contact_ids}},
            {"$addToSet": {"tags": {"$each": tags}}}
        )
        
        return {"message": f"Tags ajoutés à {result.modified_count} contacts"}
    
    # ==================== CAMPAGNES ====================
    
    @router.get("/campaigns", response_model=dict)
    async def get_campaigns(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        status: Optional[str] = None,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Récupère la liste des campagnes"""
        query = {}
        if status:
            query["status"] = status
        
        total = await db.cohesion_campaigns.count_documents(query)
        skip = (page - 1) * limit
        
        cursor = db.cohesion_campaigns.find(query).skip(skip).limit(limit).sort("createdAt", -1)
        campaigns = await cursor.to_list(length=limit)
        
        for campaign in campaigns:
            campaign["_id"] = str(campaign["_id"])
        
        return {
            "campaigns": campaigns,
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit
        }
    
    @router.post("/campaigns", response_model=dict)
    async def create_campaign(
        campaign_data: CohesionCampaignCreate,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Crée une nouvelle campagne"""
        campaign = CohesionCampaign(
            name=campaign_data.name,
            subject=campaign_data.subject,
            bodyHtml=campaign_data.bodyHtml,
            bodyText=campaign_data.bodyText,
            recipientTags=campaign_data.recipientTags or [],
            scheduledAt=campaign_data.scheduledAt,
            createdBy=current_user.get("id")
        )
        
        await db.cohesion_campaigns.insert_one(campaign.model_dump())
        
        return {"message": "Campagne créée avec succès", "campaign": campaign.model_dump()}
    
    @router.get("/campaigns/{campaign_id}", response_model=dict)
    async def get_campaign(
        campaign_id: str,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Récupère une campagne par son ID"""
        campaign = await db.cohesion_campaigns.find_one({"id": campaign_id})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campagne non trouvée")
        
        campaign["_id"] = str(campaign["_id"])
        return campaign
    
    @router.put("/campaigns/{campaign_id}", response_model=dict)
    async def update_campaign(
        campaign_id: str,
        campaign_data: CohesionCampaignUpdate,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Met à jour une campagne"""
        existing = await db.cohesion_campaigns.find_one({"id": campaign_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Campagne non trouvée")
        
        if existing.get("status") == "sent":
            raise HTTPException(status_code=400, detail="Impossible de modifier une campagne déjà envoyée")
        
        update_data = {k: v for k, v in campaign_data.model_dump().items() if v is not None}
        update_data["updatedAt"] = datetime.utcnow()
        
        if update_data:
            await db.cohesion_campaigns.update_one(
                {"id": campaign_id},
                {"$set": update_data}
            )
        
        return {"message": "Campagne mise à jour avec succès"}
    
    @router.delete("/campaigns/{campaign_id}", response_model=dict)
    async def delete_campaign(
        campaign_id: str,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Supprime une campagne"""
        result = await db.cohesion_campaigns.delete_one({"id": campaign_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Campagne non trouvée")
        
        return {"message": "Campagne supprimée avec succès"}
    
    @router.post("/campaigns/{campaign_id}/preview", response_model=dict)
    async def preview_campaign(
        campaign_id: str,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Prévisualise une campagne avec un contact exemple"""
        campaign = await db.cohesion_campaigns.find_one({"id": campaign_id})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campagne non trouvée")
        
        # Récupérer un contact exemple
        query = {}
        if campaign.get("recipientTags"):
            query["tags"] = {"$in": campaign["recipientTags"]}
        query["status"] = "active"
        
        sample_contact = await db.cohesion_contacts.find_one(query)
        
        if sample_contact:
            # Personnaliser le template
            body = campaign["bodyHtml"]
            subject = campaign["subject"]
            
            for key, value in sample_contact.items():
                if isinstance(value, str):
                    placeholder = '{' + key + '}'
                    body = body.replace(placeholder, value)
                    subject = subject.replace(placeholder, value)
            
            return {
                "subject": subject,
                "body": body,
                "sampleContact": {
                    "email": sample_contact.get("email"),
                    "firstName": sample_contact.get("firstName"),
                    "lastName": sample_contact.get("lastName")
                }
            }
        
        return {
            "subject": campaign["subject"],
            "body": campaign["bodyHtml"],
            "sampleContact": None
        }
    
    @router.post("/campaigns/{campaign_id}/count-recipients", response_model=dict)
    async def count_campaign_recipients(
        campaign_id: str,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Compte le nombre de destinataires d'une campagne"""
        campaign = await db.cohesion_campaigns.find_one({"id": campaign_id})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campagne non trouvée")
        
        recipient_category = campaign.get("recipientCategoryId")
        
        # Cas spécial : Tous les adhérents (membres avec adhésion active)
        if recipient_category == "__members__":
            # Compter les membres avec adhésion active
            count = await db.users.count_documents({
                "email": {"$exists": True, "$ne": None, "$ne": ""}
            })
            return {"recipientCount": count}
        
        query = {"status": "active"}
        
        # Filtrer par audience (catégorie)
        if recipient_category:
            query["categoryId"] = recipient_category
        
        # Filtrer par tags
        if campaign.get("recipientTags"):
            query["tags"] = {"$in": campaign["recipientTags"]}
        
        count = await db.cohesion_contacts.count_documents(query)
        
        return {"recipientCount": count}
    
    async def send_campaign_emails(campaign_id: str, db_instance):
        """Tâche d'arrière-plan pour envoyer les emails d'une campagne"""
        campaign = await db_instance.cohesion_campaigns.find_one({"id": campaign_id})
        if not campaign:
            return
        
        recipient_category = campaign.get("recipientCategoryId")
        recipients = []
        
        # Cas spécial : Tous les adhérents (membres avec adhésion active)
        if recipient_category == "__members__":
            cursor = db_instance.users.find({
                "email": {"$exists": True, "$ne": None, "$ne": ""}
            })
            members = await cursor.to_list(length=10000)
            
            for member in members:
                # Extraire prénom/nom du champ name
                full_name = member.get("name", "")
                name_parts = full_name.split(" ", 1) if full_name else ["", ""]
                first_name = name_parts[0] if name_parts else ""
                last_name = name_parts[1] if len(name_parts) > 1 else ""
                
                recipients.append({
                    "email": member["email"],
                    "firstName": first_name,
                    "lastName": last_name,
                    "company": member.get("company", "")
                })
        else:
            # Logique existante pour les contacts
            query = {"status": "active"}
            
            # Filtrer par audience (catégorie)
            if recipient_category:
                query["categoryId"] = recipient_category
            
            # Filtrer par tags
            if campaign.get("recipientTags"):
                query["tags"] = {"$in": campaign["recipientTags"]}
            
            cursor = db_instance.cohesion_contacts.find(query)
            contacts = await cursor.to_list(length=10000)
            
            for contact in contacts:
                recipients.append({
                    "email": contact["email"],
                    "firstName": contact.get("firstName", ""),
                    "lastName": contact.get("lastName", ""),
                    "company": contact.get("company", "")
                })
        
        # Envoyer les emails
        stats = await cohesion_service.send_bulk_emails(
            recipients=recipients,
            subject=campaign["subject"],
            body_template=campaign["bodyHtml"],
            is_html=True,
            delay_seconds=0.5
        )
        
        # Mettre à jour la campagne
        await db_instance.cohesion_campaigns.update_one(
            {"id": campaign_id},
            {"$set": {
                "status": "sent",
                "sentAt": datetime.utcnow(),
                "recipientCount": stats["total"],
                "sentCount": stats["sent"],
                "failedCount": stats["failed"]
            }}
        )
        
        # Logger les envois
        for recipient in recipients:
            status = "sent"
            error_message = None
            
            # Vérifier si cet email a échoué
            for error in stats.get("errors", []):
                if error.get("email") == recipient["email"]:
                    status = "failed"
                    error_message = error.get("error")
                    break
            
            contact = await db_instance.cohesion_contacts.find_one({"email": recipient["email"]})
            if contact:
                log = CohesionEmailLog(
                    campaignId=campaign_id,
                    contactId=contact["id"],
                    email=recipient["email"],
                    status=status,
                    errorMessage=error_message
                )
                await db_instance.cohesion_email_logs.insert_one(log.model_dump())
                
                # Mettre à jour la date de dernier contact
                await db_instance.cohesion_contacts.update_one(
                    {"id": contact["id"]},
                    {"$set": {"lastContactedAt": datetime.utcnow()}}
                )
    
    @router.post("/campaigns/{campaign_id}/send", response_model=dict)
    async def send_campaign(
        campaign_id: str,
        background_tasks: BackgroundTasks,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Lance l'envoi d'une campagne"""
        if not cohesion_service.is_configured():
            raise HTTPException(
                status_code=400, 
                detail="Resend API non configuré. Vérifiez RESEND_API_KEY."
            )
        
        campaign = await db.cohesion_campaigns.find_one({"id": campaign_id})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campagne non trouvée")
        
        if campaign.get("status") == "sent":
            raise HTTPException(status_code=400, detail="Cette campagne a déjà été envoyée")
        
        # Compter les destinataires selon l'audience
        recipient_category = campaign.get("recipientCategoryId")
        
        if recipient_category == "__members__":
            # Tous les adhérents
            recipient_count = await db.users.count_documents({
                "email": {"$exists": True, "$ne": None, "$ne": ""}
            })
        else:
            query = {"status": "active"}
            if recipient_category:
                query["categoryId"] = recipient_category
            if campaign.get("recipientTags"):
                query["tags"] = {"$in": campaign["recipientTags"]}
            
            recipient_count = await db.cohesion_contacts.count_documents(query)
        
        if recipient_count == 0:
            raise HTTPException(status_code=400, detail="Aucun destinataire pour cette campagne")
        
        # Marquer comme en cours d'envoi
        await db.cohesion_campaigns.update_one(
            {"id": campaign_id},
            {"$set": {"status": "sending", "recipientCount": recipient_count}}
        )
        
        # Lancer l'envoi en arrière-plan
        background_tasks.add_task(send_campaign_emails, campaign_id, db)
        
        return {
            "message": f"Envoi lancé pour {recipient_count} destinataires",
            "recipientCount": recipient_count
        }
    
    @router.post("/campaigns/{campaign_id}/test", response_model=dict)
    async def test_campaign(
        campaign_id: str,
        test_email: str,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Envoie un email de test pour une campagne"""
        if not cohesion_service.is_configured():
            raise HTTPException(
                status_code=400, 
                detail="Resend API non configuré. Vérifiez RESEND_API_KEY."
            )
        
        campaign = await db.cohesion_campaigns.find_one({"id": campaign_id})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campagne non trouvée")
        
        # Valider l'email de test
        validation = cohesion_service.validate_email_format(test_email)
        if not validation.is_valid:
            raise HTTPException(status_code=400, detail=f"Email de test invalide: {validation.error_message}")
        
        # Récupérer un contact exemple pour la personnalisation
        sample_contact = await db.cohesion_contacts.find_one({"status": "active"})
        
        body = campaign["bodyHtml"]
        subject = f"[TEST] {campaign['subject']}"
        
        if sample_contact:
            for key, value in sample_contact.items():
                if isinstance(value, str):
                    placeholder = '{' + key + '}'
                    body = body.replace(placeholder, value)
                    subject = subject.replace(placeholder, value)
        
        success, error = await cohesion_service.send_email_async(
            test_email, subject, body
        )
        
        if success:
            return {"message": f"Email de test envoyé à {test_email}"}
        else:
            raise HTTPException(status_code=500, detail=f"Erreur d'envoi: {error}")
    
    # ==================== STATISTIQUES ====================
    
    @router.get("/stats", response_model=dict)
    async def get_stats(
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Récupère les statistiques générales"""
        # Contacts par statut
        status_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_counts = await db.cohesion_contacts.aggregate(status_pipeline).to_list(length=10)
        status_dict = {s["_id"]: s["count"] for s in status_counts}
        
        # Campagnes
        total_campaigns = await db.cohesion_campaigns.count_documents({})
        sent_campaigns = await db.cohesion_campaigns.count_documents({"status": "sent"})
        
        # Emails envoyés
        sent_pipeline = [
            {"$group": {"_id": None, "total": {"$sum": "$sentCount"}}}
        ]
        sent_result = await db.cohesion_campaigns.aggregate(sent_pipeline).to_list(length=1)
        total_emails_sent = sent_result[0]["total"] if sent_result else 0
        
        # Top tags
        tags_pipeline = [
            {"$unwind": "$tags"},
            {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        top_tags = await db.cohesion_contacts.aggregate(tags_pipeline).to_list(length=10)
        
        return {
            "totalContacts": sum(status_dict.values()),
            "activeContacts": status_dict.get("active", 0),
            "unsubscribed": status_dict.get("unsubscribed", 0),
            "bounced": status_dict.get("bounced", 0),
            "invalid": status_dict.get("invalid", 0),
            "totalCampaigns": total_campaigns,
            "sentCampaigns": sent_campaigns,
            "totalEmailsSent": total_emails_sent,
            "topTags": [{"name": t["_id"], "count": t["count"]} for t in top_tags]
        }
    
    @router.get("/email-status", response_model=dict)
    async def get_email_status(
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Vérifie le statut de la configuration email (Resend API)"""
        return {
            "configured": cohesion_service.is_configured(),
            "provider": "Resend",
            "api_url": "https://api.resend.com"
        }
    
    # ==================== CATÉGORIES ====================
    
    @router.get("/categories", response_model=dict)
    async def get_categories(
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Récupère la liste des catégories"""
        cursor = db.cohesion_categories.find({}).sort("name", 1)
        categories = await cursor.to_list(length=100)
        
        # Convertir ObjectId en string et mettre à jour les compteurs
        for cat in categories:
            cat["_id"] = str(cat["_id"])
            # Recalculer le nombre de contacts
            count = await db.cohesion_contacts.count_documents({"categoryId": cat["id"]})
            cat["contactsCount"] = count
        
        return {"categories": categories}
    
    @router.post("/categories", response_model=dict)
    async def create_category(
        category_data: CohesionCategoryCreate,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Crée une nouvelle catégorie"""
        # Vérifier si le nom existe déjà
        existing = await db.cohesion_categories.find_one(
            {"name": {"$regex": f"^{category_data.name}$", "$options": "i"}}
        )
        if existing:
            raise HTTPException(status_code=400, detail="Une catégorie avec ce nom existe déjà")
        
        category = CohesionCategory(
            name=category_data.name,
            description=category_data.description,
            color=category_data.color or "#3B82F6"
        )
        
        await db.cohesion_categories.insert_one(category.model_dump())
        
        return {"message": "Catégorie créée avec succès", "category": category.model_dump()}
    
    @router.put("/categories/{category_id}", response_model=dict)
    async def update_category(
        category_id: str,
        category_data: CohesionCategoryUpdate,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Met à jour une catégorie"""
        existing = await db.cohesion_categories.find_one({"id": category_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Catégorie non trouvée")
        
        update_data = {k: v for k, v in category_data.model_dump().items() if v is not None}
        update_data["updatedAt"] = datetime.utcnow()
        
        # Si le nom change, mettre à jour le categoryName dans tous les contacts
        if "name" in update_data and update_data["name"] != existing.get("name"):
            await db.cohesion_contacts.update_many(
                {"categoryId": category_id},
                {"$set": {"categoryName": update_data["name"]}}
            )
        
        if update_data:
            await db.cohesion_categories.update_one(
                {"id": category_id},
                {"$set": update_data}
            )
        
        return {"message": "Catégorie mise à jour avec succès"}
    
    @router.delete("/categories/{category_id}", response_model=dict)
    async def delete_category(
        category_id: str,
        remove_contacts: bool = Query(False, description="Supprimer aussi les contacts de cette catégorie"),
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Supprime une catégorie"""
        existing = await db.cohesion_categories.find_one({"id": category_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Catégorie non trouvée")
        
        if remove_contacts:
            # Supprimer tous les contacts de cette catégorie
            await db.cohesion_contacts.delete_many({"categoryId": category_id})
        else:
            # Retirer la catégorie des contacts (les garder sans catégorie)
            await db.cohesion_contacts.update_many(
                {"categoryId": category_id},
                {"$set": {"categoryId": None, "categoryName": None}}
            )
        
        # Supprimer la catégorie
        await db.cohesion_categories.delete_one({"id": category_id})
        
        return {"message": "Catégorie supprimée avec succès"}
    
    @router.post("/contacts/bulk-category", response_model=dict)
    async def assign_category_bulk(
        contact_ids: List[str],
        category_id: str,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Assigne une catégorie à plusieurs contacts"""
        # Récupérer la catégorie
        category = await db.cohesion_categories.find_one({"id": category_id})
        if not category:
            raise HTTPException(status_code=404, detail="Catégorie non trouvée")
        
        result = await db.cohesion_contacts.update_many(
            {"id": {"$in": contact_ids}},
            {"$set": {"categoryId": category_id, "categoryName": category.get("name")}}
        )
        
        return {"message": f"Catégorie assignée à {result.modified_count} contacts"}
    
    return router
