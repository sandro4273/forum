from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import db_service

app = FastAPI()

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


@app.get("/post/id/{post_id}/comments/")
async def get_comments_of_post(post_id: int):
    return {"result": db_service.get_comments_of_post(post_id)}


@app.post("/post/create_post/")
async def create_post(post: Post):
    db_service.create_post(post.user_id,
                           post.title,
                           post.content)
    return post


@app.post("/post/{post_id}/create_comment")
async def create_comment(post_id: int, comment: Comment):
    db_service.create_comment(post_id,
                              comment.user_id,
                              comment.content)
    return comment