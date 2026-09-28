from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.equipment.models import (
    Equipment,
    EquipmentCategory,
)
from apps.locations.models import (
    Building,
    Floor,
    Location,
    Site,
)
from apps.organizations.models import Organization


class EquipmentActiveCreationTests(
    APITestCase
):
    def setUp(self):
        self.organization = (
            Organization.objects.create(
                name="Active Equipment",
                slug="active-equipment",
                type=(
                    Organization.Type.COMPANY
                ),
            )
        )

        self.manager = (
            User.objects.create_user(
                email="active-manager@fixtrack.ci",
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

        building = Building.objects.create(
            site=site,
            name="Bâtiment",
        )

        floor = Floor.objects.create(
            building=building,
            name="RDC",
            level=0,
        )

        self.location = (
            Location.objects.create(
                floor=floor,
                name="Salle",
            )
        )

        self.category = (
            EquipmentCategory.objects.create(
                organization=self.organization,
                name="Climatisation",
            )
        )

    def test_new_equipment_is_always_active(
        self,
    ):
        self.client.force_authenticate(
            self.manager
        )

        response = self.client.post(
            "/api/v1/equipment/items/",
            {
                "category": self.category.id,
                "location": self.location.id,
                "code": "ACTIVE-001",
                "name": "Équipement actif",
                "status": "ACTIVE",
                "is_active": False,
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        equipment = Equipment.objects.get(
            pk=response.data["id"]
        )

        self.assertTrue(
            equipment.is_active
        )

        detail = self.client.get(
            (
                "/api/v1/equipment/items/"
                f"{equipment.id}/"
            )
        )

        self.assertEqual(
            detail.status_code,
            status.HTTP_200_OK,
        )
