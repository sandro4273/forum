from typing import Annotated
from fastapi import Body, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import db_service

app = FastAPI() #test

origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
]

app.add_middleware( CORSMiddleware,
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
async def get_user_by_id(user_id: int):
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


@app.post("/post/create_post/")
async def create_post(post: Post):
    db_service.create_post(post.user_id,
                           post.title,
                           post.content)
    return post


@app.post("/post/id/{post_id}/create_comment/")
async def create_comment(post_id: int, comment: Comment):
    # Testen, ob ein Post mit post_id existiert
    if(db_service.get_post_by_id(post_id)):
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
