from fastapi import APIRouter, Body, HTTPException, Depends  # For the API
from typing import Annotated  # For receiving data from the request body
from backend.api.endpoints.utility import get_current_user_id, is_privileged  # For user authentication
from backend.api.endpoints.schemas import Post, Comment  # For request and response bodies
from backend.db_service import database as db  # Allows the manipulation and reading of the database
from backend.db_service import tag_management as tm  # Tag management

router = APIRouter(
    prefix="/posts",
    tags=["posts"]
)


# ------------------------- Get Requests -------------------------
@router.get("/id/{post_id}/")
async def get_post_by_id(post_id: int):
    """
    Returns a post by its ID.

    Args:
        post_id: The ID of the post (integer).

    Returns:
        A post object (dictionary).
    """

    post = db.get_post_by_id(post_id)

    if not post:  # Post not found
        raise HTTPException(status_code=404, detail="Post not found")

    return {"post": post}


@router.get("/all/")  # TODO: Implement query parameters for filtering
async def get_all_posts():
    """
    Returns all posts.

    Returns:
        A list of post objects (dictionaries).
    """

    return {"posts": db.get_all_posts()}


@router.get("/tag/{tag}/")  # Maybe use query parameters instead of path parameters
async def get_posts_with_tag(tag: str):
    """
    Returns all posts with a specific tag.

    Args:
        tag: The tag (string).

    Returns:
        A list of post objects (dictionaries).
    """

    return {"posts": db.get_posts_with_tag(tag)}


@router.get("/id/{post_id}/tags/all/")
async def get_tags_of_post(post_id: int):
    """
    Returns all tags of a post.

    Args:
        post_id: The ID of the post (integer).

    Returns:
        A list of tags (strings).
    """

    return {"tags": db.get_tags_of_post(post_id)}


@router.get("/id/{post_id}/comments/all/")
async def get_comments_of_post(post_id: int):
    """
    Returns all comments of a post.

    Args:
        post_id: The ID of the post (integer).

    Returns:
        A list of comment objects (dictionaries).
    """

    comments = db.get_comments_of_post(post_id)

    return {"comments": comments}


@router.get("/id/{post_id}/comments/id/{comment_id}/")
async def get_comment_by_id(post_id: int, comment_id: int):
    """
    Returns a comment by its ID.

    Args:
        post_id: The ID of the post (integer).
        comment_id: The ID of the comment (integer).

    Returns:
        A comment object (dictionary).
    """
    comment = db.get_comment_by_id(comment_id)

    if not comment or comment["post_id"] != post_id:  # Comment not found or not associated with the post
        raise HTTPException(status_code=404, detail="Comment not found")

    return {"comment": comment}


# ------------------------- Post Requests -------------------------
@router.post("/create_post/")
async def create_post(post: Post, current_user: dict = Depends(get_current_user_id)):
    """
    Creates a new post.

    Args:
        post: The post object containing the title and content of the post.
        current_user: The current user (dictionary).

    Returns:
        The ID of the post (integer).
    """
    current_user_id = current_user["user_id"]

    post_id = db.create_post(current_user_id, post.title, post.content)

    # Check if post creation was successful
    if not post_id:
        raise HTTPException(status_code=500, detail="Could not create post")

    tags = tm.assign_tags_to_post(post.title, post.content)
    db.update_tags_of_post(post_id, tags)
    return {"post_id": post_id}


@router.post("/id/{post_id}/create_comment/")
async def create_comment(post_id: int, comment: Comment, current_user: dict = Depends(get_current_user_id)):
    """
    Creates a new comment for a post.

    Args:
        post_id: The ID of the post (integer).
        comment: The comment object containing the content of the comment.
        current_user: The current user (dictionary).

    Returns:
        The comment object containing the content of the comment.
    """
    current_user_id = current_user["user_id"]

    # Raise an error if the post does not exist or the user ID is not valid
    if not (db.get_post_by_id(post_id) and current_user_id):
        raise HTTPException(status_code=404, detail="This post does not exist")

    db.create_comment(post_id, current_user_id, comment.content)

    return {"comment": comment}


# ------------------------- Put Requests -------------------------
@router.put("/id/{post_id}/edit/")
async def update_post_content(post_id: int, new_content: Annotated[str, Body()],
                              current_user: dict = Depends(get_current_user_id)):
    """
    Updates the content of a post. Can only be done by the author of the post.

    Args:
        post_id: The ID of the post (integer).
        new_content: The new content of the post (string).
        current_user: The current user (dictionary).

    Returns:
        The new content of the post (string).
    """

    current_user_id = current_user["user_id"]
    author_id = db.get_author_id_of_post(post_id)

    if current_user_id != author_id and not is_privileged(current_user_id):
        raise HTTPException(status_code=403, detail="You are not allowed to edit this post")

    db.update_post_content(post_id, new_content)
    return {"content": new_content}


# ------------------------- Delete Requests -------------------------
@router.delete("/id/{post_id}/delete/")
async def delete_post_with_comments(post_id: int, current_user: dict = Depends(get_current_user_id)):
    """
    Deletes a post and all its comments. Can only be done by the author of the post.

    Args:
        post_id: The ID of the post (integer).
        current_user: The current user (dictionary).

    Returns:
        An empty dictionary.
    """

    current_user_id = current_user["user_id"]
    author_id = db.get_author_id_of_post(post_id)

    if current_user_id != author_id and not is_privileged(current_user_id):
        raise HTTPException(status_code=403, detail="You are not allowed to delete this post")

    db.delete_post_with_comments(post_id)
    return {}  # Indicates that the post was successfully deleted
