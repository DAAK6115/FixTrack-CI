from django.db.models import Q

from rest_framework import (
    status,
    viewsets,
)
from rest_framework.decorators import action
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import (
    HasOrganization,
    IsOrganizationAdminOrManager,
)

from .models import (
    Incident,
    IncidentCategory,
)
from .permissions import (
    IncidentAccessPermission,
)
from .serializers import (
    IncidentCategorySerializer,
    IncidentCreateSerializer,
    IncidentDetailSerializer,
    IncidentListSerializer,
)


class IncidentCategoryViewSet(
    viewsets.ModelViewSet
):
    serializer_class = (
        IncidentCategorySerializer
    )

    def get_permissions(
        self,
    ):
        permissions = [
            IsAuthenticated,
            HasOrganization,
        ]

        if self.request.method not in {
            "GET",
            "HEAD",
            "OPTIONS",
        }:
            permissions.append(
                IsOrganizationAdminOrManager
            )

        return [
            permission()
            for permission in permissions
        ]

    def get_queryset(
        self,
    ):
        return (
            IncidentCategory.objects
            .filter(
                organization=(
                    self.request.user.organization
                ),
                is_active=True,
            )
        )

    def perform_create(
        self,
        serializer,
    ):
        serializer.save(
            organization=(
                self.request.user.organization
            )
        )

    def destroy(
        self,
        request,
        *args,
        **kwargs,
    ):
        instance = self.get_object()

        instance.is_active = False

        instance.save(
            update_fields=[
                "is_active"
            ]
        )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class IncidentViewSet(
    viewsets.ModelViewSet
):
    permission_classes = [
        IncidentAccessPermission
    ]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    http_method_names = [
        "get",
        "post",
        "patch",
        "head",
        "options",
    ]

    def get_queryset(
        self,
    ):
        user = self.request.user

        queryset = (
            Incident.objects
            .select_related(
                "organization",
                "reported_by",
                "category",
                "location",
                "location__floor",
                "location__floor__building",
                (
                    "location__floor__"
                    "building__site"
                ),
            )
            .prefetch_related(
                "media",
                "status_history",
                (
                    "status_history__"
                    "changed_by"
                ),
            )
            .filter(
                organization=user.organization
            )
        )

        if user.role == User.Role.REQUESTER:
            queryset = queryset.filter(
                reported_by=user
            )

        status_filter = (
            self.request
            .query_params
            .get("status")
        )

        priority = (
            self.request
            .query_params
            .get("priority")
        )

        category = (
            self.request
            .query_params
            .get("category")
        )

        site = (
            self.request
            .query_params
            .get("site")
        )

        search = (
            self.request
            .query_params
            .get("search")
        )

        if status_filter:
            queryset = queryset.filter(
                status=status_filter
            )

        if priority:
            queryset = queryset.filter(
                requested_priority=priority
            )

        if category:
            queryset = queryset.filter(
                category_id=category
            )

        if site:
            queryset = queryset.filter(
                location__floor__building__site_id=site
            )

        if search:
            queryset = queryset.filter(
                Q(
                    reference__icontains=search
                )
                |
                Q(
                    title__icontains=search
                )
                |
                Q(
                    description__icontains=search
                )
                |
                Q(
                    location__name__icontains=search
                )
                |
                Q(
                    location__floor__building__name__icontains=search
                )
                |
                Q(
                    location__floor__building__site__name__icontains=search
                )
            )

        return queryset

    def get_serializer_class(
        self,
    ):
        if self.action == "create":
            return IncidentCreateSerializer

        if self.action in {
            "retrieve",
            "partial_update",
        }:
            return IncidentDetailSerializer

        return IncidentListSerializer

    def perform_update(
        self,
        serializer,
    ):
        incident = self.get_object()
        user = self.request.user

        if (
            user.role
            not in {
                User.Role.ADMIN,
                User.Role.MANAGER,
            }
            and incident.status
            != Incident.Status.REPORTED
        ):
            from rest_framework.exceptions import (
                PermissionDenied,
            )

            raise PermissionDenied(
                (
                    "Cet incident ne peut "
                    "plus être modifié."
                )
            )

        serializer.save()

    @action(
        detail=False,
        methods=["get"],
        url_path="choices",
    )
    def choices(
        self,
        request,
    ):
        return Response(
            {
                "priorities": [
                    {
                        "value": value,
                        "label": label,
                    }
                    for value, label
                    in Incident.Priority.choices
                ],

                "statuses": [
                    {
                        "value": value,
                        "label": label,
                    }
                    for value, label
                    in Incident.Status.choices
                ],
            }
        )