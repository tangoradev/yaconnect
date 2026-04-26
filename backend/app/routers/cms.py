from typing import Any, List, Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.cms import CmsPage, CmsPostWithMeta, CmsCategory, CmsTag
from app.services import cms_service
from app.models.cms import CmsTag as CmsTagModel, CmsCategory as CmsCategoryModel


router = APIRouter()


@router.get("/pages/{slug}", response_model=CmsPage)
def get_page(slug: str, db: Session = Depends(get_db)) -> Any:
    p = cms_service.get_public_page(db, slug)
    if not p:
        raise HTTPException(status_code=404, detail="Page not found")
    return p


@router.get("/posts", response_model=Dict[str, Any])
def list_posts(
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    category: Optional[str] = None,
    tag: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
) -> Any:
    posts, total = cms_service.list_public_posts(db, skip=skip, limit=limit, category_slug=category, tag_slug=tag, q=q)
    out: List[Dict[str, Any]] = []
    for p in posts:
        cat = None
        if p.category_id is not None:
            c = db.query(CmsCategoryModel).filter(CmsCategoryModel.id == p.category_id).first()
            if c:
                cat = c
        tag_ids = [t.tag_id for t in (p.tags or [])]
        tags = []
        if tag_ids:
            tags = db.query(CmsTagModel).filter(CmsTagModel.id.in_(tag_ids)).all()
        out.append(
            CmsPostWithMeta(
                id=p.id,
                slug=p.slug,
                title=p.title,
                content=p.content,
                content_format=p.content_format,
                excerpt=p.excerpt,
                cover_image_url=p.cover_image_url,
                meta_title=p.meta_title,
                meta_description=p.meta_description,
                status=p.status,
                published_at=p.published_at,
                category_id=p.category_id,
                created_by=p.created_by,
                created_at=p.created_at,
                updated_at=p.updated_at,
                category=cat,
                tags=tags,
            ).model_dump()
        )
    return {"items": out, "total": total}


@router.get("/posts/{slug}", response_model=CmsPostWithMeta)
def get_post(slug: str, db: Session = Depends(get_db)) -> Any:
    p = cms_service.get_public_post(db, slug)
    if not p:
        raise HTTPException(status_code=404, detail="Post not found")
    cat = None
    if p.category_id is not None:
        c = db.query(CmsCategoryModel).filter(CmsCategoryModel.id == p.category_id).first()
        if c:
            cat = c
    tag_ids = [t.tag_id for t in (p.tags or [])]
    tags = []
    if tag_ids:
        tags = db.query(CmsTagModel).filter(CmsTagModel.id.in_(tag_ids)).all()
    return CmsPostWithMeta(
        id=p.id,
        slug=p.slug,
        title=p.title,
        content=p.content,
        content_format=p.content_format,
        excerpt=p.excerpt,
        cover_image_url=p.cover_image_url,
        meta_title=p.meta_title,
        meta_description=p.meta_description,
        status=p.status,
        published_at=p.published_at,
        category_id=p.category_id,
        created_by=p.created_by,
        created_at=p.created_at,
        updated_at=p.updated_at,
        category=cat,
        tags=tags,
    )


@router.get("/categories", response_model=List[CmsCategory])
def list_categories(db: Session = Depends(get_db)) -> Any:
    return cms_service.list_categories(db)


@router.get("/tags", response_model=List[CmsTag])
def list_tags(db: Session = Depends(get_db)) -> Any:
    return cms_service.list_tags(db)
