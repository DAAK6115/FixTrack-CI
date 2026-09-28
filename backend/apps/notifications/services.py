from asgiref.sync import async_to_sync

from channels.layers import (
    get_channel_layer,
)

from django.db import transaction

from apps.accounts.models import User

from .models import Notification
from .serializers import (
    NotificationSerializer,
)


def notification_group_name(
    user_id,
):
    return (
        f"notifications_user_{user_id}"
    )


def _push_notification(
    notification_id,
):
    notification = (
        Notification.objects
        .select_related(
            "incident",
            "recipient",
        )
        .get(
            pk=notification_id
        )
    )

    channel_layer = (
        get_channel_layer()
    )

    if channel_layer is None:
        return

    payload = (
        NotificationSerializer(
            notification
        ).data
    )

    async_to_sync(
        channel_layer.group_send
    )(
        notification_group_name(
            notification.recipient_id
        ),
        {
            "type": (
                "notification.event"
            ),
            "notification": payload,
        },
    )


def create_notification(
    *,
    recipient,
    notification_type,
    title,
    message,
    incident=None,
):
    if (
        not recipient
        or not recipient.is_active
        or not recipient.organization_id
    ):
        return None

    notification = (
        Notification.objects.create(
            organization=(
                recipient.organization
            ),
            recipient=recipient,
            incident=incident,
            notification_type=(
                notification_type
            ),
            title=title,
            message=message,
        )
    )

    transaction.on_commit(
        lambda: _push_notification(
            notification.id
        )
    )

    return notification


def notify_roles(
    *,
    organization,
    roles,
    notification_type,
    title,
    message,
    incident=None,
    exclude_user_id=None,
):
    recipients = (
        User.objects
        .filter(
            organization=organization,
            role__in=roles,
            is_active=True,
        )
    )

    if exclude_user_id:
        recipients = (
            recipients.exclude(
                pk=exclude_user_id
            )
        )

    notifications = []

    for recipient in recipients:
        created = (
            create_notification(
                recipient=recipient,
                notification_type=(
                    notification_type
                ),
                title=title,
                message=message,
                incident=incident,
            )
        )

        if created:
            notifications.append(
                created
            )

    return notifications
