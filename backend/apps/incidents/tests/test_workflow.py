from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.incidents.models import (
    Incident,
    IncidentAssignment,
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


class IncidentWorkflowTests(APITestCase):
    def setUp(self):
        self.organization = Organization.objects.create(
            name="FixTrack Demo",
            slug="fixtrack-demo",
            type=Organization.Type.COMPANY,
        )

        self.manager = User.objects.create_user(
            email="manager-test@fixtrack.ci",
            password="TestPassword123!",
            first_name="Manager",
            organization=self.organization,
            role=User.Role.MANAGER,
        )

        self.technician = User.objects.create_user(
            email="tech-test@fixtrack.ci",
            password="TestPassword123!",
            first_name="Technicien",
            organization=self.organization,
            role=User.Role.TECHNICIAN,
        )

        self.requester = User.objects.create_user(
            email="requester-test@fixtrack.ci",
            password="TestPassword123!",
            first_name="Demandeur",
            organization=self.organization,
            role=User.Role.REQUESTER,
        )

        self.other_requester = User.objects.create_user(
            email="other-test@fixtrack.ci",
            password="TestPassword123!",
            first_name="Autre",
            organization=self.organization,
            role=User.Role.REQUESTER,
        )

        self.site = Site.objects.create(
            organization=self.organization,
            name="Site test",
        )

        self.building = Building.objects.create(
            site=self.site,
            name="Bâtiment A",
        )

        self.floor = Floor.objects.create(
            building=self.building,
            name="RDC",
            level=0,
        )

        self.location = Location.objects.create(
            floor=self.floor,
            name="Salle A1",
        )

        self.category = IncidentCategory.objects.create(
            organization=self.organization,
            name="Climatisation",
        )

        self.incident = Incident.objects.create(
            organization=self.organization,
            reference="INC-2026-999001",
            reported_by=self.requester,
            category=self.category,
            location=self.location,
            title="Climatisation en panne",
            description="La climatisation ne démarre plus.",
            requested_priority=Incident.Priority.HIGH,
        )

    def detail_url(self):
        return f"/api/v1/incidents/{self.incident.id}/"

    def action_url(self, action_name):
        return (
            f"/api/v1/incidents/"
            f"{self.incident.id}/"
            f"{action_name}/"
        )

    def test_complete_workflow(self):
        self.client.force_authenticate(
            self.manager
        )

        response = self.client.post(
            self.action_url("validate"),
            {
                "validated_priority":
                    Incident.Priority.HIGH,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.incident.refresh_from_db()

        self.assertEqual(
            self.incident.status,
            Incident.Status.VALIDATED,
        )

        response = self.client.post(
            self.action_url("assign"),
            {
                "technician_id":
                    self.technician.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.incident.refresh_from_db()

        self.assertEqual(
            self.incident.status,
            Incident.Status.ASSIGNED,
        )

        self.assertTrue(
            IncidentAssignment.objects.filter(
                incident=self.incident,
                technician=self.technician,
                is_active=True,
            ).exists()
        )

        self.client.force_authenticate(
            self.technician
        )

        response = self.client.post(
            self.action_url("start"),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.incident.refresh_from_db()

        self.assertEqual(
            self.incident.status,
            Incident.Status.IN_PROGRESS,
        )

        self.assertTrue(
            Intervention.objects.filter(
                incident=self.incident,
                technician=self.technician,
                ended_at__isnull=True,
            ).exists()
        )

        response = self.client.post(
            self.action_url("resolve"),
            {
                "resolution": (
                    "Condensateur remplacé "
                    "et climatiseur testé."
                ),
                "notes": "Fonctionnement normal.",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.incident.refresh_from_db()

        self.assertEqual(
            self.incident.status,
            Incident.Status.RESOLVED,
        )

        self.client.force_authenticate(
            self.requester
        )

        response = self.client.post(
            self.action_url("close"),
            {
                "comment": "Résolution confirmée."
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.incident.refresh_from_db()

        self.assertEqual(
            self.incident.status,
            Incident.Status.CLOSED,
        )


    def test_manager_can_assign_reported_incident_directly(self):
        self.client.force_authenticate(
            self.manager
        )

        response = self.client.post(
            self.action_url("assign"),
            {
                "technician_id":
                    self.technician.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.incident.refresh_from_db()

        self.assertEqual(
            self.incident.status,
            Incident.Status.ASSIGNED,
        )

        self.assertTrue(
            IncidentAssignment.objects.filter(
                incident=self.incident,
                technician=self.technician,
                is_active=True,
            ).exists()
        )

        self.client.force_authenticate(
            self.technician
        )

        response = self.client.post(
            self.action_url("start"),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.incident.refresh_from_db()

        self.assertEqual(
            self.incident.status,
            Incident.Status.IN_PROGRESS,
        )


    def test_assigned_technician_can_pause_and_resume(self):
        self.client.force_authenticate(
            self.manager
        )

        response = self.client.post(
            self.action_url("assign"),
            {
                "technician_id":
                    self.technician.id,
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.client.force_authenticate(
            self.technician
        )

        response = self.client.post(
            self.action_url("start"),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        response = self.client.post(
            self.action_url("hold"),
            {
                "comment": "Pause technique."
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.incident.refresh_from_db()

        self.assertEqual(
            self.incident.status,
            Incident.Status.ON_HOLD,
        )

        response = self.client.post(
            self.action_url("resume"),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.incident.refresh_from_db()

        self.assertEqual(
            self.incident.status,
            Incident.Status.IN_PROGRESS,
        )

    def test_other_requester_cannot_view_incident(self):
        self.client.force_authenticate(
            self.other_requester
        )

        response = self.client.get(
            self.detail_url()
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_technician_cannot_start_unassigned_incident(self):
        self.client.force_authenticate(
            self.technician
        )

        response = self.client.post(
            self.action_url("start"),
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
