from fastapi import APIRouter, Body  # For the API
from typing import Annotated  # For receiving data from the request body
from backend.db_service import database as db  # Allows the manipulation and reading of the database

router = APIRouter(
    prefix="/chats",
    tags=["chats"]
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
    return {"chat": db.get_chat_by_id(chat_id)}


@router.get("/id/{chat_id}/messages/all/")
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
@router.post("/create_chat/")
async def create_chat(user1: Annotated[int, Body()], user2: Annotated[int, Body()]):
    """
    Creates a new chat between two users.

    Args:
        user1: The ID of the first user (integer).
        user2: The ID of the second user (integer).

    Returns:
        A dictionary containing the user IDs of the two users.
    """

    # Check if chat already exists
    if db.check_chat_exists(user1, user2):
        return {"message": "Chat already exists"}

    # Check if both users exist
    if not db.check_user_exists(user1) or not db.check_user_exists(user2):
        return {"message": "User does not exist"}

    db.create_chat(user1, user2)
    return {"user1": user1, "user2": user2}


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
