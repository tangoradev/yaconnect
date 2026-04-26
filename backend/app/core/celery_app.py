from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "grin17",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.projects", "app.tasks.gamification"],
)

celery_app.conf.task_routes = {
    "app.tasks.projects.update_trending_projects": {"queue": "projects"},
    "app.tasks.projects.weekly_project_promotion": {"queue": "projects"},
    "app.tasks.projects.detect_high_potential_forum_posts": {"queue": "projects"},
    "app.tasks.gamification.daily_update_leaderboards": {"queue": "gamification"},
    "app.tasks.gamification.weekly_select_ambassadors": {"queue": "gamification"},
    "app.tasks.gamification.weekly_reset_strict": {"queue": "gamification"},
}

celery_app.conf.beat_schedule = {
    "projects-daily-trending": {
        "task": "app.tasks.projects.update_trending_projects",
        "schedule": 60 * 60 * 24,
    },
    "projects-daily-detect-forum-ideas": {
        "task": "app.tasks.projects.detect_high_potential_forum_posts",
        "schedule": 60 * 60 * 24,
    },
    "projects-weekly-promotion": {
        "task": "app.tasks.projects.weekly_project_promotion",
        "schedule": 60 * 60 * 24 * 7,
    },
    "gamification-daily-leaderboards": {
        "task": "app.tasks.gamification.daily_update_leaderboards",
        "schedule": 60 * 60 * 24,
    },
    "gamification-weekly-ambassadors": {
        "task": "app.tasks.gamification.weekly_select_ambassadors",
        "schedule": 60 * 60 * 24 * 7,
    },
    "gamification-weekly-reset-strict": {
        "task": "app.tasks.gamification.weekly_reset_strict",
        "schedule": 60 * 60 * 24 * 7,
    },
}
