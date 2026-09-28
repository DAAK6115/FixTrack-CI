from rest_framework import serializers

from .models import Organization


class OrganizationSerializer(
    serializers.ModelSerializer
):
    logo_url = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = Organization

        fields = [
            "id",
            "name",
            "slug",
            "type",

            "logo",
            "logo_url",

            "email",
            "phone",
            "address",

            "is_active",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "slug",
            "logo_url",
            "is_active",
            "created_at",
            "updated_at",
        ]

        extra_kwargs = {
            "logo": {
                "required": False,
                "allow_null": True,
            },
        }

    def get_logo_url(
        self,
        obj,
    ):
        if not obj.logo:
            return None

        request = self.context.get(
            "request"
        )

        if request:
            return request.build_absolute_uri(
                obj.logo.url
            )

        return obj.logo.url

    def validate_logo(
        self,
        logo,
    ):
        if not logo:
            return logo

        max_size = (
            5
            * 1024
            * 1024
        )

        if logo.size > max_size:
            raise serializers.ValidationError(
                "Le logo ne doit pas dépasser 5 Mo."
            )

        content_type = getattr(
            logo,
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
                "Le logo doit être une image."
            )

        return logo

    def update(
        self,
        instance,
        validated_data,
    ):
        old_logo_name = (
            instance.logo.name
            if instance.logo
            else ""
        )

        old_storage = (
            instance.logo.storage
            if instance.logo
            else None
        )

        logo_is_replaced = (
            "logo"
            in validated_data
        )

        updated = super().update(
            instance,
            validated_data,
        )

        if (
            logo_is_replaced
            and old_logo_name
            and old_storage
            and (
                not updated.logo
                or updated.logo.name
                != old_logo_name
            )
        ):
            old_storage.delete(
                old_logo_name
            )

        return updated
