# Programmierprojekt Forum, 06.03.2024
# Luca Flühler, Lucien Ruffet, Sandro Kuster
# Beschreibung: Datenbank-Service für das Forum

import os  # For retrieving the database path
import sqlite3  # SQLite for the database
from typing import Optional  # For optional parameters
from backend.db_service.models import SortType, User, Post, Comment, Chat  # Models for data transfer

import nltk
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer

# Download NLTK resources. This only needs to be done once.
# These are required for the TF-IDF vectorizer to get recommended posts.
nltk.download('punkt')
nltk.download('stopwords')

# Path to the database file (forum.db)
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


# Roles that a user can have
VALID_ROLES = ["admin", "moderator", "user", "banned"]


# ------------------------- Utility Functions -------------------------
def sort_posts_by_recommendation(posts: list[Post], user_id: int) -> list[Post]:
    """
    Filter the posts to recommend to the user.

    Args:
        posts: The list of posts to filter.
        user_id: The id of the user to recommend posts to.

    Returns:
        A list of recommended posts.
    """

    sql = """
        SELECT tags.tag_name, COUNT(*) AS frequency
        FROM posts
        JOIN post_tags ON posts.post_id = post_tags.post_id
        JOIN posts_votes ON posts.post_id = posts_votes.post_id
        JOIN tags ON post_tags.tag_id = tags.tag_id
        WHERE posts_votes.user_id = ? AND posts_votes.vote = 1
        GROUP BY tags.tag_name;
    """

    with Database() as cur:
        cur.execute(sql, (user_id,))
        results = cur.fetchall()

    # We need to handle the case that a user has not liked any posts yet
    # For now, we return an empty list. In the future, we could return popular posts.
    if not results:
        return []

    # Retrieve the liked keywords / tags
    keywords = [keyword for keyword, _ in results]

    # Retrieve the weights (normalized frequency) of the keywords
    frequencies = [frequency for _, frequency in results]
    max_frequency = max(frequencies)
    weights = [frequency/max_frequency for frequency in frequencies]

    # Retrieve post title + content as texts
    stop_words = set(stopwords.words('english'))
    preprocessed_texts = [
        ' '.join([
            word.lower()
            for word in nltk.word_tokenize(post.title + ' - ' + post.content)
            if word.isalnum() and word.lower() not in stop_words
        ])
        for post in posts
    ]

    # Create a TF-IDF vectorizer
    vectorizer = TfidfVectorizer(vocabulary=keywords)

    # Fit the vectorizer on the preprocessed texts
    tfidf_matrix = vectorizer.fit_transform(preprocessed_texts)

    # Calculate scores for each text
    posts_scores = []
    for i, post in enumerate(posts):
        # Get the TF-IDF scores for the text
        tfidf_scores = tfidf_matrix[i].toarray()[0]

        # Compute the weighted score for the text
        score = sum(tfidf_scores[j]*weights[j] for j in range(len(keywords)))

        # Append text and score to the result list
        posts_scores.append((post, score))

    # Sort the results by score
    posts_scores.sort(key=lambda x: x[1], reverse=True)

    # Extract recommended posts without scores
    recommended_posts = [post for post, score in posts_scores if score > 0.0]

    # Filter out posts that the user has already voted on
    return [post for post in recommended_posts if get_vote_of_user(post.post_id, user_id) not in [-1, 1]]


# ------------------------- Existence Checks -------------------------
# Return a boolean which states whether the element exists

def username_exists(username: str) -> bool:
    """
    Check if a user with the given username exists in the database.

    Args:
        username: The username to check for.

    Returns:
        True if the username exists, False otherwise.
    """

    sql = "SELECT EXISTS(SELECT 1 FROM users WHERE username = ?)"

    with Database() as cur:
        cur.execute(sql, (username,))
        return cur.fetchone()[0] == 1


def email_exists(email: str) -> bool:
    """
    Check if a user with the given email exists in the database.

    Args:
        email: The email to check for.

    Returns:
        True if the email exists, False otherwise.
    """

    sql = "SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)"

    with Database() as cur:
        cur.execute(sql, (email,))
        return cur.fetchone()[0] == 1


