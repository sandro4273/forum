from typing import Annotated
from fastapi import Body, FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, field_validator
import jwt  # JSON Web Token for user authentication
from jwt import PyJWTError
from datetime import datetime, timedelta
import db_service

app = FastAPI()  # test

origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:63342"
]

app.add_middleware(CORSMiddleware,
                   allow_origins=origins,
                   allow_credentials=True,
                   allow_methods=["*"],
                   allow_headers=["*"])


class Post(BaseModel):
    user_id: int
    title: str
    content: str


class Comment(BaseModel):
    user_id: int
    content: str


class SignupData(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    def username_validator(cls, v):
        if not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        if db_service.username_exists(v):
            raise ValueError("Username already exists")
        return v

    @field_validator("email")
    def email_validator(cls, v):
        if db_service.email_exists(v):
            raise ValueError("Email already exists")
        return v

    @field_validator("password")
    def password_validator(cls, v):
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
    email: str
    password: str


security = HTTPBearer()

SECRET_KEY = "your-secret-key"  # obviously needs to be moved outside public codebase later
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def create_access_token(user_id: int):
    to_encode = {"user_id": user_id}
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        return user_id
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/post/id/{post_id}/")
async def get_post_by_id(post_id: int):
    return {"result": db_service.get_post_by_id(post_id)}


@app.get("/post/all/")     # Spöter query dass nur en max. azahl an posts glade werded
async def get_all_posts():
    return {"result": db_service.get_all_posts()}


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


@app.get("/chat/id/{chat_id}/")
async def get_chat_by_id(chat_id: int):
    return {"result": db_service.get_chat_by_id(chat_id)}


@app.get("/chat/id/{chat_id}/messages/all/")
async def get_messages_of_chat(chat_id: int):
    return {"result": db_service.get_messages_of_chat(chat_id)}


@app.get("/user/id/{user_id}/chats/all/")
async def get_chats_of_user(user_id: int):
    return {"result": db_service.get_chats_of_user(user_id)}


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
async def create_post(post: Post):
    db_service.create_post(post.user_id,
                           post.title,
                           post.content)
    return post


@app.post("/post/id/{post_id}/create_comment/")
async def create_comment(post_id: int, comment: Comment):
    # Testen, ob ein Post mit post_id existiert
    if db_service.get_post_by_id(post_id):
        db_service.create_comment(post_id,
                                  comment.user_id,
                                  comment.content)
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


@app.put("/post/id/{post_id}/")
async def update_post(post_id: int, new_title: Annotated[str, Body()], new_content: Annotated[str, Body()]):
    db_service.update_post_title(post_id, new_title)
    db_service.update_post_content(post_id, new_content)
    return new_content


@app.put("/post/id/{post_id}/comments/id/{comment_id}/")
async def update_comment(post_id: int, comment_id: int, new_content: Annotated[str, Body()]): # str in Request sende, ned JSON
    db_service.update_comment_content(comment_id, new_content)
    return new_content


@app.delete("post/id/{post_id}/")
async def delete_post_with_comments(post_id: int):  # Beim Löschen von einem Post sollen die Kommentare ebenfalls gelöscht werden
    db_service.delete_post_with_comments(post_id)
    return {}


@app.delete("post/id/{post_id}/comments/id/{comment_id}")
async def delete_comment_by_id(post_id: int, comment_id: int):
    db_service.delete_comment(comment_id)
    return {}
