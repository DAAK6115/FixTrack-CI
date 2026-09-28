from io import BytesIO

import qrcode

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.http import HttpResponse

from rest_framework import (
    status,
    viewsets,
)
from rest_framework.decorators import (
    action,
)
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.permissions import (
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.incidents.serializers import (
    IncidentListSerializer,
)
from apps.notifications.services import (
    create_notification,
    notify_roles,
)

from .models import (
    Equipment,
    EquipmentAuditLog,
    EquipmentCategory,
    EquipmentDeletionRequest,
)
from .permissions import (
    EquipmentPermission,
)
from .serializers import (
    EquipmentAuditLogSerializer,
    EquipmentCategorySerializer,
    EquipmentDeletionRequestSerializer,
    EquipmentSerializer,
)


def equipment_snapshot(
    equipment,
):
    return {
        "code": (
            equipment.code
        ),
        "name": (
            equipment.name
        ),
        "category_id": (
            equipment.category_id
        ),
        "category_name": (
            equipment.category.name
        ),
        "location_id": (
            equipment.location_id
        ),
        "location_name": (
            equipment.location.name
        ),
        "brand": (
            equipment.brand
        ),
        "model_name": (
            equipment.model_name
        ),
        "serial_number": (
            equipment.serial_number
        ),
        "installation_date": (
            equipment.installation_date.isoformat()
            if equipment.installation_date
            else None
        ),
        "status": (
            equipment.status
        ),
        "description": (
            equipment.description
        ),
        "notes": (
            equipment.notes
        ),
        "image": (
            equipment.image.name
            if equipment.image
            else None
        ),
        "is_active": (
            equipment.is_active
        ),
    }


class EquipmentCategoryViewSet(
    viewsets.ModelViewSet
):
    serializer_class = (
        EquipmentCategorySerializer
    )

    permission_classes = [
        IsAuthenticated,
        EquipmentPermission,
    ]

    def get_queryset(
        self,
    ):
        return (
            EquipmentCategory.objects
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
            ),
            is_active=True,
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
            status=(
                status.HTTP_204_NO_CONTENT
            )
        )


