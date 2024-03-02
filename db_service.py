# Simple CRUD operations for users, posts and comments
import sqlite3

conn = sqlite3.connect("forum.db")
conn.row_factory = sqlite3.Row
cur = conn.cursor()


def close_db():
    conn.close()


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


def get_user_by_id(user_id):
    sql = "SELECT * FROM users WHERE user_id = ?"
    cur.execute(sql, (user_id,))
    return cur.fetchone()


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


def get_chat_message(msg_id):
    sql = "SELECT * FROM chat_messages WHERE msg_id = ?"
    cur.execute(sql, (msg_id,))
    return cur.fetchone()


def get_messages_of_chat(chat_id):
    sql = "SELECT * FROM chat_messages WHERE chat_id = ?"
    cur.execute(sql, (chat_id,))
    return cur.fetchall()


def get_chats_of_user(user_id):
    sql = "SELECT chat_id FROM chats WHERE user1 = ? OR user2 = ?"
    cur.execute(sql, (user_id, user_id))
    return cur.fetchall()


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


def delete_post_with_comments(post_id):
    with conn:
        # Post Löschen
        sql = "DELETE FROM posts WHERE post_id = ?"
        cur.execute(sql, (post_id,))
        # Dazugehörige Kommentare Löschen
        sql = "DELETE FROM comments WHERE post_id = ?"
        cur.execute(sql, (post_id,))


def delete_comment(comment_id):
    with conn:
        sql = "DELETE FROM comments WHERE comment_id = ?"
        cur.execute(sql, (comment_id, ))


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