from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    TechnicianListView,
    UserManagementViewSet,
)

router = DefaultRouter()

router.register(
    "",
    UserManagementViewSet,
    basename="user",
)

urlpatterns = [
    path(
        "technicians/",
        TechnicianListView.as_view(),
        name="technician-list",
    ),

    path(
        "",
        include(router.urls),
    ),
]