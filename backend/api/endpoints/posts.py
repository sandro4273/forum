from fastapi import (
    Depends,  # For requiring parameters, e.g. the current user ID
    APIRouter,  # For distributing endpoints into separate files
    HTTPException,  # For raising exceptions with custom details
    Body,  # For receiving data from the request body
    Query  # For query parameters
)

from typing import Annotated  # For receiving data from the request body

from backend.api.endpoints.auth import (
    get_current_user_id,  # For retrieving the logged-in user id
    is_privileged  # For checking if user is admin or moderator
)

from backend.db_service.models import SortType, Post, Comment  # For the return objects
from backend.db_service import database as db  # Allows the manipulation and reading of the database
from backend.db_service import tag_management as tm  # Tag management

# API router for the post endpoints
router = APIRouter(
    prefix="/posts",
    tags=["posts"]  # Tags for the API documentation
)


# ------------------------- Get Requests -------------------------
@router.get("/")
async def get_posts(
    search: str = Query(None),
    amount: int = Query(10),
    offset: int = Query(0),
    sort: SortType = Query(SortType.RECOMMENDED)
):
    """
    Returns posts according to the search query, amount, offset and sorting type.

    Args:
        search: The search query (string).
        amount: The amount of posts to return (integer).
        offset: The offset for the posts to return (integer).
        sort: The sorting type (SortType).

    Returns:
        A list of post objects (dictionaries).
    """

    return {"posts": db.get_posts(search, amount, offset, sort)}


@router.get("/id/{post_id}/")
async def get_post_by_id(post_id: int) -> dict[str, Post]:
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


@router.get("/id/{post_id}/tags/")
async def get_tags_of_post(post_id: int):
    """
    Returns all tags of a post.

    Args:
        post_id: The ID of the post (integer).

    Returns:
        A list of tags (strings).
    """

    return {"tags": db.get_tags_of_post(post_id)}


@router.get("/id/{post_id}/votes/")
async def get_votes_of_post(post_id: int):
    """
    Returns the votes of a post.

    Args:
        post_id: The ID of the post (integer).

    Returns:
        The voting of the post (voting = upvotes - downvotes) (integer).
    """

    return db.get_votes_of_post(post_id)


@router.get("/id/{post_id}/votes/user/")
async def get_vote_of_user(post_id: int, current_user_id: Annotated[int, Depends(get_current_user_id)]):
    """
    Returns the vote of a user for a post.

    Args:
        post_id: The ID of the post (integer).
        current_user_id: The ID of the user (integer).

    Returns:
        The vote of the user for the post (integer).
    """
    
    return db.get_vote_of_user(post_id, current_user_id)


@router.get("/id/{post_id}/comments/")
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
async def get_comment_by_id(post_id: int, comment_id: int) -> Comment:
    """
    Returns a comment by its ID.

    Args:
        post_id: The ID of the post (integer).
        comment_id: The ID of the comment (integer).

    Returns:
        A comment object (dictionary).
    """
    comment = db.get_comment_by_id(comment_id)

    if not comment or comment.post_id != post_id:  # Comment not found or not associated with the post
        raise HTTPException(status_code=404, detail="Comment not found")

    return comment


# ------------------------- Post Requests -------------------------
@router.post("/create_post/")
async def create_post(post: Post, current_user_id: Annotated[int, Depends(get_current_user_id)]):
    """
    Creates a new post.

    Args:
        post: The post object containing the title and content of the post.
        current_user_id: The current user (integer).

    Returns:
        The ID of the post (integer).
    """

    post_id = db.create_post(current_user_id, post.title, post.content)

    # Check if post creation was successful
    if not post_id:
        raise HTTPException(status_code=500, detail="Could not create post")

    tags = tm.assign_tags_to_post(post.title, post.content)
    db.update_tags_of_post(post_id, tags)
    return {"post_id": post_id}


@router.post("/id/{post_id}/create_comment/")
async def create_comment(post_id: int, comment: Comment, current_user_id: Annotated[int, Depends(get_current_user_id)]):
    """
    Creates a new comment for a post.

    Args:
        post_id: The ID of the post (integer).
        comment: The comment object containing the content of the comment.
        current_user_id: The current user id (integer).

    Returns:
        The comment object containing the content of the comment.
    """

    # Raise an error if the post does not exist or the user ID is not valid
    if not (db.get_post_by_id(post_id) and current_user_id):
        raise HTTPException(status_code=404, detail="This post does not exist")

    db.create_comment(post_id, current_user_id, comment.content)

    return {"comment": comment}


@router.post("/id/{post_id}/vote/")
async def vote_post(
    post_id: int,
    vote: Annotated[int, Body(...)],
    current_user_id: Annotated[int, Depends(get_current_user_id)]
):
    """
    Votes for a post. (Like/Dislike)

    Args:
        post_id: The ID of the post (integer).
        vote: The vote (int). 1 for upvote, -1 for downvote.
        current_user_id: The current user (integer).

    Returns:
        The vote (integer).
    """

    if not current_user_id:
        raise HTTPException(status_code=401, detail="You need to be logged in to vote")

    db.create_vote_post(current_user_id, post_id, vote)
    return {"vote": vote}


# ------------------------- Put Requests -------------------------
@router.put("/id/{post_id}/edit/")
async def update_post_content(
    post_id: int,
    new_content: Annotated[str, Body()],
    current_user_id: Annotated[int, Depends(get_current_user_id)]
):
    """
    Updates the content of a post. Can only be done by the author of the post.

    Args:
        post_id: The ID of the post (integer).
        new_content: The new content of the post (string).
        current_user_id: The current user (integer).

    Returns:
        The new content of the post (string).
    """

    author_id = db.get_post_by_id(post_id).author_id

    if current_user_id != author_id and not is_privileged(current_user_id):
        raise HTTPException(status_code=403, detail="You are not allowed to edit this post")

    db.update_post_content(post_id, new_content)
    return {"content": new_content}


# ------------------------- Delete Requests -------------------------
@router.delete("/id/{post_id}/delete/")
async def delete_post_with_comments(
    post_id: int,
    current_user_id: Annotated[int, Depends(get_current_user_id)]
):
    """
    Deletes a post and all its comments. Can only be done by the author of the post.

    Args:
        post_id: The ID of the post (integer).
        current_user_id: The current user (integer).

    Returns:
        An empty dictionary.
    """

    author_id = db.get_post_by_id(post_id).author_id

    if current_user_id != author_id and not is_privileged(current_user_id):
        raise HTTPException(status_code=403, detail="You are not allowed to delete this post")

    db.delete_post_with_comments(post_id)
    return {}  # Indicates that the post was successfully deleted
