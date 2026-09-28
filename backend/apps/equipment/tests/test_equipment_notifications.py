from rest_framework import status
from rest_framework.test import (
    APITestCase,
)

from apps.accounts.models import User
from apps.equipment.models import (
    Equipment,
    EquipmentCategory,
    EquipmentDeletionRequest,
)
from apps.locations.models import (
    Building,
    Floor,
    Location,
    Site,
)
from apps.notifications.models import (
    Notification,
)
from apps.organizations.models import (
    Organization,
)


class EquipmentNotificationTests(
    APITestCase
):
    def setUp(self):
        self.organization = (
            Organization.objects.create(
                name="Realtime Test",
                slug="realtime-test",
                type=(
                    Organization.Type.COMPANY
                ),
            )
        )

        self.admin = (
            User.objects.create_user(
                email="admin-realtime@fixtrack.ci",
                password="Test12345!",
                first_name="Admin",
                organization=(
                    self.organization
                ),
                role=User.Role.ADMIN,
            )
        )

        self.manager = (
            User.objects.create_user(
                email="manager-realtime@fixtrack.ci",
                password="Test12345!",
                first_name="Manager",
                organization=(
                    self.organization
                ),
                role=User.Role.MANAGER,
            )
        )

        site = Site.objects.create(
            organization=self.organization,
            name="Site",
        )

        building = (
            Building.objects.create(
                site=site,
                name="Bâtiment",
            )
        )

        floor = Floor.objects.create(
            building=building,
            name="RDC",
            level=0,
        )

        location = (
            Location.objects.create(
                floor=floor,
                name="Salle",
            )
        )

        category = (
            EquipmentCategory.objects.create(
                organization=(
                    self.organization
                ),
                name="Informatique",
            )
        )

        self.equipment = (
            Equipment.objects.create(
                organization=(
                    self.organization
                ),
                category=category,
                location=location,
                code="PC-RT-001",
                name="PC Realtime",
            )
        )

    def test_admin_is_notified_when_manager_requests_deletion(
        self,
    ):
        self.client.force_authenticate(
            self.manager
        )

        response = self.client.post(
            (
                "/api/v1/equipment/items/"
                f"{self.equipment.id}/"
                "request-deletion/"
            ),
            {
                "justification": (
                    "Équipement hors service."
                )
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.admin,
                notification_type=(
                    "EQUIPMENT_DELETION_REQUESTED"
                ),
            ).exists()
        )

    def test_manager_is_notified_when_admin_approves(
        self,
    ):
        deletion_request = (
            EquipmentDeletionRequest.objects
            .create(
                organization=(
                    self.organization
                ),
                equipment=(
                    self.equipment
                ),
                requested_by=(
                    self.manager
                ),
                justification=(
                    "Équipement irréparable."
                ),
            )
        )

        self.client.force_authenticate(
            self.admin
        )

        response = self.client.post(
            (
                "/api/v1/equipment/"
                "deletion-requests/"
                f"{deletion_request.id}/"
                "approve/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.manager,
                notification_type=(
                    "EQUIPMENT_DELETION_APPROVED"
                ),
            ).exists()
        )

    def test_manager_is_notified_when_admin_rejects(
        self,
    ):
        deletion_request = (
            EquipmentDeletionRequest.objects
            .create(
                organization=(
                    self.organization
                ),
                equipment=(
                    self.equipment
                ),
                requested_by=(
                    self.manager
                ),
                justification=(
                    "Demande de retrait."
                ),
            )
        )

        self.client.force_authenticate(
            self.admin
        )

        response = self.client.post(
            (
                "/api/v1/equipment/"
                "deletion-requests/"
                f"{deletion_request.id}/"
                "reject/"
            ),
            {
                "review_note": (
                    "Équipement encore utilisable."
                )
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.manager,
                notification_type=(
                    "EQUIPMENT_DELETION_REJECTED"
                ),
            ).exists()
        )