def check_chat_exists(user1, user2):
    """
    Check if a chat between the two users exists in the database.

    Args:
        user1: The id of the first user.
        user2: The id of the second user.

    Returns:
        True if the chat exists, False otherwise.
    """

    sql = "SELECT EXISTS(SELECT 1 FROM chats WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?))"

    with Database() as cur:
        cur.execute(sql, (user1, user2, user2, user1))
        return cur.fetchone()[0] == 1


def check_user_exists(user_id):
    """
    Check if a user with the given user_id exists in the database.

    Args:
        user_id: The user_id to check for.

    Returns:
        True if the user exists, False otherwise.
    """

    sql = "SELECT EXISTS(SELECT 1 FROM users WHERE user_id = ?)"

    with Database() as cur:
        cur.execute(sql, (user_id,))
        return cur.fetchone()[0] == 1


# ------------------------- Write Functions -------------------------
# Return the id of the created elements

def create_user(username, email, password) -> Optional[int]:
    """
    Create a new user in the database.

    Args:
        username: The username of the new user.
        email: The email of the new user.
        password: The password of the new user.

    Returns:
        The id of the created user.
    """

    sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"

    with Database() as cur:
        cur.execute(sql, (username, email, password))
        return cur.lastrowid


def create_post(author_id, title, content) -> Optional[int]:
    """
    Create a new post in the database.

    Args:
        author_id: The id of the author of the post.
        title: The title of the post.
        content: The content of the post.

    Returns:
        The id of the created post.
    """

    sql = "INSERT INTO posts (author_id, title, content) VALUES (?, ?, ?)"

    with Database() as cur:
        cur.execute(sql, (author_id, title, content))
        return cur.lastrowid


def create_vote_post(user_id, post_id, vote) -> Optional[int]:
    """
    Create a new vote for a post in the database.

    Args:
        user_id: The id of the user who voted.
        post_id: The id of the post that was voted on.
        vote: The vote value (1 for upvote, -1 for downvote).

    Returns:
        The id of the created vote.
    """

    # Check if user already voted on the post
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
    """
    Create a new tag in the database.

    Args:
        tag_name: The name of the tag.

    Returns:
        The id of the created tag.
    """

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
    """
    Create a new comment in the database.

    Args:
        post_id: The id of the post the comment belongs to.
        author_id: The id of the author of the comment.
        content: The content of the comment.

    Returns:
        The id of the created comment.
    """

    sql = "INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)"

    with Database() as cur:
        cur.execute(sql, (post_id, author_id, content))
        return cur.lastrowid


def create_chat_msg(chat_id, user_id, message) -> Optional[int]:
    """
    Create a new chat message in the database.

    Args:
        chat_id: The id of the chat the message belongs to.
        user_id: The id of the user who sent the message.
        message: The message content.

    Returns:
        The id of the created message.
    """

    sql = "INSERT INTO chat_messages (chat_id, sent_by, message) VALUES (?, ?, ?)"

    with Database() as cur:
        cur.execute(sql, (chat_id, user_id, message))
        return cur.lastrowid


def create_chat(user1, user2) -> Optional[int]:
    """
    Create a new chat between two users in the database.

    Args:
        user1: The id of the first user.
        user2: The id of the second user.

    Returns:
        The id of the created chat.
    """

    sql = "INSERT INTO chats (user1, user2) VALUES (?, ?)"

    with Database() as cur:
        cur.execute(sql, (user1, user2))
        return cur.lastrowid


# ------------------------- Read Functions -------------------------
# Returns the specific model from schemas.py

def get_user_by_id(user_id) -> Optional[User]:
    """
    Fetch a user by their user_id from the database.

    Args:
        user_id: The id of the user to fetch.

    Returns:
        The user object if the user exists, None otherwise.
    """

    sql = "SELECT * FROM users WHERE user_id = ?"

    with Database() as cur:
        cur.execute(sql, (user_id,))
        result = cur.fetchone()

    if not result:  # user does not exist
        return None

    return User(**result)


