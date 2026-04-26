import redis.asyncio as redis
from app.core.config import settings


def get_redis():
    return redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
