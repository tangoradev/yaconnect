import os
import re
import io
import uuid
from datetime import datetime
from typing import Optional, List, Tuple
from uuid import UUID

from PIL import Image
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.cms import (
    CmsPage,
    CmsPost,
    CmsCategory,
    CmsTag,
    CmsPostTag,
    CmsMedia,
    CmsRevision,
    CmsStatus,
    CmsRevisionEntityType,
)
from app.models.user import User
from app.schemas.cms import (
    CmsPageCreate,
    CmsPageUpdate,
    CmsPostCreate,
    CmsPostUpdate,
)


def _slugify(value: str) -> str:
    s = (value or "").strip().lower()
    s = re.sub(r"[^\w\s-]", "", s, flags=re.UNICODE)
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s or "contenu"


def _ensure_unique_slug(db: Session, model, slug: str, exclude_id: Optional[UUID] = None) -> str:
    base = _slugify(slug)
    candidate = base
    i = 2
    while True:
        q = db.query(model).filter(model.slug == candidate)
        if exclude_id is not None:
            q = q.filter(model.id != exclude_id)
        exists = db.query(q.exists()).scalar()
        if not exists:
            return candidate
        candidate = f"{base}-{i}"
        i += 1


def _snapshot_page(p: CmsPage) -> dict:
    return {
        "slug": p.slug,
        "title": p.title,
        "content": p.content,
        "content_format": p.content_format.value if p.content_format else None,
        "excerpt": p.excerpt,
        "meta_title": p.meta_title,
        "meta_description": p.meta_description,
        "status": p.status.value if p.status else None,
        "published_at": p.published_at.isoformat() if p.published_at else None,
    }


def _snapshot_post(p: CmsPost, tag_ids: List[int]) -> dict:
    return {
        "slug": p.slug,
        "title": p.title,
        "content": p.content,
        "content_format": p.content_format.value if p.content_format else None,
        "excerpt": p.excerpt,
        "cover_image_url": p.cover_image_url,
        "meta_title": p.meta_title,
        "meta_description": p.meta_description,
        "status": p.status.value if p.status else None,
        "published_at": p.published_at.isoformat() if p.published_at else None,
        "category_id": p.category_id,
        "tag_ids": tag_ids,
    }


def _create_revision(db: Session, entity_type: CmsRevisionEntityType, entity_id: UUID, snapshot: dict, actor: User) -> CmsRevision:
    r = CmsRevision(entity_type=entity_type, entity_id=entity_id, snapshot=snapshot, created_by=actor.id)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


def list_public_posts(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    category_slug: Optional[str] = None,
    tag_slug: Optional[str] = None,
    q: Optional[str] = None,
) -> Tuple[List[CmsPost], int]:
    now = datetime.utcnow()
    query = db.query(CmsPost).filter(CmsPost.status == CmsStatus.PUBLISHED).filter(
        (CmsPost.published_at == None) | (CmsPost.published_at <= now)
    )

    if category_slug:
        cat = db.query(CmsCategory).filter(CmsCategory.slug == category_slug).first()
        if cat:
            query = query.filter(CmsPost.category_id == cat.id)
        else:
            query = query.filter(CmsPost.category_id == -1)

    if tag_slug:
        tag = db.query(CmsTag).filter(CmsTag.slug == tag_slug).first()
        if tag:
            query = query.join(CmsPostTag, CmsPostTag.post_id == CmsPost.id).filter(CmsPostTag.tag_id == tag.id)
        else:
            query = query.filter(CmsPost.id == None)

    if q:
        tsq = func.plainto_tsquery("french", q)
        vec = func.to_tsvector("french", func.concat_ws(" ", func.coalesce(CmsPost.title, ""), func.coalesce(CmsPost.content, "")))
        query = query.filter(vec.op("@@")(tsq))

    total = query.count()
    posts = query.order_by(CmsPost.published_at.desc().nullslast(), CmsPost.created_at.desc()).offset(skip).limit(limit).all()
    return posts, int(total)


def get_public_post(db: Session, slug: str) -> Optional[CmsPost]:
    now = datetime.utcnow()
    return (
        db.query(CmsPost)
        .filter(CmsPost.slug == slug)
        .filter(CmsPost.status == CmsStatus.PUBLISHED)
        .filter((CmsPost.published_at == None) | (CmsPost.published_at <= now))
        .first()
    )


def get_public_page(db: Session, slug: str) -> Optional[CmsPage]:
    now = datetime.utcnow()
    return (
        db.query(CmsPage)
        .filter(CmsPage.slug == slug)
        .filter(CmsPage.status == CmsStatus.PUBLISHED)
        .filter((CmsPage.published_at == None) | (CmsPage.published_at <= now))
        .first()
    )


def list_admin_pages(db: Session, skip: int = 0, limit: int = 50) -> List[CmsPage]:
    return db.query(CmsPage).order_by(CmsPage.updated_at.desc()).offset(skip).limit(limit).all()


