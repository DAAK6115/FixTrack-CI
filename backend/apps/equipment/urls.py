from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    EquipmentCategoryViewSet,
    EquipmentResolveView,
    EquipmentViewSet,
)


router = DefaultRouter()

router.register(
    "categories",
    EquipmentCategoryViewSet,
    basename="equipment-category",
)

router.register(
    "items",
    EquipmentViewSet,
    basename="equipment",
)


urlpatterns = [
    path(
        "resolve/<uuid:token>/",
        EquipmentResolveView.as_view(),
        name="equipment-resolve",
    ),
    path("", include(router.urls)),
]
