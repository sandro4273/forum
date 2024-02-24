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


def update_username(user_id, new_name):
    with conn:
        sql = "UPDATE users SET username = ? WHERE user_id = ?"
        cur.execute(sql, (new_name, user_id))


def update_post_content(post_id, new_content):
    with conn:
        sql = "UPDATE posts SET content = ? WHERE post_id = ?"
        cur.execute(sql, (new_content, post_id))


def update_comment_content(comment_id, new_content):
    with conn:
        sql = "UPDATE comments SET content = ? WHERE comment_id = ?"
        cur.execute(sql, (new_content, comment_id))


def delete_post(post_id):
    with conn:
        sql = "DELETE FROM posts WHERE post_id = ?"
        cur.execute(sql, (post_id,))


def delete_comment(comment_id):
    with conn:
        sql = "DELETE FROM comments WHERE comment_id = ?"
        cur.execute(sql, (comment_id, ))
