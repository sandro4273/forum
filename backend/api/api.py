# Programmierprojekt Forum, 06.03.2024
# Luca Flühler, Lucien Ruffet, Sandro Kuster
# Beschreibung: API für das Forum mit FastAPI

from fastapi import APIRouter  # Needed to connect the endpoints
from .endpoints import users, posts, chats, comments, auth  # Import all endpoint routers

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(posts.router)
api_router.include_router(chats.router)
api_router.include_router(comments.router)