def list_admin_posts(db: Session, skip: int = 0, limit: int = 50) -> List[CmsPost]:
    return db.query(CmsPost).order_by(CmsPost.updated_at.desc()).offset(skip).limit(limit).all()


def create_page(db: Session, page_in: CmsPageCreate, actor: User) -> CmsPage:
    payload = page_in.model_dump()
    slug = payload.get("slug") or payload.get("title") or "page"
    payload["slug"] = _ensure_unique_slug(db, CmsPage, slug)
    p = CmsPage(**payload, created_by=actor.id)
    db.add(p)
    db.commit()
    db.refresh(p)
    _create_revision(db, CmsRevisionEntityType.PAGE, p.id, _snapshot_page(p), actor)
    return p


def update_page(db: Session, page_id: UUID, page_in: CmsPageUpdate, actor: User) -> Optional[CmsPage]:
    p = db.query(CmsPage).filter(CmsPage.id == page_id).first()
    if not p:
        return None
    _create_revision(db, CmsRevisionEntityType.PAGE, p.id, _snapshot_page(p), actor)

    data = page_in.model_dump(exclude_unset=True)
    if "slug" in data and data["slug"]:
        data["slug"] = _ensure_unique_slug(db, CmsPage, data["slug"], exclude_id=p.id)
    elif "title" in data and data["title"] and not p.slug:
        data["slug"] = _ensure_unique_slug(db, CmsPage, data["title"], exclude_id=p.id)
    for k, v in data.items():
        setattr(p, k, v)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def delete_page(db: Session, page_id: UUID) -> bool:
    p = db.query(CmsPage).filter(CmsPage.id == page_id).first()
    if not p:
        return False
    db.delete(p)
    db.commit()
    return True


def _set_post_tags(db: Session, post: CmsPost, tag_ids: List[int]):
    post.tags = []
    if not tag_ids:
        return
    tags = db.query(CmsTag).filter(CmsTag.id.in_(tag_ids)).all()
    tags_by_id = {t.id: t for t in tags}
    for tid in tag_ids:
        if tid in tags_by_id:
            post.tags.append(CmsPostTag(tag_id=tid))


def create_post(db: Session, post_in: CmsPostCreate, actor: User) -> CmsPost:
    payload = post_in.model_dump()
    tag_ids = payload.pop("tag_ids", []) or []
    slug = payload.get("slug") or payload.get("title") or "article"
    payload["slug"] = _ensure_unique_slug(db, CmsPost, slug)
    p = CmsPost(**payload, created_by=actor.id)
    db.add(p)
    db.commit()
    db.refresh(p)

    _set_post_tags(db, p, tag_ids)
    db.add(p)
    db.commit()
    db.refresh(p)
    _create_revision(db, CmsRevisionEntityType.POST, p.id, _snapshot_post(p, tag_ids), actor)
    return p


def update_post(db: Session, post_id: UUID, post_in: CmsPostUpdate, actor: User) -> Optional[CmsPost]:
    p = db.query(CmsPost).filter(CmsPost.id == post_id).first()
    if not p:
        return None

    current_tag_ids = [t.tag_id for t in (p.tags or [])]
    _create_revision(db, CmsRevisionEntityType.POST, p.id, _snapshot_post(p, current_tag_ids), actor)

    data = post_in.model_dump(exclude_unset=True)
    tag_ids = data.pop("tag_ids", None)
    if "slug" in data and data["slug"]:
        data["slug"] = _ensure_unique_slug(db, CmsPost, data["slug"], exclude_id=p.id)
    elif "title" in data and data["title"] and not p.slug:
        data["slug"] = _ensure_unique_slug(db, CmsPost, data["title"], exclude_id=p.id)
    for k, v in data.items():
        setattr(p, k, v)
    if tag_ids is not None:
        _set_post_tags(db, p, tag_ids or [])
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def delete_post(db: Session, post_id: UUID) -> bool:
    p = db.query(CmsPost).filter(CmsPost.id == post_id).first()
    if not p:
        return False
    db.delete(p)
    db.commit()
    return True


def list_categories(db: Session) -> List[CmsCategory]:
    return db.query(CmsCategory).order_by(CmsCategory.name.asc()).all()


def create_category(db: Session, name: str, slug: Optional[str] = None) -> CmsCategory:
    s = _ensure_unique_slug(db, CmsCategory, slug or name)
    c = CmsCategory(name=name, slug=s)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def delete_category(db: Session, category_id: int) -> bool:
    c = db.query(CmsCategory).filter(CmsCategory.id == category_id).first()
    if not c:
        return False
    db.delete(c)
    db.commit()
    return True


def list_tags(db: Session) -> List[CmsTag]:
    return db.query(CmsTag).order_by(CmsTag.name.asc()).all()


