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
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Récupère la liste des contacts avec pagination et filtres"""
        query = {}
        
        if search:
            query["$or"] = [
                {"email": {"$regex": search, "$options": "i"}},
                {"firstName": {"$regex": search, "$options": "i"}},
                {"lastName": {"$regex": search, "$options": "i"}},
                {"company": {"$regex": search, "$options": "i"}}
            ]
        
        if status:
            query["status"] = status
        
        if tags:
            tag_list = [t.strip() for t in tags.split(",")]
            query["tags"] = {"$in": tag_list}
        
        if categoryId:
            query["categoryId"] = categoryId
        
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
        hasCategory: Optional[bool] = None,
        tags: Optional[str] = None,
        search: Optional[str] = None,
        current_user: dict = Depends(get_current_admin_user)
    ):
        """Récupère tous les IDs des contacts selon les filtres (pour sélection en masse)"""
        query = {}
        
        if search:
            query["$or"] = [
                {"email": {"$regex": search, "$options": "i"}},
                {"firstName": {"$regex": search, "$options": "i"}},
                {"lastName": {"$regex": search, "$options": "i"}},
                {"company": {"$regex": search, "$options": "i"}}
            ]
        
        if status:
            query["status"] = status
        
        if tags:
            tag_list = [t.strip() for t in tags.split(",")]
            query["tags"] = {"$in": tag_list}
        
        if categoryId:
            query["categoryId"] = categoryId
        elif hasCategory is False:
            query["$or"] = [{"categoryId": None}, {"categoryId": {"$exists": False}}]
        
        cursor = db.cohesion_contacts.find(query, {"id": 1})
        docs = await cursor.to_list(length=100000)
        ids = [doc["id"] for doc in docs]
        
        return {"ids": ids, "count": len(ids)}
    
    # ==================== IMPORT CSV ====================
    
    @router.post("/import", response_model=dict)
    async def import_csv(
        file: UploadFile = File(...),
        validate_domains: bool = Query(False),
        category_id: Optional[str] = Query(None, description="ID de la catégorie à affecter aux contacts importés"),
        current_user: dict = Depends(get_current_admin_user)
    ):
        """
        Importe un fichier CSV de contacts
        
        Le fichier doit contenir au minimum une colonne 'email'.
        Colonnes optionnelles: nom, prenom, telephone, entreprise
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
        
        query = {"status": "active"}
        if campaign.get("recipientTags"):
            query["tags"] = {"$in": campaign["recipientTags"]}
        
        count = await db.cohesion_contacts.count_documents(query)
        
        return {"recipientCount": count}
    
    async def send_campaign_emails(campaign_id: str, db_instance):
        """Tâche d'arrière-plan pour envoyer les emails d'une campagne"""
        campaign = await db_instance.cohesion_campaigns.find_one({"id": campaign_id})
        if not campaign:
            return
        
        query = {"status": "active"}
        if campaign.get("recipientTags"):
            query["tags"] = {"$in": campaign["recipientTags"]}
        
        cursor = db_instance.cohesion_contacts.find(query)
        contacts = await cursor.to_list(length=10000)
        
        # Préparer les destinataires
        recipients = []
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
        
        # Compter les destinataires
        query = {"status": "active"}
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
