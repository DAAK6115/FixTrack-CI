from rest_framework import serializers

from .models import Notification


class NotificationSerializer(
    serializers.ModelSerializer
):
    incident_reference = (
        serializers.CharField(
            source="incident.reference",
            read_only=True,
        )
    )

    incident_title = (
        serializers.CharField(
            source="incident.title",
            read_only=True,
        )
    )

    type_label = (
        serializers.CharField(
            source=(
                "get_notification_type_display"
            ),
            read_only=True,
        )
    )

    class Meta:
        model = Notification

        fields = [
            "id",
            "notification_type",
            "type_label",
            "title",
            "message",
            "is_read",
            "read_at",
            "created_at",
            "incident",
            "incident_reference",
            "incident_title",
        ]

        read_only_fields = fields
