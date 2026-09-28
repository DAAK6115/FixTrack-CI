from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.incidents.models import (
    Incident,
    IncidentCategory,
)
from apps.locations.models import (
    Building,
    Floor,
    Location,
    Site,
)
from apps.organizations.models import Organization


class DashboardAnalyticsTests(
    APITestCase
):
    def setUp(self):
        self.organization = (
            Organization.objects.create(
                name="Analytics Test",
                slug="analytics-test",
                type=(
                    Organization.Type.COMPANY
                ),
            )
        )

        self.manager = (
            User.objects.create_user(
                email="manager-analytics@fixtrack.ci",
                password="Test12345!",
                first_name="Manager",
                organization=(
                    self.organization
                ),
                role=User.Role.MANAGER,
            )
        )

        self.requester = (
            User.objects.create_user(
                email="requester-analytics@fixtrack.ci",
                password="Test12345!",
                first_name="Requester",
                organization=(
                    self.organization
                ),
                role=User.Role.REQUESTER,
            )
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

        location = Location.objects.create(
            floor=floor,
            name="Salle 1",
        )

        category = (
            IncidentCategory.objects.create(
                organization=(
                    self.organization
                ),
                name="Électricité",
            )
        )

        Incident.objects.create(
            organization=(
                self.organization
            ),
            reference=(
                "INC-2026-900001"
            ),
            reported_by=(
                self.requester
            ),
            category=category,
            location=location,
            title="Prise défectueuse",
            description=(
                "Une prise ne fonctionne plus."
            ),
            requested_priority=(
                Incident.Priority.HIGH
            ),
        )

    def test_manager_dashboard(
        self,
    ):
        self.client.force_authenticate(
            self.manager
        )

        response = self.client.get(
            "/api/v1/analytics/dashboard/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data[
                "summary"
            ][
                "total"
            ],
            1,
        )

        self.assertEqual(
            response.data[
                "summary"
            ][
                "open"
            ],
            1,
        )

    def test_requester_only_sees_own_data(
        self,
    ):
        self.client.force_authenticate(
            self.requester
        )

        response = self.client.get(
            "/api/v1/analytics/dashboard/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["role"],
            User.Role.REQUESTER,
        )

        self.assertEqual(
            response.data[
                "summary"
            ][
                "total"
            ],
            1,
        )
