from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.forum import ForumPost

def remove_duplicates_by_title():
    db = SessionLocal()
    try:
        title = "🚀 L'entrepreneuriat vert : Une mine d'or pour la jeunesse ivoirienne ?"
        posts = db.query(ForumPost).filter(ForumPost.title == title).order_by(ForumPost.created_at.desc()).all()
        
        if len(posts) > 1:
            print(f"Found {len(posts)} posts with title '{title}'")
            # Keep the oldest one (first created), delete the rest
            # posts are ordered by created_at desc, so last one is oldest.
            # Or keep the newest? Doesn't matter much. Let's keep the first one found (newest) and delete others?
            # Usually we want to keep the one with comments/reactions. But here they are identical probably.
            # Let's keep the oldest one.
            posts_to_delete = posts[:-1] # All except the last one (oldest)
            
            for p in posts_to_delete:
                print(f"Deleting post {p.id} created at {p.created_at}")
                db.delete(p)
            
            db.commit()
            print("Duplicates deleted.")
        else:
            print("No duplicates found.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    remove_duplicates_by_title()
