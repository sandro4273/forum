# Programmierprojekt Forum, 06.03.2024
# Luca Flühler, Lucien Ruffet, Sandro Kuster
# Beschreibung: API für das Forum mit FastAPI

from typing import Annotated
from fastapi import Body, FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials  # For user authentication
from pydantic import BaseModel, EmailStr, field_validator  # For data validation
import jwt  # JSON Web Token for user authentication
from jwt import PyJWTError  # Gets thrown in case the JWT is not valid
from datetime import datetime, timedelta  # For token expiration
import db_service  # Allows the manipulation and reading of the database
import tag_management as tm  # Allows the assignment of tags to posts

# Initialize FastAPI
app = FastAPI()

# In case of CORS error, add your local host to the list of origins
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:8000"
]

app.add_middleware(CORSMiddleware,
                   allow_origins=origins,
                   allow_credentials=True,
                   allow_methods=["*"],
                   allow_headers=["*"])

# Security for user authentication: Authorization header with Bearer token
security = HTTPBearer()

# Authorization configuration
SECRET_KEY = "your-secret-key"  # TODO: Move outside of the public codebase
ALGORITHM = "HS256"  # Algorithm used for encoding the token
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # TODO: Change to a lower value for production


class Post(BaseModel):
    """
    Contains the title and content of a post.
    """
    title: str
    content: str


class Comment(BaseModel):
    """
    Contains the text content of a comment.
    """
    content: str


class SignupData(BaseModel):
    """
    Contains all necessary data to create a new user.
    """
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    def username_validator(cls, v):
        """
        Validates the username. It must be alphanumeric and not already exist in the database.

        Args:
            v: The username (string).

        Returns:
            The username if it is valid. Otherwise, raises a ValueError.
        """

        if not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        if db_service.username_exists(v):
            raise ValueError("Username already exists")
        return v

    @field_validator("email")
    def email_validator(cls, v):
        """
        Validates the email. It must not already exist in the database.
        EmailStr already checks if the email format is valid.

        Args:
            v: The email (string).

        Returns:
            The email if it is valid. Otherwise, raises a ValueError.
        """

        if db_service.email_exists(v):
            raise ValueError("Email already exists")
        return v

    @field_validator("password")
    def password_validator(cls, v):
        """
        Validates the password. It must be at least 8 characters long and contain at least one uppercase letter, one
        lowercase letter, one digit and a special character.

        Args:
            v: The password (string).

        Returns:
            The password if it is valid. Otherwise, raises a ValueError.
        """

        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")

        special_characters = set("!@#$%^&*()-_+=~`[]{}|;:'\",.<>/?\\")
        if not any(c.isupper() for c in v) or \
           not any(c.islower() for c in v) or \
           not any(c.isdigit() for c in v) or \
           not any(c in special_characters for c in v):
            raise ValueError("Password must have at least one uppercase letter, one lowercase letter, one digit and a "
                             "special character")
        return v


class LoginData(BaseModel):
    """
    Contains all necessary data to log in a user.
    """
    email: str
    password: str


