from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.equipment.models import (
    Equipment,
    EquipmentDeletionRequest,
    EquipmentCategory,
)
from apps.locations.models import (
    Building,
    Floor,
    Location,
    Site,
)
from apps.organizations.models import Organization


class EquipmentDeletionWorkflowTests(
    APITestCase
):
    def setUp(self):
        self.organization = (
            Organization.objects.create(
                name="Delete Workflow",
                slug="delete-workflow",
                type=(
                    Organization.Type.COMPANY
                ),
            )
        )

        self.admin = (
            User.objects.create_user(
                email="admin-delete@fixtrack.ci",
                password="Test12345!",
                first_name="Admin",
                organization=self.organization,
                role=User.Role.ADMIN,
            )
        )

        self.manager = (
            User.objects.create_user(
                email="manager-delete@fixtrack.ci",
                password="Test12345!",
                first_name="Manager",
                organization=self.organization,
                role=User.Role.MANAGER,
            )
        )

        site = Site.objects.create(
            organization=self.organization,
            name="Site",
        )

        building = Building.objects.create(
            site=site,
            name="Bâtiment",
        )

        floor = Floor.objects.create(
            building=building,
            name="RDC",
            level=0,
        )

        location = Location.objects.create(
            floor=floor,
            name="Salle",
        )

        category = EquipmentCategory.objects.create(
            organization=self.organization,
            name="Informatique",
        )

        self.equipment = Equipment.objects.create(
            organization=self.organization,
            category=category,
            location=location,
            code="PC-001",
            name="PC Test",
        )

    def test_manager_request_does_not_delete_equipment(
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
                    "Équipement remplacé par un nouveau."
                )
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.equipment.refresh_from_db()

        self.assertTrue(
            self.equipment.is_active
        )

        self.assertTrue(
            EquipmentDeletionRequest.objects
            .filter(
                equipment=self.equipment,
                status=(
                    EquipmentDeletionRequest
                    .Status
                    .PENDING
                ),
            )
            .exists()
        )

    def test_manager_cannot_approve_deletion(
        self,
    ):
        deletion_request = (
            EquipmentDeletionRequest.objects
            .create(
                organization=self.organization,
                equipment=self.equipment,
                requested_by=self.manager,
                justification="Remplacement validé.",
            )
        )

        self.client.force_authenticate(
            self.manager
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
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_approval_soft_deletes_equipment(
        self,
    ):
        deletion_request = (
            EquipmentDeletionRequest.objects
            .create(
                organization=self.organization,
                equipment=self.equipment,
                requested_by=self.manager,
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
            {
                "review_note": (
                    "Suppression validée après contrôle."
                )
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.equipment.refresh_from_db()
        deletion_request.refresh_from_db()

        self.assertFalse(
            self.equipment.is_active
        )

        self.assertEqual(
            deletion_request.status,
            EquipmentDeletionRequest
            .Status
            .APPROVED,
        )

        self.assertEqual(
            deletion_request.reviewed_by,
            self.admin,
        )

    def test_admin_can_reject_deletion(
        self,
    ):
        deletion_request = (
            EquipmentDeletionRequest.objects
            .create(
                organization=self.organization,
                equipment=self.equipment,
                requested_by=self.manager,
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

        self.equipment.refresh_from_db()

        self.assertTrue(
            self.equipment.is_active
        )
