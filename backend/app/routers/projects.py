from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import os
import uuid
from PIL import Image

from app.database.session import get_db
from app.core import dependencies
from app.schemas.user import User
from app.schemas.project import (
    Project,
    ProjectCreate,
    ProjectUpdate,
    ProjectCommentCreate,
    ProjectComment,
    ProjectVoteCreate,
    ProjectVote,
    ProjectStatus,
    ProjectMedia,
    ProjectMediaType,
)
from app.services import project_service


router = APIRouter()

@router.get("/top", response_model=List[Project])
async def read_top_projects(
    request: Request,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    redis_client = getattr(request.app.state, "redis", None)
    ids = []
    if redis_client is not None:
        try:
            raw = await redis_client.get("projects:top:ids")
            if raw:
                import json
                ids = json.loads(raw)
        except Exception:
            ids = []

    if ids:
        projects = []
        for pid in ids[:limit]:
            try:
                project_uuid = UUID(pid)
            except Exception:
                continue
            p = project_service.get_project(db, project_uuid)
            if p:
                projects.append(p)
        return projects

    projects = project_service.list_projects(db, skip=0, limit=limit, sort="popularity")
    for p in projects:
        project_service.hydrate_project_metrics(db, p)
    if redis_client is not None:
        try:
            import json
            await redis_client.set("projects:top:ids", json.dumps([str(p.id) for p in projects]), ex=60 * 10)
        except Exception:
            pass
    return projects


@router.get("/trending", response_model=List[Project])
async def read_trending_projects(
    request: Request,
    limit: int = 10,
    db: Session = Depends(get_db),
):
    redis_client = getattr(request.app.state, "redis", None)
    ids = []
    if redis_client is not None:
        try:
            raw = await redis_client.get("projects:trending:ids")
            if raw:
                import json
                ids = json.loads(raw)
        except Exception:
            ids = []

    if ids:
        projects = []
        for pid in ids[:limit]:
            try:
                project_uuid = UUID(pid)
            except Exception:
                continue
            p = project_service.get_project(db, project_uuid)
            if p:
                projects.append(p)
        return projects

    projects = project_service.list_projects(db, skip=0, limit=limit, sort="trending")
    for p in projects:
        project_service.hydrate_project_metrics(db, p)
    if redis_client is not None:
        try:
            import json
            await redis_client.set("projects:trending:ids", json.dumps([str(p.id) for p in projects]), ex=60 * 10)
        except Exception:
            pass
    return projects


@router.get("/", response_model=List[Project])
def read_projects(
    skip: int = 0,
    limit: int = 20,
    region_id: Optional[int] = None,
    status: Optional[ProjectStatus] = None,
    sort: str = "recent",
    db: Session = Depends(get_db),
):
    projects = project_service.list_projects(db, skip=skip, limit=limit, region_id=region_id, status=status, sort=sort)
    for p in projects:
        project_service.hydrate_project_metrics(db, p)
    return projects


@router.post("/", response_model=Project)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    return project_service.create_project(db, project_in, current_user)


@router.get("/{project_id}", response_model=Project)
def read_project(
    project_id: UUID,
    db: Session = Depends(get_db),
):
    project = project_service.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=Project)
def update_project(
    project_id: UUID,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    project = project_service.update_project(db, project_id, project_in, current_user)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or not allowed")
    return project_service.get_project(db, project_id)


@router.post("/{project_id}/comment", response_model=ProjectComment)
def comment_project(
    project_id: UUID,
    comment_in: ProjectCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    comment = project_service.add_comment(db, project_id, comment_in.content, current_user)
    if not comment:
        raise HTTPException(status_code=404, detail="Project not found")
    return comment


@router.post("/{project_id}/vote", response_model=Optional[ProjectVote])
def vote_project(
    project_id: UUID,
    vote_in: ProjectVoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    vote = project_service.vote(db, project_id, vote_in.vote_type, current_user)
    return vote


@router.post("/convert-from-post/{post_id}", response_model=Project)
def convert_from_post(
    post_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    project = project_service.convert_from_post(db, post_id, current_user)
    if not project:
        raise HTTPException(status_code=404, detail="Post not found")
    return project_service.get_project(db, project.id)


@router.post("/{project_id}/media", response_model=ProjectMedia)
def upload_project_media(
    project_id: UUID,
    media_type: ProjectMediaType = Form(...),
    file: Optional[UploadFile] = File(None),
    video_url: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
):
    project = project_service.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    is_admin = bool(current_user.role and current_user.role.name in ["SuperAdmin", "Admin"])
    if project.created_by != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Not allowed")

    if media_type == ProjectMediaType.video:
        if not video_url:
            raise HTTPException(status_code=400, detail="video_url is required for video media")
        return project_service.add_media_record(db, project_id, video_url, media_type)

    if not file:
        raise HTTPException(status_code=400, detail="file is required")

    content_type = file.content_type or ""
    if media_type == ProjectMediaType.image:
        if not content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        os.makedirs("static/projects/images", exist_ok=True)
        try:
            img = Image.open(file.file)
            img.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
            filename = f"{uuid.uuid4()}.webp"
            file_path = f"static/projects/images/{filename}"
            img.save(file_path, "WEBP", quality=80)
            url = f"/static/projects/images/{filename}"
            return project_service.add_media_record(db, project_id, url, media_type)
        except Exception:
            raise HTTPException(status_code=500, detail="Image processing failed")

    os.makedirs("static/projects/documents", exist_ok=True)
    filename = f"{uuid.uuid4()}_{file.filename}"
    safe_filename = filename.replace("/", "_").replace("\\", "_")
    file_path = f"static/projects/documents/{safe_filename}"
    try:
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        url = f"/static/projects/documents/{safe_filename}"
        return project_service.add_media_record(db, project_id, url, media_type)
    except Exception:
        raise HTTPException(status_code=500, detail="File upload failed")
