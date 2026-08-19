from django.urls import path

from rest_framework.routers import (
    DefaultRouter,
)

from .views import (
    BuildingViewSet,
    FloorViewSet,
    GeocodingSearchView,
    LocationViewSet,
    ReverseGeocodingView,
    SiteViewSet,
)


router = DefaultRouter()


router.register(
    "sites",
    SiteViewSet,
    basename="site",
)


router.register(
    "buildings",
    BuildingViewSet,
    basename="building",
)


router.register(
    "floors",
    FloorViewSet,
    basename="floor",
)


router.register(
    "rooms",
    LocationViewSet,
    basename="location",
)


urlpatterns = [
    path(
        "geocoding/search/",
        GeocodingSearchView.as_view(),
        name="geocoding-search",
    ),

    path(
        "geocoding/reverse/",
        ReverseGeocodingView.as_view(),
        name="geocoding-reverse",
    ),
]


urlpatterns += router.urls
