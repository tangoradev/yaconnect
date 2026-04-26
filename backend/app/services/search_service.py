from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.forum import ForumPost, ForumTopic
from app.models.project import Project
from typing import List

def search_forum(db: Session, query: str, limit: int = 20):
    tsquery = func.plainto_tsquery("french", query)
    results = []

    topic_text = func.concat_ws(" ", func.coalesce(ForumTopic.title, ""), func.coalesce(ForumTopic.description, ""))
    topic_vec = func.to_tsvector("french", topic_text)
    topic_rank = func.ts_rank_cd(topic_vec, tsquery)
    topics = (
        db.query(ForumTopic, topic_rank.label("rank"))
        .filter(topic_vec.op("@@")(tsquery))
        .order_by(desc("rank"))
        .limit(limit)
        .all()
    )
    for t, rank in topics:
        results.append(
            {
                "id": t.id,
                "type": "topic",
                "title": t.title,
                "content": (t.description or "")[:200],
                "created_at": t.created_at,
                "author_id": t.created_by,
                "relevance": float(rank or 0.0),
            }
        )

    post_text = func.concat_ws(" ", func.coalesce(ForumPost.title, ""), func.coalesce(ForumPost.content, ""))
    post_vec = func.to_tsvector("french", post_text)
    post_rank = func.ts_rank_cd(post_vec, tsquery)
    posts = (
        db.query(ForumPost, post_rank.label("rank"))
        .filter(post_vec.op("@@")(tsquery))
        .order_by(desc("rank"))
        .limit(limit)
        .all()
    )
    for p, rank in posts:
        results.append(
            {
                "id": p.id,
                "type": "post",
                "title": p.title,
                "content": p.content[:200] + "..." if len(p.content) > 200 else p.content,
                "created_at": p.created_at,
                "author_id": p.user_id,
                "relevance": float(rank or 0.0),
            }
        )

    project_text = func.concat_ws(
        " ",
        func.coalesce(Project.title, ""),
        func.coalesce(Project.description, ""),
        func.coalesce(Project.problem_statement, ""),
        func.coalesce(Project.objectives, ""),
        func.coalesce(Project.partners_needed, ""),
    )
    project_vec = func.to_tsvector("french", project_text)
    project_rank = func.ts_rank_cd(project_vec, tsquery)
    projects = (
        db.query(Project, project_rank.label("rank"))
        .filter(project_vec.op("@@")(tsquery))
        .order_by(desc("rank"))
        .limit(limit)
        .all()
    )
    for prj, rank in projects:
        results.append(
            {
                "id": prj.id,
                "type": "project",
                "title": prj.title,
                "content": (prj.description or prj.problem_statement or "")[:200],
                "created_at": prj.created_at,
                "author_id": prj.created_by,
                "relevance": float(rank or 0.0),
            }
        )

    results.sort(key=lambda x: x.get("relevance", 0.0), reverse=True)
    return results[:limit]
