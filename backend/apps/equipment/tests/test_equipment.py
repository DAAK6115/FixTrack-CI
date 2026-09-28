from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.equipment.models import Equipment, EquipmentCategory
from apps.locations.models import Building, Floor, Location, Site
from apps.organizations.models import Organization


class EquipmentTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(
            name="Equipment Test",
            slug="equipment-test",
            type=Organization.Type.COMPANY,
        )

        self.manager = User.objects.create_user(
            email="manager-equipment@fixtrack.ci",
            password="Test12345!",
            first_name="Manager",
            organization=self.organization,
            role=User.Role.MANAGER,
        )

        self.requester = User.objects.create_user(
            email="requester-equipment@fixtrack.ci",
            password="Test12345!",
            first_name="Requester",
            organization=self.organization,
            role=User.Role.REQUESTER,
        )

        site = Site.objects.create(
            organization=self.organization,
            name="Site A",
        )
        building = Building.objects.create(
            site=site,
            name="Bâtiment A",
        )
        floor = Floor.objects.create(
            building=building,
            name="RDC",
            level=0,
        )
        self.location = Location.objects.create(
            floor=floor,
            name="Salle 1",
        )

        self.category = EquipmentCategory.objects.create(
            organization=self.organization,
            name="Climatisation",
        )

        self.equipment = Equipment.objects.create(
            organization=self.organization,
            category=self.category,
            location=self.location,
            code="CLIM-001",
            name="Climatiseur test",
        )

    def test_manager_can_list_equipment(self):
        self.client.force_authenticate(self.manager)
        response = self.client.get("/api/v1/equipment/items/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_requester_can_read_equipment(self):
        self.client.force_authenticate(self.requester)
        response = self.client.get(
            f"/api/v1/equipment/items/{self.equipment.id}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_requester_cannot_create_equipment(self):
        self.client.force_authenticate(self.requester)
        response = self.client.post(
            "/api/v1/equipment/items/",
            {
                "category": self.category.id,
                "location": self.location.id,
                "code": "NEW-001",
                "name": "Nouvel équipement",
                "status": "ACTIVE",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_qr_token_resolves_equipment(self):
        self.client.force_authenticate(self.manager)
        response = self.client.get(
            f"/api/v1/equipment/resolve/{self.equipment.qr_token}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.equipment.id)
