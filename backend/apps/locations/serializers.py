from rest_framework import serializers

from .models import Building, Floor, Location, Site


class OrganizationScopedSerializerMixin:
    def get_organization(self):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return None

        return request.user.organization


class SiteSerializer(
    OrganizationScopedSerializerMixin,
    serializers.ModelSerializer,
):
    organization_name = serializers.CharField(
        source="organization.name",
        read_only=True,
    )

    class Meta:
        model = Site
        fields = [
            "id",
            "organization_name",
            "name",
            "address",
            "latitude",
            "longitude",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "organization_name",
            "created_at",
            "updated_at",
        ]


class BuildingSerializer(
    OrganizationScopedSerializerMixin,
    serializers.ModelSerializer,
):
    site_name = serializers.CharField(
        source="site.name",
        read_only=True,
    )

    class Meta:
        model = Building
        fields = [
            "id",
            "site",
            "site_name",
            "name",
            "code",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "site_name",
            "created_at",
            "updated_at",
        ]

    def validate_site(self, site):
        organization = self.get_organization()

        if site.organization_id != organization.id:
            raise serializers.ValidationError(
                "Ce site n'appartient pas à votre organisation."
            )

        if not site.is_active:
            raise serializers.ValidationError(
                "Ce site est désactivé."
            )

        return site


class FloorSerializer(
    OrganizationScopedSerializerMixin,
    serializers.ModelSerializer,
):
    building_name = serializers.CharField(
        source="building.name",
        read_only=True,
    )

    site_id = serializers.IntegerField(
        source="building.site_id",
        read_only=True,
    )

    site_name = serializers.CharField(
        source="building.site.name",
        read_only=True,
    )

    class Meta:
        model = Floor
        fields = [
            "id",
            "building",
            "building_name",
            "site_id",
            "site_name",
            "name",
            "level",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "building_name",
            "site_id",
            "site_name",
            "created_at",
            "updated_at",
        ]

    def validate_building(self, building):
        organization = self.get_organization()

        if building.site.organization_id != organization.id:
            raise serializers.ValidationError(
                "Ce bâtiment n'appartient pas à votre organisation."
            )

        if not building.is_active:
            raise serializers.ValidationError(
                "Ce bâtiment est désactivé."
            )

        if not building.site.is_active:
            raise serializers.ValidationError(
                "Le site associé est désactivé."
            )

        return building


class LocationSerializer(
    OrganizationScopedSerializerMixin,
    serializers.ModelSerializer,
):
    floor_name = serializers.CharField(
        source="floor.name",
        read_only=True,
    )

    building_id = serializers.IntegerField(
        source="floor.building_id",
        read_only=True,
    )

    building_name = serializers.CharField(
        source="floor.building.name",
        read_only=True,
    )

    site_id = serializers.IntegerField(
        source="floor.building.site_id",
        read_only=True,
    )

    site_name = serializers.CharField(
        source="floor.building.site.name",
        read_only=True,
    )

    class Meta:
        model = Location
        fields = [
            "id",
            "floor",
            "floor_name",
            "building_id",
            "building_name",
            "site_id",
            "site_name",
            "name",
            "code",
            "description",
            "latitude",
            "longitude",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "floor_name",
            "building_id",
            "building_name",
            "site_id",
            "site_name",
            "created_at",
            "updated_at",
        ]

    def validate_floor(self, floor):
        organization = self.get_organization()

        if (
            floor.building.site.organization_id
            != organization.id
        ):
            raise serializers.ValidationError(
                "Cet étage n'appartient pas à votre organisation."
            )

        if not floor.is_active:
            raise serializers.ValidationError(
                "Cet étage est désactivé."
            )

        if not floor.building.is_active:
            raise serializers.ValidationError(
                "Le bâtiment associé est désactivé."
            )

        if not floor.building.site.is_active:
            raise serializers.ValidationError(
                "Le site associé est désactivé."
            )

        return floor