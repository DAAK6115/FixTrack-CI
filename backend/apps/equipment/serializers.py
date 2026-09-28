from rest_framework import serializers

from .models import Equipment, EquipmentCategory


class EquipmentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentCategory
        fields = [
            "id",
            "name",
            "icon",
            "description",
            "is_active",
        ]
        read_only_fields = ["id"]


class EquipmentSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )
    category_icon = serializers.CharField(
        source="category.icon",
        read_only=True,
    )
    status_label = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    location_name = serializers.CharField(
        source="location.name",
        read_only=True,
    )
    floor_name = serializers.CharField(
        source="location.floor.name",
        read_only=True,
    )
    building_name = serializers.CharField(
        source="location.floor.building.name",
        read_only=True,
    )
    site_name = serializers.CharField(
        source="location.floor.building.site.name",
        read_only=True,
    )
    site_address = serializers.CharField(
        source="location.floor.building.site.address",
        read_only=True,
    )

    class Meta:
        model = Equipment
        fields = [
            "id",
            "code",
            "name",
            "category",
            "category_name",
            "category_icon",
            "location",
            "location_name",
            "floor_name",
            "building_name",
            "site_name",
            "site_address",
            "brand",
            "model_name",
            "serial_number",
            "installation_date",
            "status",
            "status_label",
            "description",
            "notes",
            "qr_token",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "qr_token",
            "created_at",
            "updated_at",
        ]

    def validate_category(self, category):
        request = self.context["request"]

        if category.organization_id != request.user.organization_id:
            raise serializers.ValidationError(
                "Cette catégorie n'appartient pas à votre organisation."
            )

        if not category.is_active:
            raise serializers.ValidationError(
                "Cette catégorie est désactivée."
            )

        return category

    def validate_location(self, location):
        request = self.context["request"]
        organization_id = (
            location.floor.building.site.organization_id
        )

        if organization_id != request.user.organization_id:
            raise serializers.ValidationError(
                "Ce lieu n'appartient pas à votre organisation."
            )

        return location

    def validate_code(self, value):
        request = self.context["request"]
        cleaned = value.strip()

        queryset = Equipment.objects.filter(
            organization=request.user.organization,
            code__iexact=cleaned,
        )

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Ce code équipement existe déjà."
            )

        return cleaned
