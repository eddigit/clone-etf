"""
Routes API pour les fonctionnalités communautaires
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime

from models import (
    UserProfileUpdate,
    PostCreate, Comment, Post,
    PrivateMessageCreate, ConversationMember, PrivateConversation, PrivateMessage,
    CaseStudyCreate, CaseStudyUpdate, CaseStudyComment, CaseStudy,
    Notification,
    MessageResponse
)


def create_community_router(db, get_current_user):
    """Factory function pour créer le router avec les dépendances injectées"""
    
    router = APIRouter(tags=["community"])
    
    # ===================== MEMBERS & PROFILES =====================
    
    @router.get("/members")
    async def get_members(
        current_user: dict = Depends(get_current_user),
        search: Optional[str] = None,
        membershipType: Optional[str] = None,
        location: Optional[str] = None,
        expertise: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ):
        """Annuaire des membres"""
        if current_user.get("membershipStatus") != "active":
            raise HTTPException(status_code=403, detail="Accès réservé aux membres actifs")
        
        filter_query = {"isProfilePublic": True, "membershipStatus": "active"}
        
        if membershipType:
            filter_query["membershipType"] = membershipType
        if location:
            filter_query["location"] = {"$regex": location, "$options": "i"}
        if expertise:
            filter_query["expertise"] = {"$in": [expertise]}
        if search:
            filter_query["$or"] = [
                {"firstName": {"$regex": search, "$options": "i"}},
                {"lastName": {"$regex": search, "$options": "i"}},
                {"businessName": {"$regex": search, "$options": "i"}}
            ]
        
        cursor = db.users.find(filter_query).skip(skip).limit(limit)
        members = []
        async for member in cursor:
            members.append({
                "id": member["id"],
                "firstName": member["firstName"],
                "lastName": member["lastName"],
                "profilePhoto": member.get("profilePhoto"),
                "bio": member.get("bio"),
                "businessName": member.get("businessName"),
                "businessType": member.get("businessType"),
                "membershipType": member["membershipType"],
                "location": member.get("location"),
                "expertise": member.get("expertise", []),
            })
        
        total = await db.users.count_documents(filter_query)
        return {"members": members, "total": total, "skip": skip, "limit": limit}
    
    
    @router.get("/members/{member_id}")
    async def get_member_profile(member_id: str, current_user: dict = Depends(get_current_user)):
        """Profil public d'un membre"""
        if current_user.get("membershipStatus") != "active":
            raise HTTPException(status_code=403, detail="Accès réservé aux membres actifs")
        
        member = await db.users.find_one({"id": member_id, "isProfilePublic": True})
        if not member:
            raise HTTPException(status_code=404, detail="Membre non trouvé")
        
        posts_count = await db.posts.count_documents({"userId": member_id})
        cases_count = await db.case_studies.count_documents({"userId": member_id})
        
        return {
            "id": member["id"],
            "firstName": member["firstName"],
            "lastName": member["lastName"],
            "profilePhoto": member.get("profilePhoto"),
            "bio": member.get("bio"),
            "businessName": member.get("businessName"),
            "businessType": member.get("businessType"),
            "membershipType": member["membershipType"],
            "location": member.get("location"),
            "expertise": member.get("expertise", []),
            "memberSince": member["createdAt"],
            "stats": {"posts": posts_count, "casesShared": cases_count}
        }
    
    
    @router.put("/members/me")
    async def update_my_profile(profile_update: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
        """Mise à jour du profil"""
        update_data = profile_update.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        result = await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        return MessageResponse(message="Profil mis à jour avec succès")
    
    
    # ===================== POSTS (FIL D'ACTUALITÉ) =====================
    
    @router.post("/posts")
    async def create_post(post_data: PostCreate, current_user: dict = Depends(get_current_user)):
        """Créer un post"""
        if current_user.get("membershipStatus") != "active":
            raise HTTPException(status_code=403, detail="Accès réservé aux membres actifs")
        
        post = Post(
            userId=current_user["id"],
            userFirstName=current_user["firstName"],
            userLastName=current_user["lastName"],
            userProfilePhoto=current_user.get("profilePhoto"),
            content=post_data.content,
            attachments=post_data.attachments
        )
        
        await db.posts.insert_one(post.dict())
        return {"post": post.dict(), "message": "Post créé avec succès"}
    
    
    @router.get("/posts")
    async def get_feed(current_user: dict = Depends(get_current_user), skip: int = 0, limit: int = 10):
        """Fil d'actualité"""
        if current_user.get("membershipStatus") != "active":
            raise HTTPException(status_code=403, detail="Accès réservé aux membres actifs")
        
        cursor = db.posts.find().sort("createdAt", -1).skip(skip).limit(limit)
        posts = []
        async for post in cursor:
            posts.append(post)
        
        total = await db.posts.count_documents({})
        return {"posts": posts, "total": total, "skip": skip, "limit": limit}
    
    
    @router.post("/posts/{post_id}/like")
    async def like_post(post_id: str, current_user: dict = Depends(get_current_user)):
        """Liker un post"""
        if current_user.get("membershipStatus") != "active":
            raise HTTPException(status_code=403, detail="Accès réservé aux membres actifs")
        
        post = await db.posts.find_one({"id": post_id})
        if not post:
            raise HTTPException(status_code=404, detail="Post non trouvé")
        
        user_id = current_user["id"]
        likes = post.get("likes", [])
        
        if user_id in likes:
            await db.posts.update_one({"id": post_id}, {"$pull": {"likes": user_id}})
            return {"liked": False, "likes_count": len(likes) - 1}
        else:
            await db.posts.update_one({"id": post_id}, {"$push": {"likes": user_id}})
            
            if post["userId"] != user_id:
                notif = Notification(
                    userId=post["userId"],
                    type="like",
                    title="Nouveau like",
                    message=f"{current_user['firstName']} {current_user['lastName']} a aimé votre post",
                    relatedId=post_id,
                    relatedUrl=f"/dashboard/community#{post_id}"
                )
                await db.notifications.insert_one(notif.dict())
            
            return {"liked": True, "likes_count": len(likes) + 1}
    
    
    @router.post("/posts/{post_id}/comments")
    async def add_comment(post_id: str, content: str, current_user: dict = Depends(get_current_user)):
        """Commenter un post"""
        if current_user.get("membershipStatus") != "active":
            raise HTTPException(status_code=403, detail="Accès réservé aux membres actifs")
        
        post = await db.posts.find_one({"id": post_id})
        if not post:
            raise HTTPException(status_code=404, detail="Post non trouvé")
        
        comment = Comment(
            userId=current_user["id"],
            userFirstName=current_user["firstName"],
            userLastName=current_user["lastName"],
            content=content
        )
        
        await db.posts.update_one(
            {"id": post_id},
            {"$push": {"comments": comment.dict()}, "$set": {"updatedAt": datetime.utcnow()}}
        )
        
        if post["userId"] != current_user["id"]:
            notif = Notification(
                userId=post["userId"],
                type="comment",
                title="Nouveau commentaire",
                message=f"{current_user['firstName']} {current_user['lastName']} a commenté votre post",
                relatedId=post_id,
                relatedUrl=f"/dashboard/community#{post_id}"
            )
            await db.notifications.insert_one(notif.dict())
        
        return {"comment": comment.dict(), "message": "Commentaire ajouté"}
    
    
    # ===================== MESSAGERIE =====================
    
    @router.get("/conversations")
    async def get_conversations(current_user: dict = Depends(get_current_user)):
        """Liste conversations"""
        if current_user.get("membershipStatus") != "active":
            raise HTTPException(status_code=403, detail="Accès réservé aux membres actifs")
        
        cursor = db.private_conversations.find({"members.userId": current_user["id"]}).sort("updatedAt", -1)
        conversations = []
        async for conv in cursor:
            conversations.append(conv)
        
        return {"conversations": conversations}
    
    
    @router.post("/conversations")
    async def create_conversation(message_data: PrivateMessageCreate, current_user: dict = Depends(get_current_user)):
        """Créer conversation"""
        if current_user.get("membershipStatus") != "active":
            raise HTTPException(status_code=403, detail="Accès réservé aux membres actifs")
        
        recipient = await db.users.find_one({"id": message_data.recipientId})
        if not recipient:
            raise HTTPException(status_code=404, detail="Destinataire non trouvé")
        
        conversation = await db.private_conversations.find_one({
            "members.userId": {"$all": [current_user["id"], message_data.recipientId]}
        })
        
        if not conversation:
            conversation = PrivateConversation(
                members=[
                    ConversationMember(
                        userId=current_user["id"],
                        firstName=current_user["firstName"],
                        lastName=current_user["lastName"],
                        profilePhoto=current_user.get("profilePhoto")
                    ),
                    ConversationMember(
                        userId=recipient["id"],
                        firstName=recipient["firstName"],
                        lastName=recipient["lastName"],
                        profilePhoto=recipient.get("profilePhoto")
                    )
                ]
            )
            await db.private_conversations.insert_one(conversation.dict())
            conv_id = conversation.id
        else:
            conv_id = conversation["id"]
        
        message = PrivateMessage(
            conversationId=conv_id,
            senderId=current_user["id"],
            senderFirstName=current_user["firstName"],
            senderLastName=current_user["lastName"],
            content=message_data.content
        )
        
        await db.private_messages.insert_one(message.dict())
        
        await db.private_conversations.update_one(
            {"id": conv_id},
            {
                "$set": {
                    "lastMessage": message_data.content,
                    "lastMessageAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                },
                "$inc": {f"unreadCount.{message_data.recipientId}": 1}
            }
        )
        
        notif = Notification(
            userId=message_data.recipientId,
            type="message",
            title="Nouveau message",
            message=f"{current_user['firstName']} {current_user['lastName']} vous a envoyé un message",
            relatedId=conv_id,
            relatedUrl=f"/dashboard/messages#{conv_id}"
        )
        await db.notifications.insert_one(notif.dict())
        
        return {"conversationId": conv_id, "message": message.dict()}
    
    
    @router.get("/conversations/{conversation_id}/messages")
    async def get_messages(
        conversation_id: str, 
        current_user: dict = Depends(get_current_user), 
        skip: int = 0, 
        limit: int = 50
    ):
        """Messages d'une conversation"""
        if current_user.get("membershipStatus") != "active":
            raise HTTPException(status_code=403, detail="Accès réservé aux membres actifs")
        
        conversation = await db.private_conversations.find_one({
            "id": conversation_id,
            "members.userId": current_user["id"]
        })
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation non trouvée")
        
        cursor = db.private_messages.find({"conversationId": conversation_id}).sort("createdAt", -1).skip(skip).limit(limit)
        
        messages = []
        async for msg in cursor:
            messages.append(msg)
        
        await db.private_messages.update_many(
            {"conversationId": conversation_id, "senderId": {"$ne": current_user["id"]}, "isRead": False},
            {"$set": {"isRead": True}}
        )
        
        await db.private_conversations.update_one(
            {"id": conversation_id},
            {"$set": {f"unreadCount.{current_user['id']}": 0}}
        )
        
        return {"messages": list(reversed(messages))}
    
    
    # ===================== DOSSIERS COLLECTIFS =====================
    
    @router.post("/cases")
    async def create_case(case_data: CaseStudyCreate, current_user: dict = Depends(get_current_user)):
        """Créer dossier"""
        if current_user.get("membershipStatus") != "active":
            raise HTTPException(status_code=403, detail="Accès réservé aux membres actifs")
        
        case = CaseStudy(
            userId=current_user["id"],
            userFirstName=current_user["firstName"],
            userLastName=current_user["lastName"],
            title=case_data.title,
            description=case_data.description,
            category=case_data.category,
            documents=case_data.documents
        )
        
        await db.case_studies.insert_one(case.dict())
        return {"case": case.dict(), "message": "Dossier créé avec succès"}
    
    
    @router.get("/cases")
    async def get_cases(
        current_user: dict = Depends(get_current_user),
        status: Optional[str] = None,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ):
        """Liste dossiers"""
        if current_user.get("membershipStatus") != "active":
            raise HTTPException(status_code=403, detail="Accès réservé aux membres actifs")
        
        filter_query = {}
        if status:
            filter_query["status"] = status
        if category:
            filter_query["category"] = category
        
        cursor = db.case_studies.find(filter_query).sort("createdAt", -1).skip(skip).limit(limit)
        cases = []
        async for case in cursor:
            cases.append(case)
        
        total = await db.case_studies.count_documents(filter_query)
        return {"cases": cases, "total": total, "skip": skip, "limit": limit}
    
    
    @router.get("/cases/{case_id}")
    async def get_case(case_id: str, current_user: dict = Depends(get_current_user)):
        """Détail dossier"""
        if current_user.get("membershipStatus") != "active":
            raise HTTPException(status_code=403, detail="Accès réservé aux membres actifs")
        
        case = await db.case_studies.find_one({"id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail="Dossier non trouvé")
        
        return case
    
    
    @router.put("/cases/{case_id}")
    async def update_case(case_id: str, case_update: CaseStudyUpdate, current_user: dict = Depends(get_current_user)):
        """Modifier dossier"""
        if current_user.get("membershipStatus") != "active":
            raise HTTPException(status_code=403, detail="Accès réservé aux membres actifs")
        
        case = await db.case_studies.find_one({"id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail="Dossier non trouvé")
        
        if case["userId"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Vous ne pouvez modifier que vos propres dossiers")
        
        update_data = case_update.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        await db.case_studies.update_one({"id": case_id}, {"$set": update_data})
        return MessageResponse(message="Dossier mis à jour")
    
    
    @router.post("/cases/{case_id}/comments")
    async def add_case_comment(case_id: str, content: str, current_user: dict = Depends(get_current_user)):
        """Commenter dossier"""
        if current_user.get("membershipStatus") != "active":
            raise HTTPException(status_code=403, detail="Accès réservé aux membres actifs")
        
        case = await db.case_studies.find_one({"id": case_id})
        if not case:
            raise HTTPException(status_code=404, detail="Dossier non trouvé")
        
        comment = CaseStudyComment(
            userId=current_user["id"],
            userFirstName=current_user["firstName"],
            userLastName=current_user["lastName"],
            content=content
        )
        
        await db.case_studies.update_one(
            {"id": case_id},
            {"$push": {"comments": comment.dict()}, "$set": {"updatedAt": datetime.utcnow()}}
        )
        
        if case["userId"] != current_user["id"]:
            notif = Notification(
                userId=case["userId"],
                type="comment",
                title="Nouveau commentaire sur votre dossier",
                message=f"{current_user['firstName']} {current_user['lastName']} a commenté votre dossier",
                relatedId=case_id,
                relatedUrl=f"/dashboard/cases/{case_id}"
            )
            await db.notifications.insert_one(notif.dict())
        
        return {"comment": comment.dict(), "message": "Commentaire ajouté"}
    
    
    # ===================== NOTIFICATIONS =====================
    
    @router.get("/notifications")
    async def get_notifications(
        current_user: dict = Depends(get_current_user),
        unread_only: bool = False,
        skip: int = 0,
        limit: int = 20
    ):
        """Liste notifications"""
        filter_query = {"userId": current_user["id"]}
        if unread_only:
            filter_query["isRead"] = False
        
        cursor = db.notifications.find(filter_query).sort("createdAt", -1).skip(skip).limit(limit)
        notifications = []
        async for notif in cursor:
            notifications.append(notif)
        
        unread_count = await db.notifications.count_documents({"userId": current_user["id"], "isRead": False})
        
        return {"notifications": notifications, "unreadCount": unread_count, "skip": skip, "limit": limit}
    
    
    @router.put("/notifications/{notification_id}/read")
    async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
        """Marquer notification lue"""
        result = await db.notifications.update_one(
            {"id": notification_id, "userId": current_user["id"]},
            {"$set": {"isRead": True}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Notification non trouvée")
        
        return MessageResponse(message="Notification marquée comme lue")
    
    
    @router.put("/notifications/read-all")
    async def mark_all_read(current_user: dict = Depends(get_current_user)):
        """Marquer toutes lues"""
        await db.notifications.update_many(
            {"userId": current_user["id"], "isRead": False},
            {"$set": {"isRead": True}}
        )
        
        return MessageResponse(message="Toutes les notifications ont été marquées comme lues")
    
    return router