def get_public_user_by_condition(condition_field, condition_value) -> Optional[User]:
    """
    Generic function to fetch a user by a specified condition from the database.

    Args:
        condition_field: The field to search for.
        condition_value: The value to search for.

    Returns:
        The user object if the user exists, None otherwise.
    """

    sql = f"SELECT user_id, username, email, registration_date, role FROM users WHERE {condition_field} = ?"

    with Database() as cur:
        cur.execute(sql, (condition_value,))
        result = cur.fetchone()

    if not result:  # user does not exist
        return None

    return User(**result)


def get_public_user_by_id(user_id) -> Optional[User]:
    return get_public_user_by_condition("user_id", user_id)


def get_public_user_by_username(username) -> Optional[User]:
    return get_public_user_by_condition("username", username)


def get_public_user_by_email(email) -> Optional[User]:
    return get_public_user_by_condition("email", email)


def get_post_by_id(post_id) -> Optional[Post]:
    """
    Fetch a post by its post_id from the database.

    Args:
        post_id: The id of the post to fetch.

    Returns:
        The post object if the post exists, None otherwise.
    """

    sql = "SELECT * FROM posts WHERE post_id = ?"

    with Database() as cur:
        cur.execute(sql, (post_id,))
        result = cur.fetchone()

    if not result:  # post does not exist
        return None

    return Post(**result)


def get_posts(search, amount, offset, sort_type, current_user_id) -> list[Post]:
    sql = """
        SELECT posts.*, COALESCE(SUM(vote), 0) AS total_votes 
        FROM posts 
        LEFT JOIN posts_votes 
        ON posts.post_id = posts_votes.post_id
    """
    parameters = ()

    if search:  # Search the title and content for the search term
        sql += " WHERE LOWER(TRIM(title)) LIKE ? OR LOWER(TRIM(content)) LIKE ?"
        parameters = (f"%{search}%", f"%{search}%")

    if sort_type == SortType.NEW:
        sql += " GROUP BY posts.post_id ORDER BY creation_date DESC"
    elif sort_type == SortType.CONTROVERSIAL:
        sql += " GROUP BY posts.post_id ORDER BY total_votes ASC"
    else:  # SortType.RECOMMENDED or SortType.POPULAR
        # This is the sorting by popular. We use this as a default and fall back to it if
        # no posts can be recommended.
        sql += " GROUP BY posts.post_id ORDER BY total_votes DESC"

    # Limit the amount of posts and offset the results
    if sort_type != SortType.RECOMMENDED:
        sql += " LIMIT ? OFFSET ?"
        parameters += (amount, offset)

    with Database() as cur:
        cur.execute(sql, parameters)
        results = cur.fetchall()

    posts = [Post(**result) for result in results]

    # If the sort type is recommended, return the recommended posts
    if sort_type == SortType.RECOMMENDED and current_user_id is not None:
        recommended_posts = sort_posts_by_recommendation(posts, current_user_id)

        if recommended_posts:
            return recommended_posts[offset:offset + amount]

        # If no posts can be recommended, fall back to popular posts
        return posts[offset:offset + amount]

    return posts


def get_tags_of_post(post_id) -> list[str]:
    """
    Fetch the tags of a post by its post_id from the database.

    Args:
        post_id: The id of the post to fetch the tags for.

    Returns:
        A list of tag names of the post.
    """

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
    """
    Fetch the total votes of a post by its post_id from the database.

    Args:
        post_id: The id of the post to fetch the votes for.

    Returns:
        The total votes of the post.
    """

    sql = "SELECT SUM(vote) FROM posts_votes WHERE post_id = ?"

    with Database() as cur:
        cur.execute(sql, (post_id,))
        result = cur.fetchone()

    return result[0]


