from typing import Optional  # For optional data types

from pydantic import (
    BaseModel,  # For creating pydantic data models
    EmailStr,  # For validating email addresses
    field_validator  # For validating data fields
)


class User(BaseModel):
    """
    Contains the public information of a user.
    """
    user_id: Optional[int] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    registration_date: Optional[int] = None
    role: Optional[str] = None


class UserPassword(BaseModel):
    """
    Contains the password of a user.
    """
    password: str


class SignupData(BaseModel):
    """
    Contains all data needed to sign up a user: username, email and password.
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

        # Importing the database here to avoid circular imports
        from backend.db_service import database as db

        if not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        if db.username_exists(v):
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

        # Importing the database here to avoid circular imports
        from backend.db_service import database as db

        if db.email_exists(v):
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


class LoginForm(BaseModel):
    """
    Contains all necessary data to log in a user.
    """
    email: str
    password: str


class Post(BaseModel):
    """
    Contains the title and content of a post.
    """
    post_id: Optional[int] = None
    author_id: Optional[int] = None
    title: Optional[str] = None
    content: Optional[str] = None
    creation_date: Optional[str] = None


class Comment(BaseModel):
    """
    Contains the title and content of a post.
    """
    comment_id: Optional[int] = None
    post_id: Optional[int] = None
    author_id: Optional[int] = None
    content: Optional[str] = None
    creation_date: Optional[str] = None


class ChatMessage(BaseModel):
    """
    Contains the title and content of a post.
    """
    chat_id: Optional[int] = None
    author_id: Optional[int] = None
    content: Optional[str] = None
    creation_date: Optional[str] = None
