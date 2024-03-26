# Programmierprojekt Forum, 06.03.2024
# Luca Flühler, Lucien Ruffet, Sandro Kuster
# Beschreibung: Datenbank-Service für das Forum

import os  # For retrieving the database path
import sqlite3  # SQLite for the database
from typing import Optional  # For optional parameters
from backend.db_service.models import SortType, User, Post, Comment  # Models for data transfer

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(CURRENT_DIR, "data/forum.db")


class Database:
    """
    Context manager for the database connection.

    This class is used to open and close the database connection.
    """
    def __enter__(self):
        self.conn = sqlite3.connect(DB_PATH)
        self.conn.row_factory = sqlite3.Row
        self.cur = self.conn.cursor()
        return self.cur

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.conn.commit()
        self.conn.close()


VALID_ROLES = ["user", "moderator", "admin"]


# ------------------------- Existence Checks -------------------------
# Return a boolean which states whether the element exists

def username_exists(username: str) -> bool:
    sql = "SELECT EXISTS(SELECT 1 FROM users WHERE username = ?)"
    with Database() as cur:
        cur.execute(sql, (username,))
        return cur.fetchone()[0] == 1


def email_exists(email: str) -> bool:
    sql = "SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)"
    with Database() as cur:
        cur.execute(sql, (email,))
        return cur.fetchone()[0] == 1


def check_chat_exists(user1, user2):
    sql = "SELECT EXISTS(SELECT 1 FROM chats WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?))"
    with Database() as cur:
        cur.execute(sql, (user1, user2, user2, user1))
        return cur.fetchone()[0] == 1


def check_user_exists(user_id):
    sql = "SELECT EXISTS(SELECT 1 FROM users WHERE user_id = ?)"
    with Database() as cur:
        cur.execute(sql, (user_id,))
        return cur.fetchone()[0] == 1


# ------------------------- Write Functions -------------------------
# Return the id of the created elements

def create_user(username, email, password) -> Optional[int]:
    sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
    with Database() as cur:
        cur.execute(sql, (username, email, password))
        return cur.lastrowid


def create_post(author_id, title, content) -> Optional[int]:
    sql = "INSERT INTO posts (author_id, title, content) VALUES (?, ?, ?)"
    with Database() as cur:
        cur.execute(sql, (author_id, title, content))
        return cur.lastrowid


def create_vote_post(user_id, post_id, vote) -> Optional[int]:
    # Check if user already voted
    sql = "SELECT vote FROM posts_votes WHERE user_id = ? AND post_id = ?"
    with Database() as cur:
        cur.execute(sql, (user_id, post_id))
        result = cur.fetchone()

        if result:  # user already voted
            if result[0] == vote:  # if user wants to vote the same as before, delete vote
                sql = "DELETE FROM posts_votes WHERE user_id = ? AND post_id = ?"
                cur.execute(sql, (user_id, post_id))
                return None
            else:  # if user wants to change vote, update vote
                sql = "UPDATE posts_votes SET vote = ? WHERE user_id = ? AND post_id = ?"
                cur.execute(sql, (vote, user_id, post_id))
                return None

        # otherwise create new vote
        sql = "INSERT INTO posts_votes (user_id, post_id, vote) VALUES (?, ?, ?)"
        cur.execute(sql, (user_id, post_id, vote))
        return cur.lastrowid


def create_tag(tag_name) -> Optional[int]:
    # Check if tag already exists
    sql = "SELECT tag_id FROM tags WHERE tag_name = ?"
    with Database() as cur:
        cur.execute(sql, (tag_name,))
        result = cur.fetchone()
        if result:  # tag already exists
            return result[0]  # return tag_id

        # otherwise create new tag
        sql = "INSERT INTO tags (tag_name) VALUES (?)"
        cur.execute(sql, (tag_name,))
        return cur.lastrowid


def create_comment(post_id, author_id, content) -> Optional[int]:
    sql = "INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)"
    with Database() as cur:
        cur.execute(sql, (post_id, author_id, content))
        return cur.lastrowid


def create_chat_msg(chat_id, user_id, message) -> Optional[int]:
    sql = "INSERT INTO chat_messages (chat_id, sent_by, message) VALUES (?, ?, ?)"
    with Database() as cur:
        cur.execute(sql, (chat_id, user_id, message))
        return cur.lastrowid


