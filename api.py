from fastapi import FastAPI
from pydantic import BaseModel
import db_service

app = FastAPI()

class Post(BaseModel):
    user_id: int
    title: str
    content: str


class Comment(BaseModel):
    user_id: int
    content: str


@app.get("/post/{post_id}/")
async def get_post_by_id(post_id: int):
    return {"result": db_service.get_post_by_id(post_id)}


@app.get("/post/{post_id}/comments/")
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