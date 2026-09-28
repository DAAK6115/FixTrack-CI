from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.notifications.models import Notification
from apps.notifications.services import (
    create_notification,
)
from apps.organizations.models import Organization


class NotificationApiTests(
    APITestCase
):
    def setUp(self):
        self.organization = (
            Organization.objects.create(
                name="Notification Test",
                slug="notification-test",
                type=(
                    Organization.Type.COMPANY
                ),
            )
        )

        self.user = (
            User.objects.create_user(
                email="notification@fixtrack.ci",
                password="Test12345!",
                first_name="Jean",
                organization=(
                    self.organization
                ),
                role=User.Role.MANAGER,
            )
        )

        create_notification(
            recipient=self.user,
            notification_type=(
                Notification.Type.INCIDENT_REPORTED
            ),
            title="Nouvel incident",
            message="Un incident a été signalé.",
        )

    def test_user_can_list_notifications(
        self,
    ):
        self.client.force_authenticate(
            self.user
        )

        response = self.client.get(
            "/api/v1/notifications/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

    def test_unread_count(
        self,
    ):
        self.client.force_authenticate(
            self.user
        )

        response = self.client.get(
            (
                "/api/v1/notifications/"
                "unread-count/"
            )
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

    def test_mark_all_read(
        self,
    ):
        self.client.force_authenticate(
            self.user
        )

        response = self.client.post(
            (
                "/api/v1/notifications/"
                "mark-all-read/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(
            Notification.objects.filter(
                recipient=self.user,
                is_read=False,
            ).exists()
        )
