from typing import Any, List, Optional, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core import dependencies
from app.models.user import User
from app.models.cms import CmsRevisionEntityType, CmsMedia as CmsMediaModel
from app.schemas.cms import (
    CmsPage,
    CmsPageCreate,
    CmsPageUpdate,
    CmsPostAdmin,
    CmsPostCreate,
    CmsPostUpdate,
    CmsCategory,
    CmsTag,
    CmsMedia,
    CmsRevision,
)
from app.services import cms_service


router = APIRouter()


@router.post("/cms/init")
def init_cms(
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    return cms_service.init_defaults(db, current_admin)


@router.get("/cms/pages", response_model=List[CmsPage])
def admin_list_pages(
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    return cms_service.list_admin_pages(db, skip=skip, limit=limit)


@router.post("/cms/pages", response_model=CmsPage)
def admin_create_page(
    page_in: CmsPageCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    return cms_service.create_page(db, page_in, current_admin)


@router.put("/cms/pages/{page_id}", response_model=CmsPage)
def admin_update_page(
    page_id: UUID,
    page_in: CmsPageUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    p = cms_service.update_page(db, page_id, page_in, current_admin)
    if not p:
        raise HTTPException(status_code=404, detail="Page not found")
    return p


@router.delete("/cms/pages/{page_id}")
def admin_delete_page(
    page_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    ok = cms_service.delete_page(db, page_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"status": "success"}


@router.get("/cms/posts", response_model=List[CmsPostAdmin])
def admin_list_posts(
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    posts = cms_service.list_admin_posts(db, skip=skip, limit=limit)
    out: List[CmsPostAdmin] = []
    for p in posts:
        tag_ids = [t.tag_id for t in (p.tags or [])]
        out.append(
            CmsPostAdmin(
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
                tag_ids=tag_ids,
            )
        )
    return out


@router.post("/cms/posts", response_model=CmsPostAdmin)
def admin_create_post(
    post_in: CmsPostCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    p = cms_service.create_post(db, post_in, current_admin)
    tag_ids = [t.tag_id for t in (p.tags or [])]
    return CmsPostAdmin(
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
        tag_ids=tag_ids,
    )


@router.put("/cms/posts/{post_id}", response_model=CmsPostAdmin)
def admin_update_post(
    post_id: UUID,
    post_in: CmsPostUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    p = cms_service.update_post(db, post_id, post_in, current_admin)
    if not p:
        raise HTTPException(status_code=404, detail="Post not found")
    tag_ids = [t.tag_id for t in (p.tags or [])]
    return CmsPostAdmin(
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
        tag_ids=tag_ids,
    )


@router.delete("/cms/posts/{post_id}")
def admin_delete_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    ok = cms_service.delete_post(db, post_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"status": "success"}


@router.get("/cms/categories", response_model=List[CmsCategory])
def admin_list_categories(
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    return cms_service.list_categories(db)


@router.post("/cms/categories", response_model=CmsCategory)
def admin_create_category(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    slug = payload.get("slug")
    return cms_service.create_category(db, name=name, slug=slug)


@router.delete("/cms/categories/{category_id}")
def admin_delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    ok = cms_service.delete_category(db, category_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"status": "success"}


@router.get("/cms/tags", response_model=List[CmsTag])
def admin_list_tags(
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    return cms_service.list_tags(db)


@router.post("/cms/tags", response_model=CmsTag)
def admin_create_tag(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")
    slug = payload.get("slug")
    return cms_service.create_tag(db, name=name, slug=slug)


@router.delete("/cms/tags/{tag_id}")
def admin_delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    ok = cms_service.delete_tag(db, tag_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Tag not found")
    return {"status": "success"}


@router.post("/cms/media", response_model=CmsMedia)
async def admin_upload_media(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    raw = await file.read()
    try:
        return cms_service.upload_media(db, current_admin, raw_bytes=raw, original_filename=file.filename or "", content_type=file.content_type or "")
    except ValueError as e:
        if str(e) == "file_too_large":
            raise HTTPException(status_code=400, detail="File too large")
        if str(e) == "invalid_mime":
            raise HTTPException(status_code=400, detail="Invalid file type")
        raise


@router.get("/cms/media", response_model=List[CmsMedia])
def admin_list_media(
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    return db.query(CmsMediaModel).order_by(CmsMediaModel.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/cms/revisions", response_model=List[CmsRevision])
def admin_list_revisions(
    entity_type: CmsRevisionEntityType,
    entity_id: UUID,
    limit: int = Query(default=30, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    return cms_service.list_revisions(db, entity_type=entity_type, entity_id=entity_id, limit=limit)


@router.post("/cms/revisions/{revision_id}/restore")
def admin_restore_revision(
    revision_id: UUID,
    db: Session = Depends(get_db),
    current_admin: User = Depends(dependencies.get_current_admin),
) -> Any:
    restored = cms_service.restore_revision(db, revision_id, current_admin)
    if not restored:
        raise HTTPException(status_code=404, detail="Revision not found")
    return {"status": "success"}
