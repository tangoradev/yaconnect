from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.forum import ForumPost

def list_posts():
    db = SessionLocal()
    try:
        posts = db.query(ForumPost).all()
        print(f"Total posts: {len(posts)}")
        for p in posts:
            print(f"Post ID: {p.id}, Title: {p.title}, Created: {p.created_at}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_posts()
