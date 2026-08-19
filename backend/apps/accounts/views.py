from django.db.models import Q

from rest_framework import generics, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .models import User
from .permissions import (
    IsOrganizationAdmin,
    IsOrganizationAdminOrManager,
)
from .serializers import (
    MeSerializer,
    UserManagementSerializer,
)


class LoginView(TokenObtainPairView):
    pass


class RefreshView(TokenRefreshView):
    pass


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserManagementViewSet(
    viewsets.ModelViewSet
):
    serializer_class = UserManagementSerializer
    permission_classes = [IsOrganizationAdmin]

    def get_queryset(self):
        queryset = User.objects.filter(
            organization=self.request.user.organization
        )

        role = self.request.query_params.get("role")
        active = self.request.query_params.get(
            "is_active"
        )
        search = self.request.query_params.get(
            "search"
        )

        if role:
            queryset = queryset.filter(
                role=role
            )

        if active in {"true", "false"}:
            queryset = queryset.filter(
                is_active=(active == "true")
            )

        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(phone__icontains=search)
            )

        return queryset.order_by(
            "first_name",
            "last_name",
            "email",
        )

    def destroy(
        self,
        request,
        *args,
        **kwargs,
    ):
        instance = self.get_object()

        if instance.pk == request.user.pk:
            raise ValidationError(
                "Vous ne pouvez pas désactiver "
                "votre propre compte."
            )

        instance.is_active = False

        instance.save(
            update_fields=["is_active"]
        )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class TechnicianListView(generics.ListAPIView):
    serializer_class = UserManagementSerializer
    permission_classes = [
        IsOrganizationAdminOrManager
    ]

    def get_queryset(self):
        queryset = User.objects.filter(
            organization=self.request.user.organization,
            role=User.Role.TECHNICIAN,
            is_active=True,
        )

        search = self.request.query_params.get(
            "search"
        )

        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(phone__icontains=search)
            )

        return queryset.order_by(
            "first_name",
            "last_name",
        )