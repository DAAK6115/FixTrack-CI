from django.db import transaction
from django.utils import timezone

from rest_framework import serializers

from apps.accounts.models import User
from apps.notifications.models import Notification
from apps.notifications.services import (
    notify_roles,
)
from apps.organizations.models import Organization

from .models import (
    Incident,
    IncidentAssignment,
    IncidentCategory,
    IncidentMedia,
    IncidentStatusHistory,
    Intervention,
)


MAX_IMAGES = 5
MAX_IMAGE_SIZE = 5 * 1024 * 1024


class IncidentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentCategory
        fields = [
            "id",
            "name",
            "icon",
            "description",
            "is_active",
        ]
        read_only_fields = ["id"]


class IncidentMediaSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = IncidentMedia
        fields = [
            "id",
            "url",
            "caption",
            "created_at",
        ]

    def get_url(self, obj):
        request = self.context.get("request")

        if not obj.file:
            return None

        url = obj.file.url

        if request:
            return request.build_absolute_uri(url)

        return url


class IncidentStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(
        source="changed_by.full_name",
        read_only=True,
    )
    new_status_label = serializers.CharField(
        source="get_new_status_display",
        read_only=True,
    )
    previous_status_label = serializers.SerializerMethodField()

    class Meta:
        model = IncidentStatusHistory
        fields = [
            "id",
            "previous_status",
            "previous_status_label",
            "new_status",
            "new_status_label",
            "changed_by_name",
            "comment",
            "created_at",
        ]

    def get_previous_status_label(self, obj):
        if not obj.previous_status:
            return None

        return dict(
            Incident.Status.choices
        ).get(obj.previous_status)


class IncidentAssignmentSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(
        source="technician.full_name",
        read_only=True,
    )
    technician_email = serializers.EmailField(
        source="technician.email",
        read_only=True,
    )
    assigned_by_name = serializers.CharField(
        source="assigned_by.full_name",
        read_only=True,
    )

    class Meta:
        model = IncidentAssignment
        fields = [
            "id",
            "technician",
            "technician_name",
            "technician_email",
            "assigned_by_name",
            "assigned_at",
            "unassigned_at",
            "is_active",
        ]


class InterventionSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(
        source="technician.full_name",
        read_only=True,
    )

    class Meta:
        model = Intervention
        fields = [
            "id",
            "technician",
            "technician_name",
            "started_at",
            "ended_at",
            "notes",
            "resolution",
            "created_at",
            "updated_at",
        ]


class IncidentListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )
    location_name = serializers.CharField(
        source="location.name",
        read_only=True,
    )
    building_name = serializers.CharField(
        source="location.floor.building.name",
        read_only=True,
    )
    site_name = serializers.CharField(
        source="location.floor.building.site.name",
        read_only=True,
    )
    reported_by_name = serializers.CharField(
        source="reported_by.full_name",
        read_only=True,
    )
    status_label = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    requested_priority_label = serializers.CharField(
        source="get_requested_priority_display",
        read_only=True,
    )
    cover_image = serializers.SerializerMethodField()

    equipment_name = serializers.CharField(
        source="equipment.name",
        read_only=True,
        allow_null=True,
    )

    equipment_code = serializers.CharField(
        source="equipment.code",
        read_only=True,
        allow_null=True,
    )

    assigned_technician_id = serializers.SerializerMethodField()
    assigned_technician_name = serializers.SerializerMethodField()

    class Meta:
        model = Incident
        fields = [
            "id",
            "reference",
            "title",
            "category",
            "category_name",
            "location",
            "location_name",
            "building_name",
            "site_name",
            "reported_by_name",
            "requested_priority",
            "requested_priority_label",
            "validated_priority",
            "status",
            "status_label",
            "reported_at",
            "cover_image",
            "equipment",
            "equipment_name",
            "equipment_code",
            "assigned_technician_id",
            "assigned_technician_name",
        ]

    def _active_assignment(self, obj):
        return next(
            (
                assignment
                for assignment in obj.assignments.all()
                if assignment.is_active
            ),
            None,
        )

    def get_cover_image(self, obj):
        media = next(iter(obj.media.all()), None)

        if not media:
            return None

        request = self.context.get("request")
        url = media.file.url

        if request:
            return request.build_absolute_uri(url)

        return url

    def get_assigned_technician_id(self, obj):
        assignment = self._active_assignment(obj)
        return assignment.technician_id if assignment else None

    def get_assigned_technician_name(self, obj):
        assignment = self._active_assignment(obj)
        return assignment.technician.full_name if assignment else None


