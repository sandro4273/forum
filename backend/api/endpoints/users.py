from typing import (
    Annotated,  # For type hinting
    Optional,  # For optional data types
    List  # For lists
)

from fastapi import (
    Depends,  # For requiring parameters, e.g. the current user ID
    APIRouter,  # For distributing endpoints into separate files
    HTTPException,  # For raising exceptions with custom details
    Query  # For query parameters
)

from backend.api.endpoints.auth import get_current_user, get_current_user_id  # For retrieving the logged-in user
from backend.db_service.models import User  # Models for data transfer
from backend.db_service import database as db  # Allows the manipulation and reading of the database

# API router for the user endpoints
router = APIRouter(
    prefix="/users",
    tags=["users"]  # Tags for the API documentation
)


def filter_user_fields(user: User, fields: Optional[List[str]]) -> User:
    """
    Filters the user data based on the specified fields.

    Args:
        user: The user object to be filtered.
        fields: Optional parameter specifying which fields to include.

    Returns:
        A new User object containing only the specified fields.
    """
    if not fields:
        return user

    print(fields)
    user_dict = user.dict()
    filtered_user_dict = {field: user_dict[field] for field in fields if field in user_dict}
    print(filtered_user_dict)
    return User(**filtered_user_dict)


# ------------------------- Get Requests -------------------------
@router.get("/me/")
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
    fields: Optional[List[str]] = Query(None, description="Comma-separated list of fields to include in the response")
) -> dict[str, User]:
    """
    Returns user information of the logged-in user.

    Args:
        current_user: The logged-in user information (User).
        fields: Optional parameter specifying which fields to include in the response.

    Returns:
        A dictionary containing the user information (User).
    """

    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    if fields:  # If fields parameter is provided, filter user data
        current_user = filter_user_fields(current_user, fields[0].split(","))

    return {"user": current_user}


@router.get("/me/chats/")
async def get_chats_of_user(current_user_id: Annotated[int, Depends(get_current_user_id)]):
    """
    Returns all chats of a user.
    Args:
        current_user_id: The ID of the current user (integer).
    Returns:
        A list of chat objects (dictionaries).
    """

    return {"chats": db.get_chats_of_user(current_user_id)}


@router.get("/id/{user_id}/")
async def get_user_by_id(
    user_id: int,
    fields: Optional[List[str]] = Query(None, description="Comma-separated list of fields to include in the response")
) -> dict[str, User]:
    """
    If a user with the given user_id exists, its public information is returned.
    """

    user = db.get_public_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if fields:  # If fields parameter is provided, filter user data
        user = filter_user_fields(user, fields)

    return {"user": user}


# ------------------------- Post Requests -------------------------


# ------------------------- Put Requests -------------------------


# ------------------------- Delete Requests -------------------------