def get_vote_of_user(post_id, user_id):
    """
    Fetch the vote of a user on a post by their ids from the database.

    Args:
        post_id: The id of the post to fetch the vote for.
        user_id: The id of the user to fetch the vote for.

    Returns:
        The vote of the user on the post.
    """

    sql = "SELECT vote FROM posts_votes WHERE post_id = ? AND user_id = ?"

    with Database() as cur:
        cur.execute(sql, (post_id, user_id))
        result = cur.fetchone()

    if result:
        return result[0]
    else:
        return 0  # user has not voted


def get_comment_by_id(comment_id) -> Optional[Comment]:
    """
    Fetch a comment by its comment_id from the database.

    Args:
        comment_id: The id of the comment to fetch.

    Returns:
        The comment object if the comment exists, None otherwise.
    """

    sql = "SELECT * FROM comments WHERE comment_id = ?"

    with Database() as cur:
        cur.execute(sql, (comment_id,))
        result = cur.fetchone()

    if not result:
        return None

    return Comment(**result)


def get_comments_of_post(post_id) -> list[Comment]:
    """
    Fetch the comments of a post by its post_id from the database.

    Args:
        post_id: The id of the post to fetch the comments for.

    Returns:
        A list of comment objects of the post.
    """

    sql = "SELECT * FROM comments WHERE post_id = ?"

    with Database() as cur:
        cur.execute(sql, (post_id,))
        results = cur.fetchall()

    return [Comment(**result) for result in results]


def get_chat_by_id(chat_id):
    """
    Fetch a chat by its chat_id from the database.

    Args:
        chat_id: The id of the chat to fetch.

    Returns:
        The chat object if the chat exists, None otherwise.
    """

    sql = "SELECT * FROM chats WHERE chat_id = ?"

    with Database() as cur:
        cur.execute(sql, (chat_id,))
        return cur.fetchone()


def get_chat_message(msg_id):
    """
    Fetch a chat message by its msg_id from the database.

    Args:
        msg_id: The id of the message to fetch.

    Returns:
        The chat message object if the message exists, None otherwise.
    """

    sql = "SELECT * FROM chat_messages WHERE msg_id = ?"

    with Database() as cur:
        cur.execute(sql, (msg_id,))
        return cur.fetchone()


def get_messages_of_chat(chat_id):
    """
    Fetch all messages of a chat by its chat_id from the database.

    Args:
        chat_id: The id of the chat to fetch the messages for.

    Returns:
        A list of message objects of the chat.
    """

    sql = "SELECT * FROM chat_messages WHERE chat_id = ?"

    with Database() as cur:
        cur.execute(sql, (chat_id,))
        return cur.fetchall()


def get_chats_of_user(user_id) -> list[Chat]:
    """
    Fetch all chats of a user by their user_id from the database.

    Args:
        user_id: The id of the user to fetch the chats for.

    Returns:
        A list of chat objects of the user.
    """

    # Select chat_id, both user_ids and the username of the other user
    sql = """
        SELECT chats.*, users.username as other_username 
        FROM chats JOIN users ON (chats.user1 = users.user_id OR chats.user2 = users.user_id) 
        WHERE (chats.user1 = ? OR chats.user2 = ?) AND users.user_id != ?
    """

    with Database() as cur:
        cur.execute(sql, (user_id, user_id, user_id))
        results = cur.fetchall()

    return [Chat(**result) for result in results]


# ------------------------- Update Requests -------------------------
# Returns a boolean which states whether the update was successful

def update_username(user_id, new_name) -> bool:
    """
    Update the username of a user in the database.

    Args:
        user_id: The id of the user to update.
        new_name: The new username of the user.

    Returns:
        True if the update was successful, False otherwise.
    """

    sql = "UPDATE users SET username = ? WHERE user_id = ?"

    with Database() as cur:
        cur.execute(sql, (new_name, user_id))
        return cur.rowcount > 0


def update_role(user_id: int, new_role: str) -> bool:
    """
    Update the role of a user in the database.

    Args:
        user_id: The id of the user to update.
        new_role: The new role of the user.

    Returns:
        True if the update was successful, False otherwise.
    """

    # Check if the new role is valid
    if new_role not in VALID_ROLES:
        raise ValueError("Invalid role")

    sql = "UPDATE users SET role = ? WHERE user_id = ?"

    with Database() as cur:
        cur.execute(sql, (new_role, user_id))
        return cur.rowcount > 0


