from fastapi import APIRouter, Body, HTTPException, Depends  # For the API
from typing import Annotated  # For receiving data from the request body
from .utility import get_current_user_id, is_privileged  # For user authentication
from backend.db_service import database as db  # Allows the manipulation and reading of the database

router = APIRouter(
    prefix="/comments",
    tags=["comments"]
)


# ------------------------- Get Requests -------------------------


# ------------------------- Post-Requests -------------------------


# ------------------------- Put-Requests -------------------------
@router.put("/id/{comment_id}/edit/")
async def update_comment(comment_id: int, new_content: Annotated[str, Body()],
                         current_user: dict = Depends(get_current_user_id)):
    """
    Updates the content of a comment. Can only be done by the author of the comment.

    Args:
        comment_id: The ID of the comment (integer).
        new_content: The new content of the comment (string).
        current_user: The current user (dictionary).

    Returns:
        The new content of the comment (string).
    """

    current_user_id = current_user["user_id"]
    author_id = db.get_author_id_of_comment(comment_id)

    if current_user_id != author_id and not is_privileged(current_user_id):
        raise HTTPException(status_code=403, detail="You are not allowed to edit this comment")

    db.update_comment_content(comment_id, new_content)
    return {"content": new_content}


# ------------------------- Delete-Requests -------------------------
@router.delete("/id/{comment_id}/delete/")
async def delete_comment_by_id(comment_id: int, current_user: dict = Depends(get_current_user_id)):
    """
    Deletes a comment by its ID.

    Args:
        comment_id: The ID of the comment (integer).
        current_user:  The current user (dictionary).

    Returns:
        An empty dictionary.
    """

    current_user_id = current_user["user_id"]
    author_id = db.get_author_id_of_comment(comment_id)

    if current_user_id != author_id and not is_privileged(current_user_id):
        raise HTTPException(status_code=403, detail="You are not allowed to delete this comment")

    db.delete_comment(comment_id)
    return {}  # Indicates that the comment was successfully deleted
