import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import (
    HasOrganization,
    IsOrganizationAdminOrManager,
)

from .models import Building, Floor, Location, Site
from .serializers import (
    BuildingSerializer,
    FloorSerializer,
    LocationSerializer,
    SiteSerializer,
)


PHOTON_BASE_URL = "https://photon.komoot.io"


def build_photon_address(properties):
    """
    Transforme les propriétés Photon en une adresse
    facilement lisible dans FixTrack CI.
    """

    name = properties.get("name")
    house_number = properties.get("housenumber")
    street = properties.get("street")
    district = properties.get("district")
    city = properties.get("city")
    county = properties.get("county")
    state = properties.get("state")
    postcode = properties.get("postcode")
    country = properties.get("country")

    parts = []

    if name:
        parts.append(name)

    street_part = " ".join(
        str(value)
        for value in [house_number, street]
        if value
    ).strip()

    if street_part and street_part not in parts:
        parts.append(street_part)

    for value in [
        district,
        city,
        county,
        state,
        postcode,
        country,
    ]:
        if value and value not in parts:
            parts.append(str(value))

    return ", ".join(parts)


def photon_request(endpoint, params):
    url = (
        f"{PHOTON_BASE_URL}/{endpoint}?"
        f"{urlencode(params, doseq=True)}"
    )

    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "FixTrack-CI/1.0",
        },
    )

    try:
        with urlopen(
            request,
            timeout=8,
        ) as response:
            return json.loads(
                response.read().decode("utf-8")
            )

    except HTTPError as exc:
        raise RuntimeError(
            f"Photon HTTP error: {exc.code}"
        ) from exc

    except URLError as exc:
        raise RuntimeError(
            "Photon est temporairement indisponible."
        ) from exc

    except TimeoutError as exc:
        raise RuntimeError(
            "Photon n'a pas répondu à temps."
        ) from exc


class GeocodingSearchView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasOrganization,
    ]

    def get(self, request):
        query = request.query_params.get(
            "q",
            "",
        ).strip()

        if len(query) < 2:
            return Response([])

        params = {
            "q": query,
            "limit": 6,
            "lang": "fr",

            # FixTrack CI est actuellement
            # destiné à la Côte d'Ivoire.
            "countrycode": "CI",
        }

        try:
            data = photon_request(
                "api",
                params,
            )

        except RuntimeError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        results = []

        for feature in data.get(
            "features",
            [],
        ):
            geometry = feature.get(
                "geometry",
                {},
            )

            coordinates = geometry.get(
                "coordinates",
                [],
            )

            if len(coordinates) < 2:
                continue

            longitude = coordinates[0]
            latitude = coordinates[1]

            properties = feature.get(
                "properties",
                {},
            )

            results.append(
                {
                    "name": (
                        properties.get("name")
                        or "Lieu sans nom"
                    ),

                    "address": build_photon_address(
                        properties
                    ),

                    "latitude": latitude,
                    "longitude": longitude,

                    "city": (
                        properties.get("city")
                        or properties.get("district")
                        or ""
                    ),

                    "country": properties.get(
                        "country",
                        "",
                    ),

                    "type": (
                        properties.get("osm_value")
                        or properties.get("type")
                        or ""
                    ),
                }
            )

        return Response(results)


