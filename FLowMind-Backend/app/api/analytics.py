from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.analytics import AnalyticsService

router = APIRouter(prefix="/v1/analytics")


def get_analytics_service(db: AsyncSession = Depends(get_db)) -> AnalyticsService:
    return AnalyticsService(db)


@router.get("/user")
async def user_analytics(
    request: Request,
    service: AnalyticsService = Depends(get_analytics_service),
):
    user_id = request.state.user_id
    total_usage = await service.get_user_total_usage(user_id)
    daily_usage = await service.get_user_daily_usage(user_id)
    return {
        "total_usage": total_usage,
        "daily_usage": daily_usage,
    }


@router.get("/admin")
async def admin_analytics(
    request: Request,
    service: AnalyticsService = Depends(get_analytics_service),
):
    user_id = request.state.user_id
    settings = getattr(request.app.state, "settings", None)
    admin_ids = settings.admin_user_ids_list if settings else []
    if user_id not in admin_ids:
        raise HTTPException(status_code=403, detail="Admin access required")

    platform_usage = await service.get_platform_usage()
    usage_per_user = await service.get_usage_per_user()
    cost_per_user = await service.get_cost_per_user()
    feature_breakdown = await service.get_feature_breakdown()
    cache_breakdown = await service.get_cache_breakdown()
    peak_usage_hours = await service.get_peak_usage_hours()

    return {
        "platform_usage": platform_usage,
        "usage_per_user": usage_per_user,
        "cost_per_user": cost_per_user,
        "feature_breakdown": feature_breakdown,
        "cache_breakdown": cache_breakdown,
        "peak_usage_hours": peak_usage_hours,
    }
