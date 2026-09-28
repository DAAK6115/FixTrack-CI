from rest_framework import generics
from rest_framework.exceptions import NotFound
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response

from apps.accounts.permissions import (
    IsOrganizationAdmin,
)

from .serializers import (
    OrganizationSerializer,
)


class CurrentOrganizationView(
    generics.RetrieveUpdateAPIView
):
    serializer_class = (
        OrganizationSerializer
    )

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_permissions(
        self,
    ):
        if self.request.method in {
            "PATCH",
            "PUT",
        }:
            permission_classes = [
                IsOrganizationAdmin
            ]
        else:
            permission_classes = [
                IsAuthenticated
            ]

        return [
            permission()
            for permission
            in permission_classes
        ]

    def get_object(
        self,
    ):
        organization = getattr(
            self.request.user,
            "organization",
            None,
        )

        if not organization:
            raise NotFound(
                "Aucune organisation associée à cet utilisateur."
            )

        return organization

    def update(
        self,
        request,
        *args,
        **kwargs,
    ):
        partial = kwargs.pop(
            "partial",
            False,
        )

        instance = (
            self.get_object()
        )

        data = request.data.copy()

        remove_logo = (
            str(
                request.data.get(
                    "remove_logo",
                    "",
                )
            )
            .strip()
            .lower()
            in {
                "1",
                "true",
                "yes",
            }
        )

        if "remove_logo" in data:
            data.pop(
                "remove_logo"
            )

        serializer = (
            self.get_serializer(
                instance,
                data=data,
                partial=partial,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        has_new_logo = (
            "logo"
            in serializer.validated_data
            and serializer.validated_data[
                "logo"
            ]
        )

        organization = (
            serializer.save()
        )

        if (
            remove_logo
            and not has_new_logo
        ):
            if organization.logo:
                organization.logo.delete(
                    save=False
                )

            organization.logo = None

            organization.save(
                update_fields=[
                    "logo",
                    "updated_at",
                ]
            )

        return Response(
            self.get_serializer(
                organization
            ).data
        )
