"""
Service d'Analytics - Tracking des visiteurs et statistiques
ETF - En Toute Franchise
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from urllib.parse import urlparse, parse_qs
import re
import hashlib
import logging

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service pour le tracking des visiteurs et les statistiques"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.page_views = db.page_views
        self.visitors = db.visitors
        self.sessions = db.visitor_sessions
    
    async def init_indexes(self):
        """Créer les index pour optimiser les requêtes"""
        try:
            # Index pour les page views
            await self.page_views.create_index("visitor_id")
            await self.page_views.create_index("timestamp")
            await self.page_views.create_index("page_url")
            await self.page_views.create_index("referrer_domain")
            await self.page_views.create_index([("timestamp", -1)])
            
            # Index pour les visiteurs
            await self.visitors.create_index("fingerprint", unique=True, sparse=True)
            await self.visitors.create_index("last_visit")
            await self.visitors.create_index("is_online")
            
            # Index pour les sessions
            await self.sessions.create_index("visitor_id")
            await self.sessions.create_index("started_at")
            
            logger.info("Analytics indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating analytics indexes: {e}")
    
    def _parse_user_agent(self, user_agent: str) -> Dict:
        """Parser le User-Agent pour extraire device, browser, OS"""
        result = {
            "device_type": "desktop",
            "browser": "Unknown",
            "os": "Unknown"
        }
        
        if not user_agent:
            return result
        
        ua_lower = user_agent.lower()
        
        # Device type
        if any(x in ua_lower for x in ["mobile", "android", "iphone", "ipod"]):
            result["device_type"] = "mobile"
        elif any(x in ua_lower for x in ["ipad", "tablet"]):
            result["device_type"] = "tablet"
        
        # Browser
        if "firefox" in ua_lower:
            result["browser"] = "Firefox"
        elif "edg" in ua_lower:
            result["browser"] = "Edge"
        elif "chrome" in ua_lower:
            result["browser"] = "Chrome"
        elif "safari" in ua_lower:
            result["browser"] = "Safari"
        elif "opera" in ua_lower or "opr" in ua_lower:
            result["browser"] = "Opera"
        
        # OS
        if "windows" in ua_lower:
            result["os"] = "Windows"
        elif "mac os" in ua_lower or "macos" in ua_lower:
            result["os"] = "macOS"
        elif "linux" in ua_lower:
            result["os"] = "Linux"
        elif "android" in ua_lower:
            result["os"] = "Android"
        elif "iphone" in ua_lower or "ipad" in ua_lower:
            result["os"] = "iOS"
        
        return result
    
    def _extract_referrer_info(self, referrer: str) -> Dict:
        """Extraire les informations du referrer (domaine, recherche Google)"""
        result = {
            "referrer_domain": None,
            "search_query": None
        }
        
        if not referrer:
            return result
        
        try:
            parsed = urlparse(referrer)
            result["referrer_domain"] = parsed.netloc
            
            # Extraction des mots-clés de recherche Google
            if "google" in parsed.netloc:
                query_params = parse_qs(parsed.query)
                if "q" in query_params:
                    result["search_query"] = query_params["q"][0]
            
            # Bing
            elif "bing" in parsed.netloc:
                query_params = parse_qs(parsed.query)
                if "q" in query_params:
                    result["search_query"] = query_params["q"][0]
            
            # Yahoo
            elif "yahoo" in parsed.netloc:
                query_params = parse_qs(parsed.query)
                if "p" in query_params:
                    result["search_query"] = query_params["p"][0]
                    
        except Exception as e:
            logger.error(f"Error parsing referrer: {e}")
        
        return result
    
    def _generate_visitor_id(self, ip: str, user_agent: str) -> str:
        """Générer un ID visiteur basé sur IP + User-Agent"""
        data = f"{ip}_{user_agent}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    async def track_page_view(
        self,
        page_url: str,
        page_title: Optional[str] = None,
        referrer: Optional[str] = None,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
        visitor_id: Optional[str] = None,
        session_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict:
        """Enregistrer une vue de page"""
        try:
            # Générer visitor_id si non fourni
            if not visitor_id and ip_address and user_agent:
                visitor_id = self._generate_visitor_id(ip_address, user_agent)
            
            # Parser les informations
            ua_info = self._parse_user_agent(user_agent)
            ref_info = self._extract_referrer_info(referrer)
            
            # Créer l'enregistrement de page view
            page_view = {
                "id": str(datetime.utcnow().timestamp()).replace(".", ""),
                "visitor_id": visitor_id,
                "page_url": page_url,
                "page_title": page_title,
                "referrer": referrer,
                "referrer_domain": ref_info["referrer_domain"],
                "search_query": ref_info["search_query"],
                "user_agent": user_agent,
                "ip_address": ip_address,
                "device_type": ua_info["device_type"],
                "browser": ua_info["browser"],
                "os": ua_info["os"],
                "session_id": session_id,
                "user_id": user_id,
                "timestamp": datetime.utcnow()
            }
            
            await self.page_views.insert_one(page_view)
            
            # Mettre à jour ou créer le visiteur
            await self._update_visitor(visitor_id, page_url, ua_info)
            
            return {"success": True, "visitor_id": visitor_id}
            
        except Exception as e:
            logger.error(f"Error tracking page view: {e}")
            return {"success": False, "error": str(e)}
    
    async def _update_visitor(self, visitor_id: str, current_page: str, ua_info: Dict):
        """Mettre à jour les informations du visiteur"""
        try:
            visitor = await self.visitors.find_one({"id": visitor_id})
            
            if visitor:
                await self.visitors.update_one(
                    {"id": visitor_id},
                    {
                        "$set": {
                            "last_visit": datetime.utcnow(),
                            "current_page": current_page,
                            "is_online": True
                        },
                        "$inc": {
                            "total_visits": 1,
                            "total_page_views": 1
                        }
                    }
                )
            else:
                new_visitor = {
                    "id": visitor_id,
                    "fingerprint": visitor_id,
                    "first_visit": datetime.utcnow(),
                    "last_visit": datetime.utcnow(),
                    "total_visits": 1,
                    "total_page_views": 1,
                    "device_type": ua_info["device_type"],
                    "browser": ua_info["browser"],
                    "os": ua_info["os"],
                    "is_online": True,
                    "current_page": current_page
                }
                await self.visitors.insert_one(new_visitor)
                
        except Exception as e:
            logger.error(f"Error updating visitor: {e}")
    
    async def set_visitor_offline(self, visitor_id: str):
        """Marquer un visiteur comme hors ligne"""
        try:
            await self.visitors.update_one(
                {"id": visitor_id},
                {"$set": {"is_online": False, "current_page": None}}
            )
        except Exception as e:
            logger.error(f"Error setting visitor offline: {e}")
    
    async def get_online_visitors(self) -> List[Dict]:
        """Récupérer la liste des visiteurs en ligne"""
        try:
            # Considérer comme en ligne si activité dans les 5 dernières minutes
            threshold = datetime.utcnow() - timedelta(minutes=5)
            
            visitors = await self.visitors.find({
                "last_visit": {"$gte": threshold}
            }).to_list(100)
            
            return visitors
        except Exception as e:
            logger.error(f"Error getting online visitors: {e}")
            return []
    
    async def get_stats(self, days: int = 30) -> Dict:
        """Récupérer les statistiques agrégées"""
        try:
            now = datetime.utcnow()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            period_start = now - timedelta(days=days)
            
            # Statistiques globales
            total_page_views = await self.page_views.count_documents({
                "timestamp": {"$gte": period_start}
            })
            
            total_visitors = await self.visitors.count_documents({
                "last_visit": {"$gte": period_start}
            })
            
            # Statistiques du jour
            page_views_today = await self.page_views.count_documents({
                "timestamp": {"$gte": today_start}
            })
            
            unique_visitors_today = len(await self.page_views.distinct(
                "visitor_id",
                {"timestamp": {"$gte": today_start}}
            ))
            
            # Visiteurs en ligne
            online_threshold = now - timedelta(minutes=5)
            visitors_online = await self.visitors.count_documents({
                "last_visit": {"$gte": online_threshold}
            })
            
            # Top pages
            top_pages_pipeline = [
                {"$match": {"timestamp": {"$gte": period_start}}},
                {"$group": {"_id": "$page_url", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 10}
            ]
            top_pages = await self.page_views.aggregate(top_pages_pipeline).to_list(10)
            
            # Top referrers
            top_referrers_pipeline = [
                {"$match": {
                    "timestamp": {"$gte": period_start},
                    "referrer_domain": {"$ne": None, "$exists": True}
                }},
                {"$group": {"_id": "$referrer_domain", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 10}
            ]
            top_referrers = await self.page_views.aggregate(top_referrers_pipeline).to_list(10)
            
            # Top recherches Google
            top_searches_pipeline = [
                {"$match": {
                    "timestamp": {"$gte": period_start},
                    "search_query": {"$ne": None, "$exists": True}
                }},
                {"$group": {"_id": "$search_query", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 10}
            ]
            top_searches = await self.page_views.aggregate(top_searches_pipeline).to_list(10)
            
            # Visiteurs par device
            devices_pipeline = [
                {"$match": {"timestamp": {"$gte": period_start}}},
                {"$group": {"_id": "$device_type", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            visitors_by_device = await self.page_views.aggregate(devices_pipeline).to_list(10)
            
            # Visiteurs par jour (derniers 30 jours)
            daily_pipeline = [
                {"$match": {"timestamp": {"$gte": period_start}}},
                {
                    "$group": {
                        "_id": {
                            "$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}
                        },
                        "page_views": {"$sum": 1},
                        "unique_visitors": {"$addToSet": "$visitor_id"}
                    }
                },
                {
                    "$project": {
                        "_id": 1,
                        "page_views": 1,
                        "unique_visitors": {"$size": "$unique_visitors"}
                    }
                },
                {"$sort": {"_id": 1}}
            ]
            visitors_by_day = await self.page_views.aggregate(daily_pipeline).to_list(31)
            
            # Browsers
            browsers_pipeline = [
                {"$match": {"timestamp": {"$gte": period_start}}},
                {"$group": {"_id": "$browser", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            visitors_by_browser = await self.page_views.aggregate(browsers_pipeline).to_list(10)
            
            return {
                "total_visitors": total_visitors,
                "total_page_views": total_page_views,
                "unique_visitors_today": unique_visitors_today,
                "page_views_today": page_views_today,
                "visitors_online": visitors_online,
                "top_pages": [{"page": p["_id"], "views": p["count"]} for p in top_pages],
                "top_referrers": [{"domain": r["_id"], "visits": r["count"]} for r in top_referrers],
                "top_search_queries": [{"query": s["_id"], "count": s["count"]} for s in top_searches],
                "visitors_by_device": [{"device": d["_id"], "count": d["count"]} for d in visitors_by_device],
                "visitors_by_browser": [{"browser": b["_id"], "count": b["count"]} for b in visitors_by_browser],
                "visitors_by_day": [
                    {"date": d["_id"], "page_views": d["page_views"], "unique_visitors": d["unique_visitors"]}
                    for d in visitors_by_day
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting analytics stats: {e}")
            return {}
    
    async def get_realtime_stats(self) -> Dict:
        """Statistiques en temps réel (dernières 30 minutes)"""
        try:
            now = datetime.utcnow()
            threshold = now - timedelta(minutes=30)
            
            # Page views des 30 dernières minutes
            recent_views = await self.page_views.find({
                "timestamp": {"$gte": threshold}
            }).sort("timestamp", -1).to_list(100)
            
            # Visiteurs en ligne
            online_visitors = await self.get_online_visitors()
            
            # Activité par minute
            activity_pipeline = [
                {"$match": {"timestamp": {"$gte": threshold}}},
                {
                    "$group": {
                        "_id": {
                            "$dateToString": {"format": "%H:%M", "date": "$timestamp"}
                        },
                        "count": {"$sum": 1}
                    }
                },
                {"$sort": {"_id": 1}}
            ]
            activity_by_minute = await self.page_views.aggregate(activity_pipeline).to_list(30)
            
            return {
                "visitors_online": len(online_visitors),
                "online_visitors": online_visitors,
                "recent_page_views": len(recent_views),
                "recent_activity": recent_views[:20],
                "activity_by_minute": [
                    {"time": a["_id"], "views": a["count"]} 
                    for a in activity_by_minute
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting realtime stats: {e}")
            return {}


# Instance globale (sera initialisée avec la DB)
analytics_service: Optional[AnalyticsService] = None


def init_analytics_service(db: AsyncIOMotorDatabase):
    """Initialiser le service d'analytics"""
    global analytics_service
    analytics_service = AnalyticsService(db)
    return analytics_service
