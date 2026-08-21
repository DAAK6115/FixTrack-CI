from rest_framework.routers import (
    DefaultRouter,
)

from .views import (
    IncidentCategoryViewSet,
    IncidentViewSet,
)


router = DefaultRouter()


router.register(
    "categories",
    IncidentCategoryViewSet,
    basename="incident-category",
)


router.register(
    "",
    IncidentViewSet,
    basename="incident",
)


urlpatterns = router.urls