class IncidentDetailSerializer(serializers.ModelSerializer):
    category_detail = IncidentCategorySerializer(
        source="category",
        read_only=True,
    )
    reported_by = serializers.SerializerMethodField()
    location_detail = serializers.SerializerMethodField()
    equipment_detail = serializers.SerializerMethodField()
    media = IncidentMediaSerializer(many=True, read_only=True)
    status_history = IncidentStatusHistorySerializer(
        many=True,
        read_only=True,
    )
    assignments = IncidentAssignmentSerializer(
        many=True,
        read_only=True,
    )
    interventions = InterventionSerializer(
        many=True,
        read_only=True,
    )
    active_assignment = serializers.SerializerMethodField()
    status_label = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    requested_priority_label = serializers.CharField(
        source="get_requested_priority_display",
        read_only=True,
    )
    validated_priority_label = serializers.SerializerMethodField()

    class Meta:
        model = Incident
        fields = [
            "id",
            "reference",
            "title",
            "description",
            "category",
            "category_detail",
            "location",
            "location_detail",
            "equipment",
            "equipment_detail",
            "reported_by",
            "requested_priority",
            "requested_priority_label",
            "validated_priority",
            "validated_priority_label",
            "status",
            "status_label",
            "latitude",
            "longitude",
            "reported_at",
            "assigned_at",
            "started_at",
            "resolved_at",
            "closed_at",
            "media",
            "status_history",
            "assignments",
            "active_assignment",
            "interventions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "reference",
            "reported_by",
            "validated_priority",
            "status",
            "reported_at",
            "assigned_at",
            "started_at",
            "resolved_at",
            "closed_at",
            "created_at",
            "updated_at",
        ]

    def get_reported_by(self, obj):
        return {
            "id": obj.reported_by.id,
            "name": obj.reported_by.full_name,
            "email": obj.reported_by.email,
        }

    def get_location_detail(self, obj):
        location = obj.location
        floor = location.floor
        building = floor.building
        site = building.site

        return {
            "id": location.id,
            "name": location.name,
            "code": location.code,
            "floor": {
                "id": floor.id,
                "name": floor.name,
                "level": floor.level,
            },
            "building": {
                "id": building.id,
                "name": building.name,
                "code": building.code,
            },
            "site": {
                "id": site.id,
                "name": site.name,
                "address": site.address,
            },
        }

    def get_equipment_detail(self, obj):
        if not obj.equipment:
            return None

        return {
            "id": obj.equipment.id,
            "code": obj.equipment.code,
            "name": obj.equipment.name,
            "status": obj.equipment.status,
        }

    def get_validated_priority_label(self, obj):
        if not obj.validated_priority:
            return None

        return dict(
            Incident.Priority.choices
        ).get(obj.validated_priority)

    def get_active_assignment(self, obj):
        assignment = next(
            (
                assignment
                for assignment in obj.assignments.all()
                if assignment.is_active
            ),
            None,
        )

        if not assignment:
            return None

        return IncidentAssignmentSerializer(assignment).data


class IncidentCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = Incident
        fields = [
            "id",
            "reference",
            "category",
            "location",
            "equipment",
            "title",
            "description",
            "requested_priority",
            "latitude",
            "longitude",
            "images",
        ]
        read_only_fields = [
            "id",
            "reference",
        ]

    def validate_category(self, category):
        request = self.context["request"]

        if category.organization_id != request.user.organization_id:
            raise serializers.ValidationError(
                "Cette catégorie n'appartient pas à votre organisation."
            )

        if not category.is_active:
            raise serializers.ValidationError(
                "Cette catégorie est désactivée."
            )

        return category

    def validate_location(self, location):
        request = self.context["request"]

        organization_id = (
            location.floor.building.site.organization_id
        )

        if organization_id != request.user.organization_id:
            raise serializers.ValidationError(
                "Ce lieu n'appartient pas à votre organisation."
            )

        if not location.is_active:
            raise serializers.ValidationError(
                "Ce lieu est désactivé."
            )

        return location

    def validate_equipment(self, equipment):
        request = self.context["request"]

        if equipment is None:
            return equipment

        if equipment.organization_id != request.user.organization_id:
            raise serializers.ValidationError(
                "Cet équipement n'appartient pas à votre organisation."
            )

        if not equipment.is_active:
            raise serializers.ValidationError(
                "Cet équipement est désactivé."
            )

        return equipment

    def validate(self, attrs):
        equipment = attrs.get("equipment")
        location = attrs.get("location")

        if (
            equipment
            and location
            and equipment.location_id != location.id
        ):
            raise serializers.ValidationError(
                {
                    "location": (
                        "La localisation doit correspondre "
                        "à celle de l'équipement."
                    )
                }
            )

        return attrs

    def validate_images(self, images):
        if len(images) > MAX_IMAGES:
            raise serializers.ValidationError(
                f"Maximum {MAX_IMAGES} images."
            )

        for image in images:
            if image.size > MAX_IMAGE_SIZE:
                raise serializers.ValidationError(
                    f"L'image {image.name} dépasse 5 Mo."
                )

            content_type = getattr(
                image,
                "content_type",
                "",
            )

            if not content_type.startswith("image/"):
                raise serializers.ValidationError(
                    f"{image.name} n'est pas une image valide."
                )

        return images

    @staticmethod
    def generate_reference(organization):
        year = timezone.now().year
        prefix = f"INC-{year}-"

        last_incident = (
            Incident.objects
            .filter(
                organization=organization,
                reference__startswith=prefix,
            )
            .order_by("-reference")
            .first()
        )

        if last_incident:
            try:
                last_number = int(
                    last_incident.reference.split("-")[-1]
                )
            except ValueError:
                last_number = 0
        else:
            last_number = 0

        return f"{prefix}{last_number + 1:06d}"

    def create(self, validated_data):
        request = self.context["request"]
        images = validated_data.pop("images", [])
        organization = request.user.organization

        with transaction.atomic():
            Organization.objects.select_for_update().get(
                pk=organization.pk
            )

            reference = self.generate_reference(organization)

            incident = Incident.objects.create(
                organization=organization,
                reported_by=request.user,
                reference=reference,
                status=Incident.Status.REPORTED,
                **validated_data,
            )

            for image in images:
                IncidentMedia.objects.create(
                    incident=incident,
                    file=image,
                    uploaded_by=request.user,
                )

            IncidentStatusHistory.objects.create(
                incident=incident,
                previous_status=None,
                new_status=Incident.Status.REPORTED,
                changed_by=request.user,
                comment="Incident signalé.",
            )

            notify_roles(
                organization=organization,
                roles=[
                    User.Role.ADMIN,
                    User.Role.MANAGER,
                ],
                notification_type=(
                    Notification.Type.INCIDENT_REPORTED
                ),
                title="Nouvel incident signalé",
                message=(
                    f"{incident.reference} - "
                    f"{incident.title}"
                ),
                incident=incident,
                exclude_user_id=request.user.id,
            )

        return incident


class ValidateIncidentSerializer(serializers.Serializer):
    validated_priority = serializers.ChoiceField(
        choices=Incident.Priority.choices,
        required=False,
    )
    comment = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
    )


class AssignIncidentSerializer(serializers.Serializer):
    technician_id = serializers.IntegerField()
    comment = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
    )

    def validate_technician_id(self, value):
        request = self.context["request"]

        technician = (
            User.objects
            .filter(
                pk=value,
                organization=request.user.organization,
                role=User.Role.TECHNICIAN,
                is_active=True,
            )
            .first()
        )

        if not technician:
            raise serializers.ValidationError(
                "Technicien introuvable ou inactif."
            )

        return value


class WorkflowCommentSerializer(serializers.Serializer):
    comment = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
    )


class ResolveIncidentSerializer(serializers.Serializer):
    resolution = serializers.CharField(max_length=5000)
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=5000,
    )
