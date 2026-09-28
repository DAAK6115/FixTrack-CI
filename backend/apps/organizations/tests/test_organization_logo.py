from io import BytesIO

from django.core.files.uploadedfile import (
    SimpleUploadedFile,
)

from PIL import Image

from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.organizations.models import Organization


def make_logo():
    buffer = BytesIO()

    image = Image.new(
        "RGB",
        (32, 32),
        "white",
    )

    image.save(
        buffer,
        format="PNG",
    )

    return SimpleUploadedFile(
        "logo.png",
        buffer.getvalue(),
        content_type="image/png",
    )


class OrganizationLogoTests(
    APITestCase
):
    def setUp(self):
        self.organization = (
            Organization.objects.create(
                name="Université Horizon",
                slug="universite-horizon",
                type=(
                    Organization.Type.SCHOOL
                ),
            )
        )

        self.admin = (
            User.objects.create_user(
                email="admin-logo@fixtrack.ci",
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
                email="manager-logo@fixtrack.ci",
                password="Test12345!",
                first_name="Manager",
                organization=(
                    self.organization
                ),
                role=User.Role.MANAGER,
            )
        )

    def test_admin_can_upload_logo(
        self,
    ):
        self.client.force_authenticate(
            self.admin
        )

        response = self.client.patch(
            "/api/v1/organizations/current/",
            {
                "logo": make_logo(),
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.organization.refresh_from_db()

        self.assertTrue(
            bool(
                self.organization.logo
            )
        )

        self.assertTrue(
            bool(
                response.data[
                    "logo_url"
                ]
            )
        )

    def test_manager_cannot_change_logo(
        self,
    ):
        self.client.force_authenticate(
            self.manager
        )

        response = self.client.patch(
            "/api/v1/organizations/current/",
            {
                "logo": make_logo(),
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_can_remove_logo(
        self,
    ):
        self.organization.logo = (
            make_logo()
        )

        self.organization.save(
            update_fields=[
                "logo"
            ]
        )

        self.client.force_authenticate(
            self.admin
        )

        response = self.client.patch(
            "/api/v1/organizations/current/",
            {
                "remove_logo": "true",
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.organization.refresh_from_db()

        self.assertFalse(
            bool(
                self.organization.logo
            )
        )
