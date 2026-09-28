from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.equipment.models import (
    Equipment,
    EquipmentCategory,
    EquipmentDeletionRequest,
)
from apps.incidents.models import (
    Incident,
    IncidentCategory,
    Intervention,
)
from apps.locations.models import (
    Building,
    Floor,
    Location,
    Site,
)
from apps.organizations.models import Organization


class EquipmentArchiveHistoryTests(
    APITestCase
):
    def setUp(self):
        self.organization = (
            Organization.objects.create(
                name="Archive Test",
                slug="archive-test",
                type=(
                    Organization.Type.COMPANY
                ),
            )
        )

        self.admin = (
            User.objects.create_user(
                email="admin-archive@fixtrack.ci",
                password="Test12345!",
                first_name="Admin",
                organization=self.organization,
                role=User.Role.ADMIN,
            )
        )

        self.manager = (
            User.objects.create_user(
                email="manager-archive@fixtrack.ci",
                password="Test12345!",
                first_name="Manager",
                organization=self.organization,
                role=User.Role.MANAGER,
            )
        )

        self.technician = (
            User.objects.create_user(
                email="tech-archive@fixtrack.ci",
                password="Test12345!",
                first_name="Tech",
                organization=self.organization,
                role=User.Role.TECHNICIAN,
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

        equipment_category = (
            EquipmentCategory.objects.create(
                organization=self.organization,
                name="Climatisation",
            )
        )

        incident_category = (
            IncidentCategory.objects.create(
                organization=self.organization,
                name="Climatisation",
            )
        )

        self.equipment = (
            Equipment.objects.create(
                organization=self.organization,
                category=equipment_category,
                location=location,
                code="CLIM-ARCH-001",
                name="Climatiseur archives",
            )
        )

        self.incident = (
            Incident.objects.create(
                organization=self.organization,
                reference="INC-2026-990001",
                reported_by=self.manager,
                category=incident_category,
                location=location,
                equipment=self.equipment,
                title="Panne climatiseur",
                description="Test historique.",
                requested_priority=(
                    Incident.Priority.NORMAL
                ),
            )
        )

        now = timezone.now()

        Intervention.objects.create(
            incident=self.incident,
            technician=self.technician,
            started_at=now,
            ended_at=now,
            notes="Diagnostic effectué.",
            resolution="Pièce remplacée.",
        )

    def test_approved_deletion_removes_active_item_but_keeps_history(
        self,
    ):
        deletion_request = (
            EquipmentDeletionRequest.objects
            .create(
                organization=self.organization,
                equipment=self.equipment,
                requested_by=self.manager,
                justification=(
                    "Équipement remplacé "
                    "et retiré du parc."
                ),
            )
        )

        self.client.force_authenticate(
            self.admin
        )

        approval = self.client.post(
            (
                "/api/v1/equipment/"
                "deletion-requests/"
                f"{deletion_request.id}/"
                "approve/"
            ),
            {
                "review_note": (
                    "Retrait validé après contrôle."
                )
            },
            format="json",
        )

        self.assertEqual(
            approval.status_code,
            status.HTTP_200_OK,
        )

        self.equipment.refresh_from_db()

        self.assertFalse(
            self.equipment.is_active
        )

        active_list = self.client.get(
            "/api/v1/equipment/items/"
        )

        active_ids = [
            item["id"]
            for item in active_list.data
        ]

        self.assertNotIn(
            self.equipment.id,
            active_ids,
        )

        archives = self.client.get(
            "/api/v1/equipment/archives/"
        )

        self.assertEqual(
            archives.status_code,
            status.HTTP_200_OK,
        )

        archived_record = next(
            item
            for item in archives.data
            if (
                item["equipment"]["id"]
                == self.equipment.id
            )
        )

        self.assertEqual(
            archived_record[
                "deletion"
            ][
                "justification"
            ],
            (
                "Équipement remplacé "
                "et retiré du parc."
            ),
        )

        self.assertEqual(
            archived_record[
                "deletion"
            ][
                "requested_by"
            ],
            self.manager.id,
        )

        self.assertEqual(
            archived_record[
                "deletion"
            ][
                "reviewed_by"
            ],
            self.admin.id,
        )

        incident_history = self.client.get(
            (
                "/api/v1/equipment/items/"
                f"{self.equipment.id}/"
                "incidents/"
            )
        )

        self.assertEqual(
            incident_history.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(
                incident_history.data
            ),
            1,
        )

        self.assertTrue(
            Intervention.objects.filter(
                incident=self.incident
            ).exists()
        )
