from fastapi import APIRouter, HTTPException, Depends  # For the API
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials  # For user authentication
import jwt  # JSON Web Token for user authentication
from jwt import PyJWTError  # Gets thrown in case the JWT is not valid
from datetime import datetime, timedelta  # For token expiration
from backend.db_service import database as db  # Allows the manipulation and reading of the database

router = APIRouter()

# Security for user authentication: Authorization header with Bearer token
security = HTTPBearer()

# Authorization configuration
SECRET_KEY = "your-secret-key"  # TODO: Move outside of the public codebase
ALGORITHM = "HS256"  # Algorithm used for encoding the token
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # TODO: Change to a lower value for production


def create_access_token(user_id: int) -> str:
    """
    Creates a new access token (JWT) for a user.

    Args:
        user_id: The user ID (integer).

    Returns:
        The encoded JWT token (string).
    """

    # Raise an error if the user ID is not valid
    if not user_id:
        raise ValueError("User ID is not valid")

    # Create payload with user ID and expiration time
    expiration_time = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"user_id": user_id, "exp": expiration_time}

    # Encode the token using the secret key and algorithm
    encoded_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_token


def is_privileged(current_user_id: dict) -> bool:
    """
    Checks if the current user is an admin or moderator.

    Args:
        current_user_id: The ID of the current user (integer).

    Returns:
        True if the user is an admin or moderator. Otherwise, False.
    """

    current_user_role = db.get_role_by_id(current_user_id)

    return current_user_role in ["admin", "moderator"]


# ------------------------- Get Requests -------------------------
@router.get("/get_current_user_id/")
async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Returns the user ID of the current user using the Bearer token from the Authorization header.

    Args:
        credentials: The HTTPAuthorizationCredentials object. Requires the Authorization header with a Bearer token.

    Returns:
        The user ID (integer).
    """

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")

        if not user_id:  # Token is not valid
            raise HTTPException(status_code=401, detail="Invalid token")

        return {"user_id": user_id}

    except PyJWTError:  # Token is not valid
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/get_current_user/")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Returns all user data of the current user using the Bearer token from the Authorization header.

    Args:
        credentials: The HTTPAuthorizationCredentials object. Requires the Authorization header with a Bearer token.

    Returns:
        The user object (dictionary).
    """

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")

        if not user_id:  # Token is not valid
            raise HTTPException(status_code=401, detail="Invalid token")

        return {"user": db.get_user_by_id(user_id)}

    except PyJWTError:  # Token is not valid
        raise HTTPException(status_code=401, detail="Invalid token")
