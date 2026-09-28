from django.core.files.uploadedfile import (
    SimpleUploadedFile,
)

from rest_framework import status
from rest_framework.test import (
    APITestCase,
)

from apps.accounts.models import User
from apps.equipment.models import (
    Equipment,
    EquipmentAuditLog,
    EquipmentCategory,
)
from apps.locations.models import (
    Building,
    Floor,
    Location,
    Site,
)
from apps.organizations.models import (
    Organization,
)


class EquipmentAuditTests(
    APITestCase
):
    def setUp(self):
        self.organization = (
            Organization.objects.create(
                name="Equipment Audit",
                slug="equipment-audit",
                type=(
                    Organization.Type.COMPANY
                ),
            )
        )

        self.manager = (
            User.objects.create_user(
                email=(
                    "manager-audit@fixtrack.ci"
                ),
                password="Test12345!",
                first_name="Manager",
                organization=(
                    self.organization
                ),
                role=User.Role.MANAGER,
            )
        )

        site = Site.objects.create(
            organization=(
                self.organization
            ),
            name="Site A",
        )

        building = (
            Building.objects.create(
                site=site,
                name="Bâtiment A",
            )
        )

        floor = Floor.objects.create(
            building=building,
            name="RDC",
            level=0,
        )

        self.location = (
            Location.objects.create(
                floor=floor,
                name="Salle 1",
            )
        )

        self.category = (
            EquipmentCategory.objects.create(
                organization=(
                    self.organization
                ),
                name="Climatisation",
            )
        )

        self.equipment = (
            Equipment.objects.create(
                organization=(
                    self.organization
                ),
                category=(
                    self.category
                ),
                location=(
                    self.location
                ),
                code="CLIM-001",
                name="Climatiseur",
            )
        )

    def test_create_with_image(
        self,
    ):
        self.client.force_authenticate(
            self.manager
        )

        image = SimpleUploadedFile(
            "equipment.png",
            (
                b"\x89PNG\r\n\x1a\n"
                b"\x00\x00\x00\rIHDR"
                b"\x00\x00\x00\x01"
                b"\x00\x00\x00\x01"
                b"\x08\x06\x00\x00\x00"
                b"\x1f\x15\xc4\x89"
                b"\x00\x00\x00\rIDAT"
                b"\x08\xd7c\xf8\xcf\xc0\xf0\x1f"
                b"\x00\x05\x00\x01\xff"
                b"\x89\x99=\x1d"
                b"\x00\x00\x00\x00IEND"
                b"\xaeB`\x82"
            ),
            content_type="image/png",
        )

        response = self.client.post(
            "/api/v1/equipment/items/",
            {
                "category": (
                    self.category.id
                ),
                "location": (
                    self.location.id
                ),
                "code": "CLIM-002",
                "name": "Climatiseur 2",
                "status": "ACTIVE",
                "image": image,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

    def test_update_requires_justification(
        self,
    ):
        self.client.force_authenticate(
            self.manager
        )

        response = self.client.post(
            (
                "/api/v1/equipment/items/"
                f"{self.equipment.id}/"
                "update-with-justification/"
            ),
            {
                "name": "Climatiseur modifié",
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_update_creates_audit_log(
        self,
    ):
        self.client.force_authenticate(
            self.manager
        )

        response = self.client.post(
            (
                "/api/v1/equipment/items/"
                f"{self.equipment.id}/"
                "update-with-justification/"
            ),
            {
                "name": "Climatiseur modifié",
                "justification": (
                    "Correction du nom après inventaire."
                ),
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            EquipmentAuditLog.objects
            .filter(
                equipment=self.equipment,
                action=(
                    EquipmentAuditLog
                    .Action
                    .UPDATE
                ),
            )
            .exists()
        )

    def test_delete_requires_justification(
        self,
    ):
        self.client.force_authenticate(
            self.manager
        )

        response = self.client.post(
            (
                "/api/v1/equipment/items/"
                f"{self.equipment.id}/"
                "deactivate/"
            ),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_delete_is_soft_and_audited(
        self,
    ):
        self.client.force_authenticate(
            self.manager
        )

        response = self.client.post(
            (
                "/api/v1/equipment/items/"
                f"{self.equipment.id}/"
                "deactivate/"
            ),
            {
                "justification": (
                    "Équipement retiré définitivement du parc."
                )
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.equipment.refresh_from_db()

        self.assertFalse(
            self.equipment.is_active
        )

        self.assertTrue(
            EquipmentAuditLog.objects
            .filter(
                equipment=self.equipment,
                action=(
                    EquipmentAuditLog
                    .Action
                    .DELETE
                ),
            )
            .exists()
        )
