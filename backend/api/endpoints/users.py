from fastapi import APIRouter, HTTPException, Depends  # For the API
from backend.api.endpoints.utility import get_current_user_id, create_access_token  # For user authentication
from backend.api.endpoints.schemas import SignupData, LoginData  # Data models for the API
from backend.db_service import database as db  # Allows the manipulation and reading of the database

router = APIRouter(
    prefix="/users",
    tags=["users"]
)


# ------------------------- Get Requests -------------------------
@router.get("/id/{user_id}/")
async def get_user_by_id(user_id: int, current_user: dict = Depends(get_current_user_id)):
    """
    Returns a user by its ID.

    Args:
        user_id: The ID of the user (integer).
        current_user: The current user (dictionary).

    Returns:
        A user object (dictionary).
    """
    current_user_id = current_user["user_id"]

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


@router.get("/name/{username}/role/")  # TODO: Use id instead of name
async def get_role_of_user_by_name(username: str):
    """
    Returns the role of a user by its name.

    Args:
        username: The username of the user (string).

    Returns:
        A dictionary containing the role of the user.
    """

    role = db.get_role_of_user_by_name(username)

    if role is None:  # User not found
        raise HTTPException(status_code=404, detail="User not found")

    return {"role": role}


@router.get("/id/{user_id}/role/")
async def get_role_by_id(username: str):
    """
    Returns the role of a user by its name.

    Args:
        username: The username of the user (string).

    Returns:
        A dictionary containing the role of the user.
    """

    role = db.get_role_of_user_by_name(username)

    if role is None:
        raise HTTPException(status_code=404, detail="User not found")

    return {"role": role}


@router.get("/chats/all/")
async def get_chats_of_user(current_user: dict = Depends(get_current_user_id)):
    """
    Returns all chats of the current user.

    Args:
        current_user: The current user (dictionary).

    Returns:
        A list of chat objects (dictionaries).
    """
    current_user_id = current_user["user_id"]

    return {"chats": db.get_chats_of_user(current_user_id)}


# ------------------------- Post Requests -------------------------
@router.post("/signup/")
async def create_user(user: SignupData):
    """
    Creates a new user.

    Args:
        user: The SignupData object containing the username, email and password of the user.
                   SignupData is a Pydantic model which automatically validates the data. Raises a 422 error if the
                   data is not valid.

    Returns:
        The user data (dictionary).
    """

    db.create_user(user.username,
                   user.email,
                   user.password)

    return {"user": user}


@router.post("/login/")
async def login_user(login_data: LoginData):
    """
    Logs in a user and returns an access token which can then be saved in the client's local storage.

    Args:
        login_data: The LoginData object containing the email and password of the user.

    Returns:
        A dictionary containing the access token and token type.
    """

    user_id = db.login_user(login_data.email, login_data.password)

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    auth_token = create_access_token(user_id)

    if not auth_token:
        raise HTTPException(status_code=500, detail="Could not create token")

    return {"auth_token": auth_token, "token_type": "bearer"}


# ------------------------- Put Requests -------------------------


# ------------------------- Delete Requests -------------------------

