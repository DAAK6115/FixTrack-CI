from io import BytesIO

import qrcode

from django.conf import settings
from django.db.models import Q
from django.http import HttpResponse

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.incidents.serializers import IncidentListSerializer

from .models import Equipment, EquipmentCategory
from .permissions import EquipmentPermission
from .serializers import (
    EquipmentCategorySerializer,
    EquipmentSerializer,
)


class EquipmentCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = EquipmentCategorySerializer
    permission_classes = [
        IsAuthenticated,
        EquipmentPermission,
    ]

    def get_queryset(self):
        return EquipmentCategory.objects.filter(
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
        return Response(status=status.HTTP_204_NO_CONTENT)


class EquipmentViewSet(viewsets.ModelViewSet):
    serializer_class = EquipmentSerializer
    permission_classes = [
        IsAuthenticated,
        EquipmentPermission,
    ]
    http_method_names = [
        "get",
        "post",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        queryset = (
            Equipment.objects
            .select_related(
                "category",
                "location",
                "location__floor",
                "location__floor__building",
                "location__floor__building__site",
            )
            .filter(
                organization=self.request.user.organization,
                is_active=True,
            )
        )

        search = self.request.query_params.get("search")
        status_filter = self.request.query_params.get("status")
        category = self.request.query_params.get("category")
        site = self.request.query_params.get("site")

        if search:
            queryset = queryset.filter(
                Q(code__icontains=search)
                | Q(name__icontains=search)
                | Q(brand__icontains=search)
                | Q(model_name__icontains=search)
                | Q(serial_number__icontains=search)
            )

        if status_filter:
            queryset = queryset.filter(status=status_filter)

        if category:
            queryset = queryset.filter(category_id=category)

        if site:
            queryset = queryset.filter(
                location__floor__building__site_id=site
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"], url_path="qr")
    def qr_code(self, request, pk=None):
        equipment = self.get_object()

        target = (
            f"{settings.FRONTEND_URL}"
            f"/equipment/scan/{equipment.qr_token}"
        )

        image = qrcode.make(target)
        buffer = BytesIO()
        image.save(buffer, format="PNG")

        response = HttpResponse(
            buffer.getvalue(),
            content_type="image/png",
        )
        response["Content-Disposition"] = (
            f'inline; filename="{equipment.code}-qr.png"'
        )
        return response

    @action(detail=True, methods=["get"], url_path="incidents")
    def incidents(self, request, pk=None):
        equipment = self.get_object()

        incidents = (
            equipment.incidents
            .select_related(
                "category",
                "location",
                "location__floor",
                "location__floor__building",
                "location__floor__building__site",
                "reported_by",
                "equipment",
            )
            .prefetch_related("media")
            .order_by("-created_at")
        )

        return Response(
            IncidentListSerializer(
                incidents,
                many=True,
                context={"request": request},
            ).data
        )


class EquipmentResolveView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, token):
        try:
            equipment = (
                Equipment.objects
                .select_related(
                    "category",
                    "location",
                    "location__floor",
                    "location__floor__building",
                    "location__floor__building__site",
                )
                .get(
                    organization=request.user.organization,
                    qr_token=token,
                    is_active=True,
                )
            )
        except Equipment.DoesNotExist:
            return Response(
                {"detail": "Équipement introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            EquipmentSerializer(
                equipment,
                context={"request": request},
            ).data
        )
