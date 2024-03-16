from typing import Annotated  # For type hinting

from fastapi import APIRouter, HTTPException, Depends  # For the API
from backend.api.endpoints.auth import get_current_user, get_current_user_id  # For user authentication
from backend.db_service import database as db  # Allows the manipulation and reading of the database

router = APIRouter(
    prefix="/users",
    tags=["users"]
)


# ------------------------- Get Requests -------------------------
@router.get("/me/")
async def get_current_user(current_user: Annotated[dict, Depends(get_current_user)]):
    """
    Returns the current user.

    Args:
        current_user: The current user (dictionary).

    Returns:
        A user object (dictionary).
    """

    return current_user


@router.get("/me/id/")
async def get_current_user_id(current_user_id: Annotated[int, Depends(get_current_user_id)]):
    """
    Returns the ID of the current user.

    Args:
        current_user_id: The ID of the current user (integer).

    Returns:
        The user ID (integer).
    """

    return {"user_id": current_user_id}


@router.get("/id/{user_id}/")
async def get_user_by_id(user_id: int, current_user_id: Annotated[int, Depends(get_current_user_id)]):
    """
    Returns a user by its ID.

    Args:
        user_id: The ID of the user (integer).
        current_user_id: The current user (integer).

    Returns:
        A user object (dictionary).
    """

    user = db.get_user_by_id(user_id)
    current_user = db.get_user_by_id(current_user_id)

    if not user or not current_user:  # User not found
        raise HTTPException(status_code=404, detail="User not found")

    # Only users themselves or admins can access user data
    if user_id != current_user_id and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="You are not allowed to access this resource")

    return {"user": user}


@router.get("/id/{user_id}/username/")
async def get_username_by_id(user_id: int):
    """
    Returns the username of a user by its ID.

    Args:
        user_id: The ID of the user (integer).

    Returns:
        A dictionary containing the username of the user.
    """

    username = db.get_username_by_id(user_id)

    if username is None:  # User not found
        raise HTTPException(status_code=404, detail="User not found")

    return {"username": username}


@router.get("/id/{user_id}/role/")
async def get_role_by_id(user_id: int):
    """
    Returns the role of a user by its ID.
    Args:
        user_id: The ID of the user (integer).

    Returns:
        A dictionary containing the role of the user.
    """

    role = db.get_role_by_id(user_id)

    if role is None:
        raise HTTPException(status_code=404, detail="User not found")

    return {"role": role}


@router.get("/chats/all/")
async def get_chats_of_user(current_user_id: Annotated[int, Depends(get_current_user_id)]):
    """
    Returns all chats of a user.
    Args:
        current_user_id: The ID of the current user (integer).

    Returns:
        A list of chat objects (dictionaries).
    """

    return {"chats": db.get_chats_of_user(current_user_id)}


# ------------------------- Post Requests -------------------------


# ------------------------- Put Requests -------------------------


# ------------------------- Delete Requests -------------------------

