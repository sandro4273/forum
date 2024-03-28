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

from backend.api.endpoints.auth import get_current_user, get_current_user_id, get_role_permissions  # For retrieving the logged-in user and permissions
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
    fields: Optional[str] = Query(None, description="Comma-separated list of fields to include in the response")
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
        current_user = filter_user_fields(current_user, fields.split(","))

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
    fields: Optional[str] = Query(None, description="Comma-separated list of fields to include in the response")
) -> dict[str, User]:
    """
    If a user with the given user_id exists, its public information is returned.
    """

    user = db.get_public_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if fields:  # If fields parameter is provided, filter user data
        user = filter_user_fields(user, fields.split(","))

    return {"user": user}


@router.get("/name/{username}/")
async def get_user_by_username(
    username: str,
    fields: Optional[str] = Query(None, description="Comma-separated list of fields to include in the response")
) -> dict[str, User]:
    """
    If a user with the given username exists, its public information is returned.
    """

    user = db.get_public_user_by_username(username)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if fields:  # If fields parameter is provided, filter user data
        user = filter_user_fields(user, fields.split(","))
    
    return {"user": user}


# ------------------------- Post Requests -------------------------
@router.post("/id/{user_id}/ban/")
async def ban_user(user_id: int, current_user_id: Annotated[int, Depends(get_current_user_id)]):
    """
    Bans a user with the given user_id.
    """

    # Verify if the current user can ban this user
    current_user_role = db.get_user_by_id(current_user_id).role
    user_role = db.get_user_by_id(user_id).role
    role_permissions = get_role_permissions(current_user_role)

    if role_permissions["canBanUser"] and user_role == "user":
        db.update_role(user_id, "banned")
        return {"message": "User has been banned."}
    else:
        raise HTTPException(status_code=403, detail="You do not have permission to ban this user.")


@router.post("/id/{user_id}/promote/moderator/")
async def promote_user_to_moderator(user_id: int, current_user_id: Annotated[int, Depends(get_current_user_id)]):
    """
    Promotes a user with the given user_id to moderator.
    """

    # Verify if the current user can promote this user
    current_user_role = db.get_user_by_id(current_user_id).role
    user_role = db.get_user_by_id(user_id).role
    role_permissions = get_role_permissions(current_user_role)

    if role_permissions["canPromoteToMod"] and user_role == "user":
        db.update_role(user_id, "moderator")
        return {"message": "User has been promoted to moderator."}
    else:
        raise HTTPException(status_code=403, detail="You do not have permission to promote this user to moderator.")
    

@router.post("/id/{user_id}/promote/admin/")
async def promote_user_to_admin(user_id: int, current_user_id: Annotated[int, Depends(get_current_user_id)]):
    """
    Promotes a user with the given user_id to admin.
    """

    # Verify if the current user can promote this user
    current_user_role = db.get_user_by_id(current_user_id).role
    user_role = db.get_user_by_id(user_id).role
    role_permissions = get_role_permissions(current_user_role)

    if role_permissions["canPromoteToAdmin"] and (user_role == 'user' or user_role == 'moderator'):
        db.update_role(user_id, "admin")
        return {"message": "User has been promoted to admin."}
    else:
        raise HTTPException(status_code=403, detail="You do not have permission to promote this user to admin.")


@router.post("/id/{user_id}/demote/moderator/")
async def demote_moderator_to_user(user_id: int, current_user_id: Annotated[int, Depends(get_current_user_id)]):
    """
    Demotes a moderator with the given user_id to user.
    """

    # Verify if the current user can demote this user
    current_user_role = db.get_user_by_id(current_user_id).role
    user_role = db.get_user_by_id(user_id).role
    role_permissions = get_role_permissions(current_user_role)

    if role_permissions["canDemoteMod"] and user_role == "moderator":
        db.update_role(user_id, "user")
        return {"message": "User has been demoted to user."}
    else:
        raise HTTPException(status_code=403, detail="You do not have permission to demote this user to user.")
    

@router.post("/id/{user_id}/demote/admin/")
async def demote_admin_to_moderator(user_id: int, current_user_id: Annotated[int, Depends(get_current_user_id)]):
    """
    Demotes an admin with the given user_id to moderator.
    """

    # Verify if the current user can demote this user
    current_user_role = db.get_user_by_id(current_user_id).role
    user_role = db.get_user_by_id(user_id).role
    role_permissions = get_role_permissions(current_user_role)

    if role_permissions["canDemoteAdmin"] and user_role == "admin":
        db.update_role(user_id, "moderator")
        return {"message": "User has been demoted to moderator."}
    else:
        raise HTTPException(status_code=403, detail="You do not have permission to demote this user to moderator.")
    
# ------------------------- Put Requests -------------------------


# ------------------------- Delete Requests -------------------------