def create_tag(db: Session, name: str, slug: Optional[str] = None) -> CmsTag:
    s = _ensure_unique_slug(db, CmsTag, slug or name)
    t = CmsTag(name=name, slug=s)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


def delete_tag(db: Session, tag_id: int) -> bool:
    t = db.query(CmsTag).filter(CmsTag.id == tag_id).first()
    if not t:
        return False
    db.delete(t)
    db.commit()
    return True


def list_revisions(db: Session, entity_type: CmsRevisionEntityType, entity_id: UUID, limit: int = 30) -> List[CmsRevision]:
    return (
        db.query(CmsRevision)
        .filter(CmsRevision.entity_type == entity_type)
        .filter(CmsRevision.entity_id == entity_id)
        .order_by(CmsRevision.created_at.desc())
        .limit(limit)
        .all()
    )


def restore_revision(db: Session, revision_id: UUID, actor: User) -> Optional[object]:
    rev = db.query(CmsRevision).filter(CmsRevision.id == revision_id).first()
    if not rev:
        return None
    snap = rev.snapshot or {}
    if rev.entity_type == CmsRevisionEntityType.PAGE:
        p = db.query(CmsPage).filter(CmsPage.id == rev.entity_id).first()
        if not p:
            return None
        _create_revision(db, CmsRevisionEntityType.PAGE, p.id, _snapshot_page(p), actor)
        for k, v in snap.items():
            if k == "published_at" and v:
                setattr(p, k, datetime.fromisoformat(v))
            elif k in ["slug", "title", "content", "excerpt", "meta_title", "meta_description"]:
                setattr(p, k, v)
            elif k == "status" and v:
                setattr(p, k, CmsStatus(v))
        p.slug = _ensure_unique_slug(db, CmsPage, p.slug, exclude_id=p.id)
        db.add(p)
        db.commit()
        db.refresh(p)
        return p

    if rev.entity_type == CmsRevisionEntityType.POST:
        p = db.query(CmsPost).filter(CmsPost.id == rev.entity_id).first()
        if not p:
            return None
        current_tag_ids = [t.tag_id for t in (p.tags or [])]
        _create_revision(db, CmsRevisionEntityType.POST, p.id, _snapshot_post(p, current_tag_ids), actor)
        tag_ids = snap.get("tag_ids") or []
        for k, v in snap.items():
            if k == "published_at" and v:
                setattr(p, k, datetime.fromisoformat(v))
            elif k in ["slug", "title", "content", "excerpt", "cover_image_url", "meta_title", "meta_description", "category_id"]:
                setattr(p, k, v)
            elif k == "status" and v:
                setattr(p, k, CmsStatus(v))
        p.slug = _ensure_unique_slug(db, CmsPost, p.slug, exclude_id=p.id)
        _set_post_tags(db, p, tag_ids)
        db.add(p)
        db.commit()
        db.refresh(p)
        return p
    return None


def upload_media(db: Session, actor: User, raw_bytes: bytes, original_filename: str, content_type: str) -> CmsMedia:
    max_size = 10 * 1024 * 1024
    if len(raw_bytes) > max_size:
        raise ValueError("file_too_large")
    if not content_type or not content_type.startswith("image/"):
        raise ValueError("invalid_mime")

    img = Image.open(io.BytesIO(raw_bytes))
    img = img.convert("RGB")
    width, height = img.size
    if width > 1600:
        ratio = 1600 / float(width)
        img = img.resize((1600, int(height * ratio)))
        width, height = img.size

    media_id = uuid.uuid4()
    out_dir = os.path.join("static", "cms")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{media_id}.webp")
    img.save(out_path, "WEBP", quality=80, method=6)
    file_url = f"/static/cms/{media_id}.webp"

    m = CmsMedia(
        id=media_id,
        file_url=file_url,
        mime="image/webp",
        width=int(width),
        height=int(height),
        size_bytes=os.path.getsize(out_path) if os.path.exists(out_path) else None,
        created_by=actor.id,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def init_defaults(db: Session, actor: User) -> dict:
    created = {"categories": 0, "tags": 0, "pages": 0}

    if db.query(CmsCategory).count() == 0:
        for name in ["Communiqués", "Actualités", "Opportunités"]:
            create_category(db, name=name)
            created["categories"] += 1

    if db.query(CmsTag).count() == 0:
        for name in ["Climat", "Biodiversité", "Paix", "Cohésion sociale"]:
            create_tag(db, name=name)
            created["tags"] += 1

    if db.query(CmsPage).count() == 0:
        pages = [
            ("a-propos", "À propos", "## À propos\n\nContenu à compléter."),
            ("contact", "Contact", "## Contact\n\nContenu à compléter."),
            ("faq", "FAQ", "## FAQ\n\nContenu à compléter."),
        ]
        for slug, title, content in pages:
            create_page(
                db,
                CmsPageCreate(slug=slug, title=title, content=content, status=CmsStatus.DRAFT),
                actor,
            )
            created["pages"] += 1

    return created

