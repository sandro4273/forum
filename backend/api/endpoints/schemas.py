from pydantic import BaseModel, EmailStr, field_validator  # For data validation
from backend.db_service import database as db  # Allows the manipulation and reading of the database

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


class LoginData(BaseModel):
    """
    Contains all necessary data to log in a user.
    """
    email: str
    password: str