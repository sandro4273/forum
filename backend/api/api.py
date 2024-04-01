"""
Programmierprojekt Forum, 2024-04-01
Luca Flühler, Lucien Ruffet, Sandro Kuster

Dieses Modul verbindet alle Endpunkte der API und fügt sie zu einem Router zusammen. Der Router wird in der
main.py-Datei verwendet, um die API zu starten. Als Framework für die API wird FastAPI verwendet. FastAPI ist ein
schnelles (High-Performance) Web-Framework für Python, das auf Starlette und Pydantic basiert. Es ist einfach zu
bedienen und bietet eine automatische Dokumentation der API (https://fastapi.tiangolo.com/).
"""

from fastapi import APIRouter  # Needed to connect the endpoints
from .endpoints import users, posts, chats, comments, auth  # Import all endpoint routers

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(posts.router)
api_router.include_router(chats.router)
api_router.include_router(comments.router)