def create_access_token(user_id: int) -> str:
    """
    Creates a new access token for a user.

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


# Get Requests
@app.get("/get_current_user_id/")
async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
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

        return user_id

    except PyJWTError:  # Token is not valid
        raise HTTPException(status_code=401, detail="Invalid token")


@app.get("/get_current_user/")
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

        return db_service.get_user_by_id(user_id)

    except PyJWTError:  # Token is not valid
        raise HTTPException(status_code=401, detail="Invalid token")

        
@app.get("/post/id/{post_id}/")
async def get_post_by_id(post_id: int):
    return {"result": db_service.get_post_by_id(post_id)}


@app.get("/post/all/")  # TODO: Implement query parameters for filtering
async def get_all_posts():
    return {"result": db_service.get_all_posts()}


@app.get("/post/tag/{tag}/")  # Maybe use query parameters instead of path parameters
async def get_posts_with_tag(tag: str):
    return {"result": db_service.get_posts_with_tag(tag)}


@app.get("/post/id/{post_id}/tags/all/")
async def get_tags_of_post(post_id: int):
    return {"result": db_service.get_tags_of_post(post_id)}


@app.get("/post/id/{post_id}/comments/all/")
async def get_comments_of_post(post_id: int):
    return {"result": db_service.get_comments_of_post(post_id)}


@app.get("/post/id/{post_id}/comments/id/{comment_id}/")
async def get_comment_by_id(post_id: int, comment_id: int):
    return {"result": db_service.get_comment_by_id(comment_id)}


@app.get("/user/id/{user_id}/")
async def get_user_by_id(user_id: int, current_user_id: int = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="You are not allowed to access this resource")

    return {"result": db_service.get_user_by_id(user_id)}


@app.get("/user/id/{user_id}/username/")
async def get_username_by_id(user_id: int):
    username = db_service.get_username_by_id(user_id)
    if username is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"username": username}


@app.get("/user/name/{username}/role/")
async def get_role_of_user_by_name(username: str):
    return {"role": db_service.get_role_of_user_by_name(username)}


@app.get("/chat/id/{chat_id}/")
async def get_chat_by_id(chat_id: int):
    return {"result": db_service.get_chat_by_id(chat_id)}


@app.get("/chat/id/{chat_id}/messages/all/")
async def get_messages_of_chat(chat_id: int):
    return {"result": db_service.get_messages_of_chat(chat_id)}


@app.get("/user/chats/all/")
async def get_chats_of_user(current_user_id: int = Depends(get_current_user_id)):
    return {"result": db_service.get_chats_of_user(current_user_id)}


# Post-Requests
@app.post("/user/signup/")
async def create_user(user_data: SignupData):
    db_service.create_user(user_data.username,
                           user_data.email,
                           user_data.password)
    return user_data


@app.post("/user/login/")
async def login_user(login_data: LoginData):
    user_id = db_service.login_user(login_data.email, login_data.password)

    if user_id:
        auth_token = create_access_token(user_id)
        return {"auth_token": auth_token, "token_type": "bearer"}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")


@app.post("/post/create_post/")
async def create_post(post: Post, current_user_id: int = Depends(get_current_user_id)) -> int:
    post_id = db_service.create_post(current_user_id, post.title, post.content)
    tags = tm.assign_tags_to_post(post.title, post.content)
    db_service.update_tags_of_post(post_id, tags)
    return post_id


@app.post("/post/id/{post_id}/create_comment/")
async def create_comment(post_id: int, comment: Comment, current_user_id: int = Depends(get_current_user_id)):
    # Check if post exists and a user is logged in
    if db_service.get_post_by_id(post_id) and current_user_id:
        db_service.create_comment(post_id, current_user_id, comment.content)
    else:
        return {"Failed": "Post does not exist"}
    return comment


@app.post("/chat/create_chat/")
async def create_chat(user1: Annotated[int, Body()], user2: Annotated[int, Body()]):
    # Check if chat already exists
    if db_service.check_chat_exists(user1, user2):
        return {"message": "Chat already exists"}
    # Check if both users exist
    if not db_service.check_user_exists(user1) or not db_service.check_user_exists(user2):
        return {"message": "User does not exist"}
    
    db_service.create_chat(user1, user2)
    return {"user1": user1, "user2": user2}


@app.post("/chat/id/{chat_id}/create_message/")
async def create_chat_message(chat_id: int, user_id: Annotated[int, Body()], message: Annotated[str, Body()]):
    db_service.create_chat_msg(chat_id, user_id, message)
    return {"chat_id": chat_id, "user_id": user_id, "message": message}


# Put-Requests
@app.put("/post/id/{post_id}/edit/")
async def update_post_content(post_id: int, new_content: Annotated[str, Body()], user_id: int = Depends(get_current_user_id)):
    if user_id != db_service.get_author_id_of_post(post_id):
        raise HTTPException(status_code=403, detail="You are not allowed to edit this post")

    db_service.update_post_content(post_id, new_content)
    return new_content


@app.put("/comment/id/{comment_id}/edit/")
async def update_comment(comment_id: int, new_content: Annotated[str, Body()], user_id = Depends(get_current_user_id)): # Note: Send a string in your request body, not a JSON
    if user_id != db_service.get_author_id_of_comment(comment_id):
        raise HTTPException(status_code=403, detail="You are not allowed to edit this comment")
    db_service.update_comment_content(comment_id, new_content)
    return new_content


# Delete-Requests
@app.delete("/post/id/{post_id}/delete/")
async def delete_post_with_comments(post_id: int, user_id: int = Depends(get_current_user_id)):  # When deleting a post, all comments of the post are deleted as well
    print("TSTSTETSETSTSETESTSETEWT")
    if user_id != db_service.get_author_id_of_post(post_id) or db_service.get_role_of_user(user_id) not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="You are not allowed to delete this post")
    
    db_service.delete_post_with_comments(post_id)
    return {}


@app.delete("/comment/id/{comment_id}/delete/")
async def delete_comment_by_id(comment_id: int, user_id: int = Depends(get_current_user_id)):
    if user_id != db_service.get_author_id_of_comment(comment_id) or (db_service.get_role_of_user(user_id) not in ["admin", "moderator"]):
        raise HTTPException(status_code=403, detail="You are not allowed to delete this comment")
    
    db_service.delete_comment(comment_id)
    return {}