def create_chat(user1, user2) -> Optional[int]:
    sql = "INSERT INTO chats (user1, user2) VALUES (?, ?)"
    with Database() as cur:
        cur.execute(sql, (user1, user2))
        return cur.lastrowid


# ------------------------- Read Functions -------------------------
# Returns the specific model from schemas.py

def get_user_by_id(user_id) -> Optional[User]:
    sql = "SELECT * FROM users WHERE user_id = ?"
    with Database() as cur:
        cur.execute(sql, (user_id,))
        result = cur.fetchone()

    if not result:
        return None

    return User(**result)


def get_public_user_by_condition(condition_field, condition_value) -> Optional[User]:
    """
    Generic function to fetch a user by a specified condition from the database.
    """

    sql = f"SELECT user_id, username, email, registration_date, role FROM users WHERE {condition_field} = ?"

    with Database() as cur:
        cur.execute(sql, (condition_value,))
        result = cur.fetchone()

    if not result:
        return None

    return User(**result)


def get_public_user_by_id(user_id) -> Optional[User]:
    return get_public_user_by_condition("user_id", user_id)


def get_public_user_by_username(username) -> Optional[User]:
    return get_public_user_by_condition("username", username)


def get_public_user_by_email(email) -> Optional[User]:
    return get_public_user_by_condition("email", email)


def get_post_by_id(post_id) -> Optional[Post]:
    sql = "SELECT * FROM posts WHERE post_id = ?"

    with Database() as cur:
        cur.execute(sql, (post_id,))
        result = cur.fetchone()

    if not result:
        return None

    return Post(**result)


def get_posts(search, amount, offset, sort_type) -> list[Post]:
    sql = "SELECT * FROM posts"
    parameters = ()

    if search:
        sql += " WHERE LOWER(TRIM(title)) LIKE ? OR LOWER(TRIM(content)) LIKE ?"
        parameters = (f"%{search}%", f"%{search}%")

    if sort_type == SortType.NEW:
        sql += " ORDER BY creation_date DESC"
    elif sort_type == SortType.POPULAR:
        sql += " ORDER BY (SELECT SUM(vote) FROM posts_votes WHERE post_id = posts.post_id) DESC"
    elif sort_type == SortType.CONTROVERSIAL:
        sql += " ORDER BY (SELECT SUM(vote) FROM posts_votes WHERE post_id = posts.post_id) ASC"
    else:  # SortType.RECOMMENDED
        sql += " ORDER BY RANDOM()"

    sql += " LIMIT ? OFFSET ?"
    parameters += (amount, offset)

    with Database() as cur:
        cur.execute(sql, parameters)
        results = cur.fetchall()

    return [Post(**result) for result in results]


def get_tags_of_post(post_id) -> list[str]:
    sql = "SELECT tags.tag_name FROM tags JOIN post_tags ON tags.tag_id = post_tags.tag_id WHERE post_tags.post_id = ?"

    with Database() as cur:
        cur.execute(sql, (post_id,))
        result = cur.fetchall()

    return [tag["tag_name"] for tag in result]


def get_posts_with_tag(tag_name):
    sql = """
        SELECT posts.*
        FROM posts
        JOIN post_tags ON posts.post_id = post_tags.post_id
        JOIN tags ON post_tags.tag_id = tags.tag_id
        WHERE tags.tag_name = ?
    """

    with Database() as cur:
        cur.execute(sql, (tag_name,))
        results = cur.fetchall()

    return [Post(**result) for result in results]


def get_votes_of_post(post_id):
    sql = "SELECT SUM(vote) FROM posts_votes WHERE post_id = ?"
    with Database() as cur:
        cur.execute(sql, (post_id,))
        return cur.fetchone()[0]


def get_vote_of_user(post_id, user_id):
    sql = "SELECT vote FROM posts_votes WHERE post_id = ? AND user_id = ?"
    with Database() as cur:
        cur.execute(sql, (post_id, user_id))
        result = cur.fetchone()
        if result:
            return result[0]
        else:
            return 0  # user has not voted


def get_comment_by_id(comment_id) -> Optional[Comment]:
    sql = "SELECT * FROM comments WHERE comment_id = ?"
    with Database() as cur:
        cur.execute(sql, (comment_id,))
        result = cur.fetchone()

    if not result:
        return None

    return Comment(**result)


