from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    permission_classes = [
        AllowAny
    ]

    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": (
                    "FixTrack CI API"
                ),
            }
        )


urlpatterns = [
    path(
        "admin/",
        admin.site.urls,
    ),

    path(
        "api/v1/health/",
        HealthView.as_view(),
        name="health",
    ),

    path(
        "api/v1/auth/",
        include(
            "apps.accounts.urls"
        ),
    ),

    path(
        "api/v1/users/",
        include(
            "apps.accounts.user_urls"
        ),
    ),

    path(
        "api/v1/organizations/",
        include(
            "apps.organizations.urls"
        ),
    ),

    path(
        "api/v1/locations/",
        include(
            "apps.locations.urls"
        ),
    ),

    path(
        "api/v1/incidents/",
        include(
            "apps.incidents.urls"
        ),
    ),

    path(
        "api/v1/notifications/",
        include(
            "apps.notifications.urls"
        ),
    ),

    path(
        "api/v1/analytics/",
        include(
            "apps.analytics.urls"
        ),
    ),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=(
            settings.MEDIA_ROOT
        ),
    )