class EquipmentViewSet(
    viewsets.ModelViewSet
):
    serializer_class = (
        EquipmentSerializer
    )

    permission_classes = [
        IsAuthenticated,
        EquipmentPermission,
    ]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    http_method_names = [
        "get",
        "post",
        "head",
        "options",
    ]

    def get_queryset(
        self,
    ):
        queryset = (
            Equipment.objects
            .select_related(
                "category",
                "location",
                "location__floor",
                "location__floor__building",
                (
                    "location__floor__"
                    "building__site"
                ),
            )
            .filter(
                organization=(
                    self.request.user.organization
                ),
            )
        )

        action = getattr(
            self,
            "action",
            "",
        )

        archived_read_actions = {
            "retrieve",
            "audit",
            "pending_deletion",
            "qr_code",
            "incidents",
        }

        can_read_archived = (
            self.request.user.role
            in {
                User.Role.ADMIN,
                User.Role.MANAGER,
            }
            and action
            in archived_read_actions
        )

        if not can_read_archived:
            queryset = queryset.filter(
                is_active=True
            )

        search = (
            self.request
            .query_params
            .get("search")
        )

        status_filter = (
            self.request
            .query_params
            .get("status")
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

        if search:
            queryset = queryset.filter(
                Q(
                    code__icontains=search
                )
                |
                Q(
                    name__icontains=search
                )
                |
                Q(
                    brand__icontains=search
                )
                |
                Q(
                    model_name__icontains=search
                )
                |
                Q(
                    serial_number__icontains=search
                )
            )

        if status_filter:
            queryset = queryset.filter(
                status=status_filter
            )

        if category:
            queryset = queryset.filter(
                category_id=category
            )

        if site:
            queryset = queryset.filter(
                location__floor__building__site_id=site
            )

        return queryset

    def perform_create(
        self,
        serializer,
    ):
        serializer.save(
            organization=(
                self.request.user.organization
            ),
            is_active=True,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="update-with-justification",
    )
    def update_with_justification(
        self,
        request,
        pk=None,
    ):
        equipment = (
            self.get_object()
        )

        justification = (
            request.data
            .get(
                "justification",
                "",
            )
            .strip()
        )

        if len(justification) < 5:
            return Response(
                {
                    "justification": [
                        (
                            "Un justificatif d'au moins "
                            "5 caractères est obligatoire."
                        )
                    ]
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        before = (
            equipment_snapshot(
                equipment
            )
        )

        data = request.data.copy()

        if "justification" in data:
            data.pop(
                "justification"
            )

        remove_image = (
            str(
                request.data.get(
                    "remove_image",
                    ""
                )
            ).lower()
            in {
                "1",
                "true",
                "yes",
            }
        )

        if "remove_image" in data:
            data.pop(
                "remove_image"
            )

        serializer = (
            self.get_serializer(
                equipment,
                data=data,
                partial=True,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        with transaction.atomic():
            updated = serializer.save()

            if remove_image:
                if updated.image:
                    updated.image.delete(
                        save=False
                    )

                updated.image = None

                updated.save(
                    update_fields=[
                        "image",
                        "updated_at",
                    ]
                )

            updated.refresh_from_db()

            after = (
                equipment_snapshot(
                    updated
                )
            )

            EquipmentAuditLog.objects.create(
                organization=(
                    request.user.organization
                ),
                equipment=updated,
                action=(
                    EquipmentAuditLog
                    .Action
                    .UPDATE
                ),
                justification=(
                    justification
                ),
                performed_by=(
                    request.user
                ),
                before_data=before,
                after_data=after,
            )

        return Response(
            self.get_serializer(
                updated
            ).data
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="request-deletion",
    )
    def request_deletion(
        self,
        request,
        pk=None,
    ):
        equipment = (
            self.get_object()
        )

        if request.user.role != User.Role.MANAGER:
            return Response(
                {
                    "detail": (
                        "Seul un responsable peut "
                        "demander la suppression "
                        "d'un équipement. "
                        "L'administrateur valide "
                        "ou refuse les demandes."
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                ),
            )

        justification = (
            request.data
            .get(
                "justification",
                "",
            )
            .strip()
        )

        if len(justification) < 5:
            return Response(
                {
                    "justification": [
                        (
                            "Un justificatif d'au moins "
                            "5 caractères est obligatoire."
                        )
                    ]
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        existing = (
            EquipmentDeletionRequest.objects
            .filter(
                equipment=equipment,
                status=(
                    EquipmentDeletionRequest
                    .Status
                    .PENDING
                ),
            )
            .first()
        )

        if existing:
            return Response(
                EquipmentDeletionRequestSerializer(
                    existing,
                    context={
                        "request": request
                    },
                ).data,
                status=(
                    status.HTTP_200_OK
                ),
            )

        with transaction.atomic():
            deletion_request = (
                EquipmentDeletionRequest.objects
                .create(
                    organization=(
                        request.user.organization
                    ),
                    equipment=equipment,
                    requested_by=(
                        request.user
                    ),
                    justification=(
                        justification
                    ),
                )
            )

            EquipmentAuditLog.objects.create(
                organization=(
                    request.user.organization
                ),
                equipment=equipment,
                action=(
                    EquipmentAuditLog
                    .Action
                    .DELETE_REQUESTED
                ),
                justification=(
                    justification
                ),
                performed_by=(
                    request.user
                ),
                before_data=(
                    equipment_snapshot(
                        equipment
                    )
                ),
                after_data={
                    "deletion_request_status": (
                        "PENDING"
                    )
                },
            )

            notify_roles(
                organization=(
                    request.user.organization
                ),
                roles=[
                    User.Role.ADMIN,
                ],
                notification_type=(
                    "EQUIPMENT_DELETION_REQUESTED"
                ),
                title=(
                    "Demande de suppression"
                ),
                message=(
                    f"{request.user.full_name} demande "
                    f"la suppression de "
                    f"{equipment.code} - "
                    f"{equipment.name}."
                ),
                exclude_user_id=(
                    request.user.id
                ),
            )

        return Response(
            EquipmentDeletionRequestSerializer(
                deletion_request,
                context={
                    "request": request
                },
            ).data,
            status=(
                status.HTTP_201_CREATED
            ),
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="audit",
    )
    def audit(
        self,
        request,
        pk=None,
    ):
        equipment = (
            self.get_object()
        )

        logs = (
            equipment.audit_logs
            .select_related(
                "performed_by"
            )
            .all()
        )

        return Response(
            EquipmentAuditLogSerializer(
                logs,
                many=True,
            ).data
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="pending-deletion",
    )
    def pending_deletion(
        self,
        request,
        pk=None,
    ):
        equipment = (
            self.get_object()
        )

        deletion_request = (
            equipment.deletion_requests
            .filter(
                status=(
                    EquipmentDeletionRequest
                    .Status
                    .PENDING
                )
            )
            .select_related(
                "requested_by",
                "reviewed_by",
            )
            .first()
        )

        if not deletion_request:
            return Response(
                {
                    "pending": False,
                    "request": None,
                }
            )

        return Response(
            {
                "pending": True,
                "request": (
                    EquipmentDeletionRequestSerializer(
                        deletion_request,
                        context={
                            "request": request
                        },
                    ).data
                ),
            }
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="qr",
    )
    def qr_code(
        self,
        request,
        pk=None,
    ):
        equipment = (
            self.get_object()
        )

        target = (
            f"{settings.FRONTEND_URL}"
            f"/equipment/scan/"
            f"{equipment.qr_token}"
        )

        image = qrcode.make(
            target
        )

        buffer = BytesIO()

        image.save(
            buffer,
            format="PNG",
        )

        response = HttpResponse(
            buffer.getvalue(),
            content_type="image/png",
        )

        response[
            "Content-Disposition"
        ] = (
            f'inline; filename="'
            f'{equipment.code}-qr.png"'
        )

        return response

    @action(
        detail=True,
        methods=["get"],
        url_path="incidents",
    )
    def incidents(
        self,
        request,
        pk=None,
    ):
        equipment = (
            self.get_object()
        )

        incidents = (
            equipment.incidents
            .select_related(
                "category",
                "location",
                "location__floor",
                "location__floor__building",
                (
                    "location__floor__"
                    "building__site"
                ),
                "reported_by",
                "equipment",
            )
            .prefetch_related(
                "media"
            )
            .order_by(
                "-created_at"
            )
        )

        return Response(
            IncidentListSerializer(
                incidents,
                many=True,
                context={
                    "request": request
                },
            ).data
        )


class EquipmentDeletionRequestViewSet(
    viewsets.ReadOnlyModelViewSet
):
    serializer_class = (
        EquipmentDeletionRequestSerializer
    )

    permission_classes = [
        IsAuthenticated
    ]

    def get_queryset(
        self,
    ):
        user = self.request.user

        queryset = (
            EquipmentDeletionRequest.objects
            .select_related(
                "equipment",
                "requested_by",
                "reviewed_by",
            )
            .filter(
                organization=(
                    user.organization
                )
            )
        )

        if user.role == User.Role.ADMIN:
            return queryset

        if user.role == User.Role.MANAGER:
            return queryset.filter(
                requested_by=user
            )

        return queryset.none()

    def list(
        self,
        request,
        *args,
        **kwargs,
    ):
        if request.user.role not in {
            User.Role.ADMIN,
            User.Role.MANAGER,
        }:
            return Response(
                {
                    "detail": (
                        "Accès non autorisé."
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                ),
            )

        return super().list(
            request,
            *args,
            **kwargs,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="approve",
    )
    def approve(
        self,
        request,
        pk=None,
    ):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {
                    "detail": (
                        "Seul un administrateur peut "
                        "valider une suppression."
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                ),
            )

        deletion_request = (
            self.get_object()
        )

        if (
            deletion_request.status
            != EquipmentDeletionRequest
            .Status
            .PENDING
        ):
            return Response(
                {
                    "detail": (
                        "Cette demande a déjà "
                        "été traitée."
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        review_note = (
            request.data
            .get(
                "review_note",
                "",
            )
            .strip()
        )

        equipment = (
            deletion_request.equipment
        )

        before = (
            equipment_snapshot(
                equipment
            )
        )

        with transaction.atomic():
            equipment.is_active = False

            equipment.save(
                update_fields=[
                    "is_active",
                    "updated_at",
                ]
            )

            deletion_request.status = (
                EquipmentDeletionRequest
                .Status
                .APPROVED
            )

            deletion_request.reviewed_by = (
                request.user
            )

            deletion_request.review_note = (
                review_note
            )

            deletion_request.reviewed_at = (
                timezone.now()
            )

            deletion_request.save(
                update_fields=[
                    "status",
                    "reviewed_by",
                    "review_note",
                    "reviewed_at",
                ]
            )

            EquipmentAuditLog.objects.create(
                organization=(
                    request.user.organization
                ),
                equipment=equipment,
                action=(
                    EquipmentAuditLog
                    .Action
                    .DELETE_APPROVED
                ),
                justification=(
                    deletion_request
                    .justification
                ),
                performed_by=(
                    request.user
                ),
                before_data=before,
                after_data={
                    **equipment_snapshot(
                        equipment
                    ),
                    "requested_by": (
                        deletion_request
                        .requested_by_id
                    ),
                    "request_justification": (
                        deletion_request
                        .justification
                    ),
                    "review_note": (
                        review_note
                    ),
                },
            )

            create_notification(
                recipient=(
                    deletion_request
                    .requested_by
                ),
                notification_type=(
                    "EQUIPMENT_DELETION_APPROVED"
                ),
                title=(
                    "Suppression d'équipement validée"
                ),
                message=(
                    f"La suppression de "
                    f"{equipment.code} - "
                    f"{equipment.name} "
                    f"a été validée."
                ),
            )

        return Response(
            EquipmentDeletionRequestSerializer(
                deletion_request,
                context={
                    "request": request
                },
            ).data
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="reject",
    )
    def reject(
        self,
        request,
        pk=None,
    ):
        if request.user.role != User.Role.ADMIN:
            return Response(
                {
                    "detail": (
                        "Seul un administrateur peut "
                        "refuser une suppression."
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                ),
            )

        deletion_request = (
            self.get_object()
        )

        if (
            deletion_request.status
            != EquipmentDeletionRequest
            .Status
            .PENDING
        ):
            return Response(
                {
                    "detail": (
                        "Cette demande a déjà "
                        "été traitée."
                    )
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        review_note = (
            request.data
            .get(
                "review_note",
                "",
            )
            .strip()
        )

        if len(review_note) < 3:
            return Response(
                {
                    "review_note": [
                        (
                            "Indiquez la raison "
                            "du refus."
                        )
                    ]
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                ),
            )

        deletion_request.status = (
            EquipmentDeletionRequest
            .Status
            .REJECTED
        )

        deletion_request.reviewed_by = (
            request.user
        )

        deletion_request.review_note = (
            review_note
        )

        deletion_request.reviewed_at = (
            timezone.now()
        )

        deletion_request.save(
            update_fields=[
                "status",
                "reviewed_by",
                "review_note",
                "reviewed_at",
            ]
        )

        EquipmentAuditLog.objects.create(
            organization=(
                request.user.organization
            ),
            equipment=(
                deletion_request.equipment
            ),
            action=(
                EquipmentAuditLog
                .Action
                .DELETE_REJECTED
            ),
            justification=(
                deletion_request
                .justification
            ),
            performed_by=(
                request.user
            ),
            before_data={
                "request_status": (
                    "PENDING"
                ),
            },
            after_data={
                "request_status": (
                    "REJECTED"
                ),
                "review_note": (
                    review_note
                ),
            },
        )

        create_notification(
            recipient=(
                deletion_request
                .requested_by
            ),
            notification_type=(
                "EQUIPMENT_DELETION_REJECTED"
            ),
            title=(
                "Suppression d'équipement refusée"
            ),
            message=(
                f"La suppression de "
                f"{deletion_request.equipment.code} - "
                f"{deletion_request.equipment.name} "
                f"a été refusée."
                + (
                    f" Motif : {review_note}"
                    if review_note
                    else ""
                )
            ),
        )

        return Response(
            EquipmentDeletionRequestSerializer(
                deletion_request,
                context={
                    "request": request
                },
            ).data
        )


class EquipmentArchivesView(
    APIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
    ):
        if request.user.role not in {
            User.Role.ADMIN,
            User.Role.MANAGER,
        }:
            return Response(
                {
                    "detail": (
                        "Accès non autorisé."
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                ),
            )

        equipment_list = (
            Equipment.objects
            .select_related(
                "category",
                "location",
                "location__floor",
                "location__floor__building",
                (
                    "location__floor__"
                    "building__site"
                ),
            )
            .filter(
                organization=(
                    request.user.organization
                ),
                is_active=False,
            )
            .order_by(
                "-updated_at"
            )
        )

        records = []

        for equipment in equipment_list:
            deletion_request = (
                equipment.deletion_requests
                .filter(
                    status=(
                        EquipmentDeletionRequest
                        .Status
                        .APPROVED
                    )
                )
                .select_related(
                    "requested_by",
                    "reviewed_by",
                )
                .order_by(
                    "-reviewed_at",
                    "-requested_at",
                )
                .first()
            )

            records.append(
                {
                    "equipment": (
                        EquipmentSerializer(
                            equipment,
                            context={
                                "request": request
                            },
                        ).data
                    ),
                    "deletion": (
                        EquipmentDeletionRequestSerializer(
                            deletion_request,
                            context={
                                "request": request
                            },
                        ).data
                        if deletion_request
                        else None
                    ),
                }
            )

        return Response(
            records
        )


class EquipmentPrintContextView(
    APIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
    ):
        if request.user.role not in {
            User.Role.ADMIN,
            User.Role.MANAGER,
        }:
            return Response(
                {
                    "detail": (
                        "Accès non autorisé."
                    )
                },
                status=(
                    status.HTTP_403_FORBIDDEN
                ),
            )

        organization = (
            request.user.organization
        )

        return Response(
            {
                "organization_name": (
                    organization.name
                ),
                "organization_logo": (
                    request.build_absolute_uri(
                        organization.logo.url
                    )
                    if organization.logo
                    else ""
                ),
            }
        )


class EquipmentResolveView(
    APIView
):
    permission_classes = [
        IsAuthenticated
    ]

    def get(
        self,
        request,
        token,
    ):
        try:
            equipment = (
                Equipment.objects
                .select_related(
                    "category",
                    "location",
                    "location__floor",
                    "location__floor__building",
                    (
                        "location__floor__"
                        "building__site"
                    ),
                )
                .get(
                    organization=(
                        request.user.organization
                    ),
                    qr_token=token,
                    is_active=True,
                )
            )

        except Equipment.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "Équipement introuvable."
                    )
                },
                status=(
                    status.HTTP_404_NOT_FOUND
                ),
            )

        return Response(
            EquipmentSerializer(
                equipment,
                context={
                    "request": request
                },
            ).data
        )
