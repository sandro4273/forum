# Programmierprojekt Forum, 06.03.2024
# Luca Flühler, Lucien Ruffet, Sandro Kuster
# Beschreibung: Datenbank-Service für das Forum

import sqlite3

conn = sqlite3.connect("forum.db")
conn.row_factory = sqlite3.Row
cur = conn.cursor()


def close_db():
    conn.close()


def login_user(email, password):
    sql = "SELECT user_id FROM users WHERE email = ? AND password = ?"
    cur.execute(sql, (email, password))

    result = cur.fetchone()

    if result:
        return result[0]  # user_id
    else:
        return None


def username_exists(username: str) -> bool:
    sql = "SELECT EXISTS(SELECT 1 FROM users WHERE username = ?)"
    cur.execute(sql, (username,))
    return cur.fetchone()[0] == 1


def email_exists(email: str) -> bool:
    sql = "SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)"
    cur.execute(sql, (email,))
    return cur.fetchone()[0] == 1


# Create functions
def create_user(username, email, password):
    sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
    cur.execute(sql, (username, email, password))
    conn.commit()
    return cur.lastrowid


def create_post(user_id, title, content):
    sql = "INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)"
    cur.execute(sql, (user_id, title, content))
    conn.commit()
    return cur.lastrowid


def create_comment(post_id, user_id, content):
    sql = "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)"
    cur.execute(sql, (post_id, user_id, content))
    conn.commit()
    return cur.lastrowid


def create_chat_msg(chat_id, user_id, message):
    sql = "INSERT INTO chat_messages (chat_id, sent_by, message) VALUES (?, ?, ?)"
    cur.execute(sql, (chat_id, user_id, message))
    conn.commit()
    return cur.lastrowid


def create_chat(user1, user2):
    sql = "INSERT INTO chats (user1, user2) VALUES (?, ?)"
    cur.execute(sql, (user1, user2))
    conn.commit()
    return cur.lastrowid


# Read functions
def get_user_by_id(user_id):
    sql = "SELECT * FROM users WHERE user_id = ?"
    cur.execute(sql, (user_id,))
    return cur.fetchone()


def get_username_by_id(user_id):
    sql = "SELECT username FROM users WHERE user_id = ?"
    cur.execute(sql, (user_id,))
    return cur.fetchone()[0]


def get_post_by_id(post_id):
    sql = "SELECT * FROM posts WHERE post_id = ?"
    cur.execute(sql, (post_id,))
    return cur.fetchone()


def get_all_posts():
    sql = "SELECT * FROM posts"
    cur.execute(sql)
    return cur.fetchall()


def get_comment_by_id(comment_id):
    sql = "SELECT * FROM comments WHERE comment_id = ?"
    cur.execute(sql, (comment_id,))
    return cur.fetchone()


def get_comments_of_post(post_id):
    sql = "SELECT * FROM comments WHERE post_id = ?"
    cur.execute(sql, (post_id,))
    return cur.fetchall()


def get_chat_by_id(chat_id):
    sql = "SELECT * FROM chats WHERE chat_id = ?"
    cur.execute(sql, (chat_id,))
    return cur.fetchone()

def get_chat_message(msg_id):
    sql = "SELECT * FROM chat_messages WHERE msg_id = ?"
    cur.execute(sql, (msg_id,))
    return cur.fetchone()


def get_messages_of_chat(chat_id):
    sql = "SELECT * FROM chat_messages WHERE chat_id = ?"
    cur.execute(sql, (chat_id,))
    return cur.fetchall()


def get_chats_of_user(user_id):
    # Select chat_id, both user_ids and the username of the other user
    sql = "SELECT chats.*, users.username as other_username FROM chats JOIN users ON (chats.user1 = users.user_id OR chats.user2 = users.user_id) WHERE (chats.user1 = ? OR chats.user2 = ?) AND users.user_id != ?"
    cur.execute(sql, (user_id, user_id, user_id))
    return cur.fetchall()   # response looks like: [{"chat_id": 1, "user1": 1, "user2": 2, "other_username": "user2"}]


# Update functions
def update_username(user_id, new_name):
    with conn:
        sql = "UPDATE users SET username = ? WHERE user_id = ?"
        cur.execute(sql, (new_name, user_id))


def update_post_title(post_id, new_title):
    with conn:
        sql = "UPDATE posts SET title = ? WHERE post_id = ?"
        cur.execute(sql, (new_title, post_id))


def update_post_content(post_id, new_content):
    with conn:
        sql = "UPDATE posts SET content = ? WHERE post_id = ?"
        cur.execute(sql, (new_content, post_id))


def update_comment_content(comment_id, new_content):
    with conn:
        sql = "UPDATE comments SET content = ? WHERE comment_id = ?"
        cur.execute(sql, (new_content, comment_id))


# Delete functions
def delete_post_with_comments(post_id):
    with conn:
        # Delete Post
        sql = "DELETE FROM posts WHERE post_id = ?"
        cur.execute(sql, (post_id,))
        # Delete Comments of Post
        sql = "DELETE FROM comments WHERE post_id = ?"
        cur.execute(sql, (post_id,))


def delete_comment(comment_id):
    with conn:
        sql = "DELETE FROM comments WHERE comment_id = ?"
        cur.execute(sql, (comment_id, ))


# other functions
def check_chat_exists(user1, user2):
    if user1 == user2:
        return True
    sql = "SELECT chat_id FROM chats WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)"
    cur.execute(sql, (user1, user2, user2, user1))
    return cur.fetchone()


def check_user_exists(user_id):
    sql = "SELECT * FROM users WHERE user_id = ?"
    cur.execute(sql, (user_id,))
    return cur.fetchone()