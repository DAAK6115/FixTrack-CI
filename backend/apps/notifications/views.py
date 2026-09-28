from django.utils import timezone

from rest_framework import (
    status,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response

from .models import Notification
from .serializers import (
    NotificationSerializer,
)


class NotificationViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = (
        NotificationSerializer
    )

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(self):
        queryset = (
            Notification.objects
            .select_related(
                "incident",
                "recipient",
            )
            .filter(
                recipient=self.request.user,
                organization=(
                    self.request.user.organization
                ),
            )
        )

        is_read = (
            self.request
            .query_params
            .get("is_read")
        )

        if is_read == "true":
            queryset = queryset.filter(
                is_read=True
            )

        elif is_read == "false":
            queryset = queryset.filter(
                is_read=False
            )

        return queryset

    @action(
        detail=False,
        methods=["get"],
        url_path="unread-count",
    )
    def unread_count(
        self,
        request,
    ):
        count = (
            self.get_queryset()
            .filter(
                is_read=False
            )
            .count()
        )

        return Response(
            {
                "count": count
            }
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="mark-read",
    )
    def mark_read(
        self,
        request,
        pk=None,
    ):
        notification = (
            self.get_object()
        )

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = (
                timezone.now()
            )

            notification.save(
                update_fields=[
                    "is_read",
                    "read_at",
                ]
            )

        return Response(
            NotificationSerializer(
                notification
            ).data
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="mark-all-read",
    )
    def mark_all_read(
        self,
        request,
    ):
        now = timezone.now()

        updated = (
            self.get_queryset()
            .filter(
                is_read=False
            )
            .update(
                is_read=True,
                read_at=now,
            )
        )

        return Response(
            {
                "updated": updated
            },
            status=(
                status.HTTP_200_OK
            ),
        )