def update_post_title(post_id, new_title):
    """
    Update the title of a post in the database.

    Args:
        post_id: The id of the post to update.
        new_title: The new title of the post.

    Returns:
        True if the update was successful, False otherwise.
    """

    sql = "UPDATE posts SET title = ? WHERE post_id = ?"

    with Database() as cur:
        cur.execute(sql, (new_title, post_id))
        return cur.rowcount > 0


def update_post_content(post_id, new_content):
    """
    Update the content of a post in the database.

    Args:
        post_id: The id of the post to update.
        new_content: The new content of the post.

    Returns:
        True if the update was successful, False otherwise.
    """

    sql = "UPDATE posts SET content = ? WHERE post_id = ?"

    with Database() as cur:
        cur.execute(sql, (new_content, post_id))
        return cur.rowcount > 0


def update_tags_of_post(post_id, new_tags: list):
    """
    Update the tags of a post in the database.

    Args:
        post_id: The id of the post to update.
        new_tags: The new tags of the post.

    Returns:
        True if the update was successful, False otherwise.
    """

    # Convert list to set to remove duplicates
    unique_tags = set(new_tags)

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
    """
    Add a tag to a post in the database.

    Args:
        post_id: The id of the post to update.
        tag_name: The name of the tag to add.

    Returns:
        True if the update was successful, False otherwise.
    """

    tag_id = create_tag(tag_name)
    sql = "INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)"

    with Database() as cur:
        cur.execute(sql, (post_id, tag_id))
        return cur.rowcount > 0


def update_vote_post(user_id, post_id, vote):
    """
    Update the vote of a user on a post in the database.

    Args:
        user_id: The id of the user who voted.
        post_id: The id of the post that was voted on.
        vote: The vote value (1 for upvote, -1 for downvote).

    Returns:
        True if the update was successful, False otherwise.
    """

    sql = "UPDATE posts_votes SET vote = ? WHERE user_id = ? AND post_id = ?"

    with Database() as cur:
        cur.execute(sql, (vote, user_id, post_id))
        return cur.rowcount > 0


def update_comment_content(comment_id, new_content):
    """
    Update the content of a comment in the database.

    Args:
        comment_id: The id of the comment to update.
        new_content: The new content of the comment.

    Returns:
        True if the update was successful, False otherwise.
    """

    sql = "UPDATE comments SET content = ? WHERE comment_id = ?"

    with Database() as cur:
        cur.execute(sql, (new_content, comment_id))
        return cur.rowcount > 0


# ------------------------- Delete Functions -------------------------
# Returns a boolean which states whether the deletion was successful

def delete_post_with_comments(post_id):
    """
    Delete a post and all of its comments from the database.

    Args:
        post_id: The id of the post to delete.

    Returns:
        True if the deletion was successful, False otherwise.
    """

    with Database() as cur:
        # Delete Post
        sql = "DELETE FROM posts WHERE post_id = ?"
        cur.execute(sql, (post_id,))

        # Also delete Comments of Post
        sql = "DELETE FROM comments WHERE post_id = ?"
        cur.execute(sql, (post_id,))

        # Also delete votes of post
        sql = "DELETE FROM posts_votes WHERE post_id = ?"
        cur.execute(sql, (post_id,))

        # Also delete tag associations of post
        sql = "DELETE FROM post_tags WHERE post_id = ?"
        cur.execute(sql, (post_id,))

        return cur.rowcount > 0


def delete_comment(comment_id):
    """
    Delete a comment from the database.

    Args:
        comment_id: The id of the comment to delete.

    Returns:
        True if the deletion was successful, False otherwise.
    """

    sql = "DELETE FROM comments WHERE comment_id = ?"

    with Database() as cur:
        cur.execute(sql, (comment_id,))
        return cur.rowcount > 0
