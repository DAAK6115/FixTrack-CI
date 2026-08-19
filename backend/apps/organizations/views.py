from rest_framework import generics
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated

from .serializers import OrganizationSerializer
from apps.accounts.permissions import IsOrganizationAdminOrManager


class CurrentOrganizationView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganizationSerializer

    def get_permissions(self):
        # Tout utilisateur authentifié peut consulter son organisation.
        # Seuls ADMIN et MANAGER peuvent la modifier.
        if self.request.method in {"PATCH", "PUT"}:
            permission_classes = [IsOrganizationAdminOrManager]
        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    def get_object(self):
        organization = getattr(self.request.user, "organization", None)
        if not organization:
            raise NotFound("Aucune organisation associée à cet utilisateur.")
        return organization
