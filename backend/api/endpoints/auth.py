from typing import Annotated
import jwt  # JSON Web Token for user authentication
from jwt import PyJWTError  # Gets thrown in case the JWT is not valid
from datetime import datetime, timedelta  # For token expiration
from passlib.context import CryptContext  # For password hashing

from fastapi import Depends, APIRouter, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from backend.api.endpoints.schemas import SignupData
from backend.db_service import database as db

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

# Security for user authentication: Password hashing using the bcrypt algorithm
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security for user authentication: Authorization header with Bearer token using OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login/")

# ------------------------- Utility Functions -------------------------
# Authorization configuration
SECRET_KEY = "your-secret-key"  # TODO: Move outside of the public codebase
ALGORITHM = "HS256"  # Algorithm used for encoding the token
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # TODO: Change to a lower value for production


def is_privileged(current_user_id: int) -> bool:
    """
    Checks if the current user is an admin or moderator.

    Args:
        current_user_id: The ID of the current user (integer).

    Returns:
        True if the user is an admin or moderator. Otherwise, False.
    """

    current_user_role = db.get_role_by_id(current_user_id)

    return current_user_role in ["admin", "moderator"]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a password using bcrypt.

    Args:
        plain_password: The plain password (string).
        hashed_password: The hashed password (string).

    Returns:
        True if the password is correct. Otherwise, False.
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


def authenticate_user(email: str, password: str) -> dict or bool:
    """
    Authenticates a user using the username and password.

    Args:
        email: The email of the user (string).
        password: The password of the user (string).

    Returns:
        The user object (dictionary).
    """

    user = db.get_user_by_email(email)

    if not user:
        return False

    if not verify_password(password, user["password"]):
        return False

    return user


async def get_current_user_id(token: Annotated[str, Depends(oauth2_scheme)]):
    """
    Returns the ID of the current user using the Bearer token from the Authorization header.

    Args:
        token: The Bearer token from the Authorization header.

    Returns:
        The user ID (integer).
    """

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


async def get_current_user(current_user_id: Annotated[int, Depends(get_current_user_id)]):
    return {"user": db.get_user_by_id(current_user_id)}


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

    created_user_id = db.create_user(user.username,
                                     user.email,
                                     hashed_password)

    return {"created_user_id": created_user_id}


@router.post("/login/")
async def login(login_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = authenticate_user(login_data.username, login_data.password)  # Use the username field for the email

    if not user:  # There is no user with this email or the password is incorrect
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user["user_id"])

    return {"access_token": access_token, "token_type": "bearer"}

