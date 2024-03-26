import os
import json  # For parsing the SECRET_KEY from the config.json file and roles.json

import jwt  # JSON Web Token for user authentication
from jwt import PyJWTError  # Gets thrown in case the JWT is not valid

from typing import (
    Annotated,  # For type hinting
    Optional  # For optional parameters
)

from datetime import datetime, timedelta  # For token expiration time
from passlib.context import CryptContext  # For password hashing and verification

from fastapi import (
    Depends,  # For requiring parameters, e.g. the current user ID
    APIRouter,  # For distributing endpoints into separate files
    HTTPException,  # For raising exceptions with custom details
    status  # For HTTP status codes, e.g. 404 for "Not Found"
)

from fastapi.security import (
    OAuth2PasswordBearer,  # For user authentication using OAuth2
    OAuth2PasswordRequestForm  # For receiving the username and password from the request body
)

from backend.db_service.models import SignupData, User  # Models for data transfer
from backend.db_service import database as db  # Allows the manipulation and reading of the database

# API router for the authentication endpoints
router = APIRouter(
    prefix="/auth",
    tags=["auth"]  # Tags for the API documentation
)

# Security for user authentication: Password hashing using the bcrypt algorithm.
# The deprecated parameter is set to "auto" to automatically update the hashing algorithm.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security for user authentication: Authorization header with Bearer token using OAuth2
# The token URL is used for the login endpoint.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login/")

# Authorization configuration
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(CURRENT_DIR, "../../config.json")  # The secret key is stored in the config.json file

# Load the secret key from the config.json file
with open(CONFIG_PATH, 'r') as f:
    config = json.load(f)
    SECRET_KEY = config['SECRET_KEY']

ALGORITHM = "HS256"  # Algorithm used for encoding the token

# Time after which the token expires (in minutes)
# TODO: Change to a lower value for production. (1440 minutes = 24 hours)
# Maybe a refresh system for the token is needed.
ACCESS_TOKEN_EXPIRE_MINUTES = 1440


# ------------------------- Utility Functions -------------------------
def is_privileged(current_user_id: int) -> bool:
    """
    Checks if the current user is an admin or moderator.

    Args:
        current_user_id: The ID of the current user (integer).

    Returns:
        True if the user is an admin or moderator. Otherwise, False.
    """

    current_user_role = db.get_public_user_by_id(current_user_id).role

    return current_user_role in ["admin", "moderator"]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a password using bcrypt.

    Args:
        plain_password: The plain password (string).
        hashed_password: The hashed password (string).

    Returns:
        True if the hashed form of the plain password matches the hashed password. Otherwise, False.
    """

    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """
    Hashes a password using bcrypt.

    Args:
        password: The password (string).

    Returns:
        The hashed password (string).
    """

    return pwd_context.hash(password)


def create_access_token(user_id: int) -> str:
    """
    Creates a new access token (JWT) for a user.
    The payload contains the user ID and the expiration time. The expiration time is in UTC format.

    Args:
        user_id: The user ID (integer).

    Returns:
        The encoded JWT token (string).
    """

    # Create payload with user ID and expiration time
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}

    # Encode the token using the secret key and algorithm
    encoded_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_token


def authenticate_user(email: str, password: str) -> Optional[User]:
    """
    Authenticates a user using the email and password.

    Args:
        email: The email of the user (string).
        password: The password of the user (string).

    Returns:
        The user object (dictionary) or False if the user does not exist or the password is incorrect.
    """

    user = db.get_public_user_by_email(email)

    if user or verify_password(password, user["password"]):
        return user

    return None


async def get_current_user_id(token: Annotated[str, Depends(oauth2_scheme)]) -> int:
    """
    Returns the ID of the current user using the Bearer token from the Authorization header.

    Args:
        token: The Bearer token from the Authorization header.

    Returns:
        The user ID (integer).
    """

    # Exception for invalid credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")

        if not user_id:  # Token is not valid
            raise credentials_exception

        return user_id

    except PyJWTError:  # Token is not valid
        raise credentials_exception


async def get_current_user(current_user_id: Annotated[int, Depends(get_current_user_id)]) -> Optional[User]:
    """
    Returns the current user.

    Args:
        current_user_id: The ID of the current user (integer).

    Returns:
        The user object (PublicUser).
    """

    return db.get_user_by_id(current_user_id)


def get_role_permissions(user_role):
    """
    Returns the permissions of each role.
    """
    roles_path = os.path.join(CURRENT_DIR, '../../roles.json')

    with open(roles_path) as f:
        roles = json.load(f)

    role_permissions = roles[user_role]
    
    if not role_permissions: # If the role does not exist
        return [] # Return an empty list
    
    return role_permissions 


# ------------------------- Post Requests -------------------------
@router.post("/signup/")
async def create_user(user: SignupData):
    """
    Creates a new user.

    Args:
        user: The SignupData object containing the username, email and password of the user.
              SignupData is a Pydantic model which automatically validates the data.

    Returns:
        A dictionary containing the ID of the created user.

    Raises:
        HTTPException 422: If the data is not valid.
    """

    hashed_password = hash_password(user.password)

    created_user_id = db.create_user(user.username, user.email, hashed_password)

    return {"created_user_id": created_user_id}


@router.post("/login/")
async def login(login_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """
    Logs in a user. The user is authenticated using the email and password
    which are sent in the request body using OAuth2.

    Args:
        login_data: The OAuth2PasswordRequestForm object containing the username and password of the user.

    Returns:
        A dictionary containing the access token and token type.
    """

    # OAuth2 does not allow custom fields, so we need to use the username field for the email.
    user = authenticate_user(login_data.username, login_data.password)

    if not user:  # There is no user with this email or the password is incorrect
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user.user_id)

    return {"access_token": access_token, "token_type": "bearer"}

