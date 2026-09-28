from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    EquipmentArchivesView,
    EquipmentCategoryViewSet,
    EquipmentDeletionRequestViewSet,
    EquipmentPrintContextView,
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


router.register(
    "deletion-requests",
    EquipmentDeletionRequestViewSet,
    basename="equipment-deletion-request",
)


urlpatterns = [
    path(
        "archives/",
        EquipmentArchivesView.as_view(),
        name="equipment-archives",
    ),

    path(
        "print-context/",
        EquipmentPrintContextView.as_view(),
        name="equipment-print-context",
    ),

    path(
        "resolve/<uuid:token>/",
        EquipmentResolveView.as_view(),
        name="equipment-resolve",
    ),
    path("", include(router.urls)),
]