def get_comments_of_post(post_id) -> list[Comment]:
    sql = "SELECT * FROM comments WHERE post_id = ?"
    with Database() as cur:
        cur.execute(sql, (post_id,))
        results = cur.fetchall()

    return [Comment(**result) for result in results]


def get_chat_by_id(chat_id):
    sql = "SELECT * FROM chats WHERE chat_id = ?"
    with Database() as cur:
        cur.execute(sql, (chat_id,))
        return cur.fetchone()


def get_chat_message(msg_id):
    sql = "SELECT * FROM chat_messages WHERE msg_id = ?"
    with Database() as cur:
        cur.execute(sql, (msg_id,))
        return cur.fetchone()


def get_messages_of_chat(chat_id):
    sql = "SELECT * FROM chat_messages WHERE chat_id = ?"
    with Database() as cur:
        cur.execute(sql, (chat_id,))
        return cur.fetchall()


def get_chats_of_user(user_id):
    # Select chat_id, both user_ids and the username of the other user
    sql = (
        "SELECT chats.*, users.username as other_username "
        "FROM chats JOIN users ON (chats.user1 = users.user_id OR chats.user2 = users.user_id) "
        "WHERE (chats.user1 = ? OR chats.user2 = ?) AND users.user_id != ?"
    )
    with Database() as cur:
        cur.execute(sql, (user_id, user_id, user_id))
        return cur.fetchall()  # response looks like: [{"chat_id": 1, "user1": 1, "user2": 2, "other_username": "user2"}]


# ------------------------- Update Requests -------------------------
# Returns a boolean which states whether the update was successful

def update_username(user_id, new_name) -> bool:
    sql = "UPDATE users SET username = ? WHERE user_id = ?"
    with Database() as cur:
        cur.execute(sql, (new_name, user_id))
        return cur.rowcount > 0


def update_role(user_id, new_role) -> bool:
    if new_role not in VALID_ROLES:
        raise ValueError("Invalid role")

    sql = "UPDATE users SET role = ? WHERE user_id = ?"
    with Database() as cur:
        cur.execute(sql, (new_role, user_id))
        return cur.rowcount > 0


def update_post_title(post_id, new_title):
    sql = "UPDATE posts SET title = ? WHERE post_id = ?"
    with Database() as cur:
        cur.execute(sql, (new_title, post_id))
        return cur.rowcount > 0


def update_post_content(post_id, new_content):
    sql = "UPDATE posts SET content = ? WHERE post_id = ?"
    with Database() as cur:
        cur.execute(sql, (new_content, post_id))
        return cur.rowcount > 0


def update_tags_of_post(post_id, new_tags: list):
    unique_tags = set(new_tags)  # Convert list to set to remove duplicates
    with Database() as cur:
        # Delete old tags
        sql_delete = "DELETE FROM post_tags WHERE post_id = ?"
        cur.execute(sql_delete, (post_id,))

        # Add new unique tags
        sql_insert = "INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)"
        for tag in unique_tags:
            tag_id = create_tag(tag)
            cur.execute(sql_insert, (post_id, tag_id))

        return cur.rowcount > 0


def add_tag_to_post(post_id, tag_name):
    tag_id = create_tag(tag_name)
    sql = "INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)"
    with Database() as cur:
        cur.execute(sql, (post_id, tag_id))
        return cur.rowcount > 0


def update_vote_post(user_id, post_id, vote):
    sql = "UPDATE posts_votes SET vote = ? WHERE user_id = ? AND post_id = ?"
    with Database() as cur:
        cur.execute(sql, (vote, user_id, post_id))
        return cur.rowcount > 0


def update_comment_content(comment_id, new_content):
    sql = "UPDATE comments SET content = ? WHERE comment_id = ?"
    with Database() as cur:
        cur.execute(sql, (new_content, comment_id))
        return cur.rowcount > 0


# ------------------------- Delete Functions -------------------------
# Returns a boolean which states whether the deletion was successful

def delete_post_with_comments(post_id):
    sql = "DELETE FROM posts WHERE post_id = ?"
    with Database() as cur:
        cur.execute(sql, (post_id,))

        # Delete Comments of Post
        sql = "DELETE FROM comments WHERE post_id = ?"
        cur.execute(sql, (post_id,))
        return cur.rowcount > 0


def delete_comment(comment_id):
    sql = "DELETE FROM comments WHERE comment_id = ?"
    with Database() as cur:
        cur.execute(sql, (comment_id,))
        return cur.rowcount > 0
