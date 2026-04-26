from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import time
import logging
from contextlib import asynccontextmanager
import redis.asyncio as redis
# from fastapi_limiter import FastAPILimiter

from app.core.config import settings
from app.core.redis_client import get_redis
from app.routers import auth, users, roles, regions, interests, admin, forum, forum_extension, projects, gamification, admin_gamification, events, admin_events, cms, admin_cms

# Logging Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.redis = get_redis()
        await app.state.redis.ping()
    except Exception:
        app.state.redis = None
    yield
    try:
        if getattr(app.state, "redis", None) is not None:
            await app.state.redis.close()
    except Exception:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Mount Static Files
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS
if settings.BACKEND_CORS_ORIGINS:
    origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
    # logger.info(f"Configuring CORS with allowed origins: {origins}")
    print(f"DEBUG: Allowed Origins: {origins}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):517\d+$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Middleware for Logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"Method: {request.method} Path: {request.url.path} Status: {response.status_code} Time: {process_time:.4f}s")
    return response

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
app.include_router(roles.router, prefix=f"{settings.API_V1_STR}/roles", tags=["roles"])
app.include_router(regions.router, prefix=f"{settings.API_V1_STR}/regions", tags=["regions"])
app.include_router(interests.router, prefix=f"{settings.API_V1_STR}/interests", tags=["interests"])
app.include_router(forum.router, prefix=f"{settings.API_V1_STR}/forum", tags=["forum"])
app.include_router(forum_extension.router, prefix=f"{settings.API_V1_STR}", tags=["forum-extension"])
app.include_router(projects.router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
app.include_router(events.router, prefix=f"{settings.API_V1_STR}/events", tags=["events"])
app.include_router(cms.router, prefix=f"{settings.API_V1_STR}/cms", tags=["cms"])
app.include_router(gamification.router, prefix=f"{settings.API_V1_STR}", tags=["gamification"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(admin_gamification.router, prefix=f"{settings.API_V1_STR}/admin/gamification", tags=["admin-gamification"])
app.include_router(admin_events.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin-events"])
app.include_router(admin_cms.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin-cms"])

@app.get("/")
def read_root():
    return {"message": "Welcome to GRIN17 API"}
