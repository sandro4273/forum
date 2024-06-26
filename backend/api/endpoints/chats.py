"""
Programmierprojekt Forum, 2024-04-01
Luca Flühler, Lucien Ruffet, Sandro Kuster

Dieses Modul enthält die Chat-Endpunkte der API. Die Endpunkte umfassen das Erstellen eines Chats, das Abrufen eines Chats
anhand der ID, das Abrufen aller Nachrichten eines Chats und das Erstellen einer Nachricht in einem Chat.
"""

from typing import Annotated  # For receiving data from the request body

from fastapi import (
    Depends,  # For requiring parameters, e.g. the current user ID
    APIRouter,  # For distributing endpoints into separate files
    HTTPException,  # For raising exceptions with custom details
    Body,  # For receiving data from the request body
)

from backend.api.endpoints.auth import get_current_user_id  # For user authentication
from backend.db_service import database as db  # Allows the manipulation and reading of the database

# API router for the chat endpoints
router = APIRouter(
    prefix="/chats",
    tags=["chats"]  # Tags for the API documentation
)


# ------------------------- Get Requests -------------------------
@router.get("/id/{chat_id}/")
async def get_chat_by_id(chat_id: int):
    """
    Returns a chat by its ID.

    Args:
        chat_id: The ID of the chat (integer).

    Returns:
        A chat object (dictionary).
    """
    chat = db.get_chat_by_id(chat_id)
    
    # Check if chat exists
    if chat is None:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return {"chat": db.get_chat_by_id(chat_id)}


@router.get("/id/{chat_id}/messages/")
async def get_messages_of_chat(chat_id: int):
    """
    Returns all messages of a chat.

    Args:
        chat_id: The ID of the chat (integer).

    Returns:
        A list of message objects (dictionaries).
    """

    return {"messages": db.get_messages_of_chat(chat_id)}


# ------------------------- Post-Requests -------------------------
@router.post("/create/")
async def create_chat(
    partner_id: Annotated[int, Body()],
    current_user_id: Annotated[int, Depends(get_current_user_id)]
):
    """
    Creates a new chat between two users.

    Args:
        partner_id: The ID of the partner user (integer).
        current_user_id: The ID of the current user (integer).

    Returns:
        A dictionary containing the user IDs of the two users.
    """

    # Check if chat already exists
    if db.check_chat_exists(current_user_id, partner_id):
        raise HTTPException(status_code=400, detail="Chat already exists")

    # Check if both users exist
    if not db.check_user_exists(current_user_id) or not db.check_user_exists(partner_id):
        raise HTTPException(status_code=404, detail="User does not exist")

    db.create_chat(current_user_id, partner_id)
    return {"current_user_id": current_user_id, "partner_id": partner_id}


@router.post("/id/{chat_id}/create_message/")
async def create_chat_message(chat_id: int, user_id: Annotated[int, Body()], message: Annotated[str, Body()]):
    """
    Creates a new message in a chat.

    Args:
        chat_id: The ID of the chat (integer).
        user_id: The ID of the user (integer).
        message: The message content (string).

    Returns:
        A dictionary containing the chat ID, user ID and message content.
    """

    db.create_chat_msg(chat_id, user_id, message)
    return {"chat_id": chat_id, "user_id": user_id, "message": message}

# ------------------------- Put-Requests -------------------------


# ------------------------- Delete-Requests -------------------------
