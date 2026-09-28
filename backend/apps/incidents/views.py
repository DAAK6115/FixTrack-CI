from django.db.models import Q

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User
from apps.accounts.permissions import (
    HasOrganization,
    IsOrganizationAdminOrManager,
)

from .models import Incident, IncidentCategory
from .permissions import IncidentAccessPermission
from .serializers import (
    AssignIncidentSerializer,
    IncidentCategorySerializer,
    IncidentCreateSerializer,
    IncidentDetailSerializer,
    IncidentListSerializer,
    ResolveIncidentSerializer,
    ValidateIncidentSerializer,
    WorkflowCommentSerializer,
)
from .services import (
    WorkflowError,
    assign_incident,
    close_incident,
    hold_incident,
    reject_incident,
    resolve_incident,
    start_incident,
    validate_incident,
)


class IncidentCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = IncidentCategorySerializer

    def get_permissions(self):
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

    def get_queryset(self):
        return IncidentCategory.objects.filter(
            organization=self.request.user.organization,
            is_active=True,
        )

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class IncidentViewSet(viewsets.ModelViewSet):
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

    def get_queryset(self):
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
                "location__floor__building__site",
            )
            .prefetch_related(
                "media",
                "status_history",
                "status_history__changed_by",
                "assignments",
                "assignments__technician",
                "assignments__assigned_by",
                "interventions",
                "interventions__technician",
            )
            .filter(
                organization=user.organization
            )
        )

        if user.role == User.Role.REQUESTER:
            queryset = queryset.filter(
                reported_by=user
            )

        elif user.role == User.Role.TECHNICIAN:
            queryset = queryset.filter(
                Q(reported_by=user)
                |
                Q(
                    assignments__technician=user,
                    assignments__is_active=True,
                )
            ).distinct()

        status_filter = (
            self.request.query_params.get("status")
        )
        priority = (
            self.request.query_params.get("priority")
        )
        category = (
            self.request.query_params.get("category")
        )
        site = (
            self.request.query_params.get("site")
        )
        search = (
            self.request.query_params.get("search")
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
                Q(reference__icontains=search)
                |
                Q(title__icontains=search)
                |
                Q(description__icontains=search)
                |
                Q(location__name__icontains=search)
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

    def get_serializer_class(self):
        if self.action == "create":
            return IncidentCreateSerializer

        if self.action in {
            "retrieve",
            "partial_update",
        }:
            return IncidentDetailSerializer

        return IncidentListSerializer

    def perform_update(self, serializer):
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
                "Cet incident ne peut plus être modifié."
            )

        serializer.save()

    def _workflow_response(self, incident):
        fresh_incident = (
            self.get_queryset()
            .get(pk=incident.pk)
        )

        serializer = IncidentDetailSerializer(
            fresh_incident,
            context={
                "request": self.request
            },
        )

        return Response(serializer.data)

    def _workflow_error(self, exc):
        return Response(
            {
                "detail": str(exc)
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="choices",
    )
    def choices(self, request):
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

    @action(
        detail=True,
        methods=["post"],
        url_path="validate",
    )
    def validate_action(
        self,
        request,
        pk=None,
    ):
        incident = self.get_object()

        serializer = ValidateIncidentSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )

        try:
            updated = validate_incident(
                incident.id,
                request.user,
                serializer.validated_data.get(
                    "validated_priority"
                ),
                serializer.validated_data.get(
                    "comment",
                    "",
                ),
            )
        except WorkflowError as exc:
            return self._workflow_error(exc)

        return self._workflow_response(updated)

    @action(
        detail=True,
        methods=["post"],
        url_path="reject",
    )
    def reject_action(
        self,
        request,
        pk=None,
    ):
        incident = self.get_object()

        serializer = WorkflowCommentSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )

        try:
            updated = reject_incident(
                incident.id,
                request.user,
                serializer.validated_data.get(
                    "comment",
                    "",
                ),
            )
        except WorkflowError as exc:
            return self._workflow_error(exc)

        return self._workflow_response(updated)

    @action(
        detail=True,
        methods=["post"],
        url_path="assign",
    )
    def assign_action(
        self,
        request,
        pk=None,
    ):
        incident = self.get_object()

        serializer = AssignIncidentSerializer(
            data=request.data,
            context={
                "request": request
            },
        )
        serializer.is_valid(
            raise_exception=True
        )

        technician = User.objects.get(
            pk=serializer.validated_data[
                "technician_id"
            ]
        )

        try:
            updated = assign_incident(
                incident.id,
                request.user,
                technician,
                serializer.validated_data.get(
                    "comment",
                    "",
                ),
            )
        except WorkflowError as exc:
            return self._workflow_error(exc)

        return self._workflow_response(updated)

    @action(
        detail=True,
        methods=["post"],
        url_path="start",
    )
    def start_action(
        self,
        request,
        pk=None,
    ):
        incident = self.get_object()

        serializer = WorkflowCommentSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )

        try:
            updated = start_incident(
                incident.id,
                request.user,
                serializer.validated_data.get(
                    "comment",
                    "",
                ),
            )
        except WorkflowError as exc:
            return self._workflow_error(exc)

        return self._workflow_response(updated)

    @action(
        detail=True,
        methods=["post"],
        url_path="hold",
    )
    def hold_action(
        self,
        request,
        pk=None,
    ):
        incident = self.get_object()

        serializer = WorkflowCommentSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )

        try:
            updated = hold_incident(
                incident.id,
                request.user,
                serializer.validated_data.get(
                    "comment",
                    "",
                ),
            )
        except WorkflowError as exc:
            return self._workflow_error(exc)

        return self._workflow_response(updated)

    @action(
        detail=True,
        methods=["post"],
        url_path="resume",
    )
    def resume_action(
        self,
        request,
        pk=None,
    ):
        incident = self.get_object()

        serializer = WorkflowCommentSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )

        try:
            updated = start_incident(
                incident.id,
                request.user,
                serializer.validated_data.get(
                    "comment",
                    "",
                ),
            )
        except WorkflowError as exc:
            return self._workflow_error(exc)

        return self._workflow_response(updated)

    @action(
        detail=True,
        methods=["post"],
        url_path="resolve",
    )
    def resolve_action(
        self,
        request,
        pk=None,
    ):
        incident = self.get_object()

        serializer = ResolveIncidentSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )

        try:
            updated = resolve_incident(
                incident.id,
                request.user,
                serializer.validated_data[
                    "resolution"
                ],
                serializer.validated_data.get(
                    "notes",
                    "",
                ),
            )
        except WorkflowError as exc:
            return self._workflow_error(exc)

        return self._workflow_response(updated)

    @action(
        detail=True,
        methods=["post"],
        url_path="close",
    )
    def close_action(
        self,
        request,
        pk=None,
    ):
        incident = self.get_object()

        serializer = WorkflowCommentSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )

        try:
            updated = close_incident(
                incident.id,
                request.user,
                serializer.validated_data.get(
                    "comment",
                    "",
                ),
            )
        except WorkflowError as exc:
            return self._workflow_error(exc)

        return self._workflow_response(updated)