class ReverseGeocodingView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasOrganization,
    ]

    def get(self, request):
        latitude = request.query_params.get(
            "lat"
        )

        longitude = request.query_params.get(
            "lon"
        )

        if (
            latitude is None
            or longitude is None
        ):
            return Response(
                {
                    "detail": (
                        "Les paramètres lat et lon "
                        "sont obligatoires."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            latitude = float(latitude)
            longitude = float(longitude)

        except ValueError:
            return Response(
                {
                    "detail": (
                        "Latitude ou longitude invalide."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            data = photon_request(
                "reverse",
                {
                    "lat": latitude,
                    "lon": longitude,
                    "limit": 1,
                    "lang": "fr",
                },
            )

        except RuntimeError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        features = data.get(
            "features",
            [],
        )

        if not features:
            return Response(
                {
                    "address": "",
                    "latitude": latitude,
                    "longitude": longitude,
                }
            )

        feature = features[0]

        properties = feature.get(
            "properties",
            {},
        )

        return Response(
            {
                "address": build_photon_address(
                    properties
                ),

                "latitude": latitude,
                "longitude": longitude,
            }
        )


class OrganizationScopedViewSet(
    viewsets.ModelViewSet
):
    def get_permissions(self):
        permission_classes = [
            IsAuthenticated,
            HasOrganization,
        ]

        if self.request.method not in {
            "GET",
            "HEAD",
            "OPTIONS",
        }:
            permission_classes.append(
                IsOrganizationAdminOrManager
            )

        return [
            permission()
            for permission
            in permission_classes
        ]

    def destroy(
        self,
        request,
        *args,
        **kwargs,
    ):
        instance = self.get_object()

        if hasattr(
            instance,
            "is_active",
        ):
            instance.is_active = False

            instance.save(
                update_fields=[
                    "is_active"
                ]
            )

            return Response(
                status=(
                    status.HTTP_204_NO_CONTENT
                )
            )

        return super().destroy(
            request,
            *args,
            **kwargs,
        )


class SiteViewSet(
    OrganizationScopedViewSet
):
    serializer_class = SiteSerializer

    def get_queryset(self):
        queryset = Site.objects.filter(
            organization=(
                self.request.user.organization
            ),
            is_active=True,
        )

        search = (
            self.request.query_params.get(
                "search"
            )
        )

        if search:
            queryset = queryset.filter(
                name__icontains=search
            )

        return queryset

    def perform_create(
        self,
        serializer,
    ):
        serializer.save(
            organization=(
                self.request.user.organization
            )
        )


class BuildingViewSet(
    OrganizationScopedViewSet
):
    serializer_class = (
        BuildingSerializer
    )

    def get_queryset(self):
        queryset = (
            Building.objects
            .select_related("site")
            .filter(
                site__organization=(
                    self.request.user.organization
                ),
                site__is_active=True,
                is_active=True,
            )
        )

        site_id = (
            self.request.query_params.get(
                "site"
            )
        )

        search = (
            self.request.query_params.get(
                "search"
            )
        )

        if site_id:
            queryset = queryset.filter(
                site_id=site_id
            )

        if search:
            queryset = queryset.filter(
                name__icontains=search
            )

        return queryset


class FloorViewSet(
    OrganizationScopedViewSet
):
    serializer_class = FloorSerializer

    def get_queryset(self):
        queryset = (
            Floor.objects
            .select_related(
                "building",
                "building__site",
            )
            .filter(
                building__site__organization=(
                    self.request.user.organization
                ),
                building__site__is_active=True,
                building__is_active=True,
                is_active=True,
            )
        )

        building_id = (
            self.request.query_params.get(
                "building"
            )
        )

        site_id = (
            self.request.query_params.get(
                "site"
            )
        )

        if building_id:
            queryset = queryset.filter(
                building_id=building_id
            )

        if site_id:
            queryset = queryset.filter(
                building__site_id=site_id
            )

        return queryset


class LocationViewSet(
    OrganizationScopedViewSet
):
    serializer_class = (
        LocationSerializer
    )

    def get_queryset(self):
        queryset = (
            Location.objects
            .select_related(
                "floor",
                "floor__building",
                "floor__building__site",
            )
            .filter(
                floor__building__site__organization=(
                    self.request.user.organization
                ),
                floor__building__site__is_active=True,
                floor__building__is_active=True,
                floor__is_active=True,
                is_active=True,
            )
        )

        floor_id = (
            self.request.query_params.get(
                "floor"
            )
        )

        building_id = (
            self.request.query_params.get(
                "building"
            )
        )

        site_id = (
            self.request.query_params.get(
                "site"
            )
        )

        search = (
            self.request.query_params.get(
                "search"
            )
        )

        if floor_id:
            queryset = queryset.filter(
                floor_id=floor_id
            )

        if building_id:
            queryset = queryset.filter(
                floor__building_id=(
                    building_id
                )
            )

        if site_id:
            queryset = queryset.filter(
                floor__building__site_id=(
                    site_id
                )
            )

        if search:
            queryset = queryset.filter(
                name__icontains=search
            )

        return queryset
