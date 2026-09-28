from rest_framework import serializers

from .models import (
    Equipment,
    EquipmentAuditLog,
    EquipmentCategory,
    EquipmentDeletionRequest,
)


class EquipmentCategorySerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = EquipmentCategory

        fields = [
            "id",
            "name",
            "icon",
            "description",
            "is_active",
        ]

        read_only_fields = [
            "id",
        ]


class EquipmentSerializer(
    serializers.ModelSerializer
):
    category_name = (
        serializers.CharField(
            source="category.name",
            read_only=True,
        )
    )

    category_icon = (
        serializers.CharField(
            source="category.icon",
            read_only=True,
        )
    )

    status_label = (
        serializers.CharField(
            source="get_status_display",
            read_only=True,
        )
    )

    location_name = (
        serializers.CharField(
            source="location.name",
            read_only=True,
        )
    )

    floor_name = (
        serializers.CharField(
            source="location.floor.name",
            read_only=True,
        )
    )

    building_name = (
        serializers.CharField(
            source="location.floor.building.name",
            read_only=True,
        )
    )

    site_name = (
        serializers.CharField(
            source="location.floor.building.site.name",
            read_only=True,
        )
    )

    site_address = (
        serializers.CharField(
            source="location.floor.building.site.address",
            read_only=True,
        )
    )

    image_url = (
        serializers.SerializerMethodField()
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

            "image",
            "image_url",

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
            "image_url",
            "is_active",
            "created_at",
            "updated_at",
        ]

    def get_image_url(
        self,
        obj,
    ):
        if not obj.image:
            return None

        request = self.context.get(
            "request"
        )

        if request:
            return (
                request.build_absolute_uri(
                    obj.image.url
                )
            )

        return obj.image.url

    def validate_image(
        self,
        image,
    ):
        if not image:
            return image

        max_size = (
            5
            * 1024
            * 1024
        )

        if image.size > max_size:
            raise serializers.ValidationError(
                "La photo ne doit pas dépasser 5 Mo."
            )

        content_type = getattr(
            image,
            "content_type",
            "",
        )

        if (
            content_type
            and not content_type.startswith(
                "image/"
            )
        ):
            raise serializers.ValidationError(
                "Le fichier doit être une image."
            )

        return image

    def validate_category(
        self,
        category,
    ):
        request = self.context[
            "request"
        ]

        if (
            category.organization_id
            != request.user.organization_id
        ):
            raise serializers.ValidationError(
                "Cette catégorie n'appartient pas à votre organisation."
            )

        if not category.is_active:
            raise serializers.ValidationError(
                "Cette catégorie est désactivée."
            )

        return category

    def validate_location(
        self,
        location,
    ):
        request = self.context[
            "request"
        ]

        organization_id = (
            location
            .floor
            .building
            .site
            .organization_id
        )

        if (
            organization_id
            != request.user.organization_id
        ):
            raise serializers.ValidationError(
                "Ce lieu n'appartient pas à votre organisation."
            )

        return location

    def validate_code(
        self,
        value,
    ):
        request = self.context[
            "request"
        ]

        cleaned = value.strip()

        queryset = (
            Equipment.objects
            .filter(
                organization=(
                    request.user.organization
                ),
                code__iexact=cleaned,
            )
        )

        if self.instance:
            queryset = (
                queryset.exclude(
                    pk=self.instance.pk
                )
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Ce code équipement existe déjà."
            )

        return cleaned


class EquipmentAuditLogSerializer(
    serializers.ModelSerializer
):
    performed_by_name = (
        serializers.CharField(
            source="performed_by.full_name",
            read_only=True,
        )
    )

    performed_by_email = (
        serializers.CharField(
            source="performed_by.email",
            read_only=True,
        )
    )

    action_label = (
        serializers.CharField(
            source="get_action_display",
            read_only=True,
        )
    )

    class Meta:
        model = EquipmentAuditLog

        fields = [
            "id",
            "action",
            "action_label",
            "justification",

            "performed_by",
            "performed_by_name",
            "performed_by_email",

            "before_data",
            "after_data",

            "created_at",
        ]

        read_only_fields = fields



class EquipmentDeletionRequestSerializer(
    serializers.ModelSerializer
):
    equipment_code = (
        serializers.CharField(
            source="equipment.code",
            read_only=True,
        )
    )

    equipment_name = (
        serializers.CharField(
            source="equipment.name",
            read_only=True,
        )
    )

    equipment_image_url = (
        serializers.SerializerMethodField()
    )

    requested_by_name = (
        serializers.CharField(
            source="requested_by.full_name",
            read_only=True,
        )
    )

    requested_by_email = (
        serializers.CharField(
            source="requested_by.email",
            read_only=True,
        )
    )

    reviewed_by_name = (
        serializers.CharField(
            source="reviewed_by.full_name",
            read_only=True,
        )
    )

    reviewed_by_email = (
        serializers.CharField(
            source="reviewed_by.email",
            read_only=True,
        )
    )

    status_label = (
        serializers.CharField(
            source="get_status_display",
            read_only=True,
        )
    )

    class Meta:
        model = (
            EquipmentDeletionRequest
        )

        fields = [
            "id",

            "equipment",
            "equipment_code",
            "equipment_name",
            "equipment_image_url",

            "requested_by",
            "requested_by_name",
            "requested_by_email",

            "justification",

            "status",
            "status_label",

            "reviewed_by",
            "reviewed_by_name",
            "reviewed_by_email",

            "review_note",

            "requested_at",
            "reviewed_at",
        ]

        read_only_fields = fields

    def get_equipment_image_url(
        self,
        obj,
    ):
        if not obj.equipment.image:
            return None

        request = self.context.get(
            "request"
        )

        if request:
            return request.build_absolute_uri(
                obj.equipment.image.url
            )

        return obj.equipment.image.url
