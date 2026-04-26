from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.user import User
from app.models.forum import ForumTopic, ForumPost, ForumComment, ReactionType, ForumReaction
from app.models.interest import Interest
import uuid

def create_sample_discussion():
    db = SessionLocal()
    try:
        # 1. Get an Author
        # Try to find a user, or use the first one available
        author = db.query(User).first()
        if not author:
            print("No user found. Please create a user first via the app.")
            return

        print(f"Using author: {author.email}")

        # 2. Find a relevant Topic (Theme)
        # Try to find 'Climat' or 'Biodiversité'
        target_theme = "Climat"
        interest = db.query(Interest).filter(Interest.name == target_theme).first()
        
        topic = None
        if interest:
             topic = db.query(ForumTopic).filter(ForumTopic.theme_id == interest.id).first()
        
        if not topic:
             # Fallback to first available topic
             print(f"Topic '{target_theme}' not found, using first available topic.")
             topic = db.query(ForumTopic).first()
        
        if not topic:
            print("No topic found in database.")
            return

        print(f"Using topic: {topic.title}")

        # 3. Create the Post
        title = "🚀 L'entrepreneuriat vert : Une mine d'or pour la jeunesse ivoirienne ?"
        content = """Bonjour à tous la famille GRIN17 ! 🇨🇮

Je lance ce débat car je suis convaincu que notre génération a un rôle clé à jouer dans la transition écologique. Le PNUD soutient de plus en plus les initiatives durables et c'est le moment de se lancer !

**La question est simple :**
Quelles sont, selon vous, les meilleures opportunités de business "vert" en Côte d'Ivoire aujourd'hui ?

*   ♻️ **Le recyclage** : Transformer les déchets plastiques en briques ou en pavés ?
*   🥕 **L'agriculture durable** : Le bio et la permaculture pour nourrir nos villes ?
*   ☀️ **L'énergie** : Le solaire pour nos zones rurales ?

J'ai vu passer plusieurs appels à projets du PNUD sur ces sujets. Qui a déjà postulé ? Partagez vos expériences ! 👇"""
        
        post = ForumPost(
            title=title,
            content=content,
            topic_id=topic.id,
            user_id=author.id,
            media_url="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
            is_pinned=True # Pin it to make it visible
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        print(f"Post created: {post.title}")

        # 4. Add some comments (Self-commenting for demo if only 1 user)
        comments_data = [
            "Pour ma part, je mise tout sur la transformation du cacao en produits finis bio. C'est une richesse qu'on doit valoriser ici ! 🍫",
            "Très pertinent ! Le charbon écologique à base de résidus agricoles est aussi un secteur en plein boom. Ça sauve nos forêts.",
            "Est-ce que quelqu'un a le lien pour les appels à projets du PNUD dont tu parles ? Ça m'intéresse.",
            "Oui, tu peux regarder sur le site officiel du PNUD RCI ou ici même dans la section 'Projets' de GRIN17 !"
        ]

        for text in comments_data:
            comment = ForumComment(
                post_id=post.id,
                user_id=author.id,
                content=text
            )
            db.add(comment)
        
        # 5. Add Reaction
        reaction = ForumReaction(
            post_id=post.id,
            user_id=author.id,
            reaction_type=ReactionType.INSPIRING
        )
        db.add(reaction)

        db.commit()
        print("Sample discussion created successfully!")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_discussion()
