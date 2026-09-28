from pathlib import Path
import uuid

from django.conf import settings
from django.db import models
from django.db.models import Q


def incident_media_upload_path(instance, filename):
    extension = Path(filename).suffix.lower()
    generated_name = f"{uuid.uuid4().hex}{extension}"
    year = instance.incident.created_at.year
    month = f"{instance.incident.created_at.month:02d}"
    return f"incidents/{year}/{month}/{generated_name}"


class IncidentCategory(models.Model):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="incident_categories",
    )
    name = models.CharField(max_length=120)
    icon = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "name"],
                name="unique_incident_category_organization",
            ),
        ]

    def __str__(self):
        return self.name


class Incident(models.Model):
    class Priority(models.TextChoices):
        LOW = "LOW", "Faible"
        NORMAL = "NORMAL", "Normale"
        HIGH = "HIGH", "Haute"
        CRITICAL = "CRITICAL", "Critique"

    class Status(models.TextChoices):
        REPORTED = "REPORTED", "Signalé"
        VALIDATED = "VALIDATED", "Validé"
        ASSIGNED = "ASSIGNED", "Assigné"
        IN_PROGRESS = "IN_PROGRESS", "En cours"
        ON_HOLD = "ON_HOLD", "En attente"
        RESOLVED = "RESOLVED", "Résolu"
        CLOSED = "CLOSED", "Fermé"
        REJECTED = "REJECTED", "Rejeté"
        CANCELLED = "CANCELLED", "Annulé"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="incidents",
    )
    reference = models.CharField(max_length=30, unique=True, db_index=True)
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reported_incidents",
    )
    category = models.ForeignKey(
        IncidentCategory,
        on_delete=models.PROTECT,
        related_name="incidents",
    )
    location = models.ForeignKey(
        "locations.Location",
        on_delete=models.PROTECT,
        related_name="incidents",
    )

    equipment = models.ForeignKey(
        "equipment.Equipment",
        on_delete=models.PROTECT,
        related_name="incidents",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=180)
    description = models.TextField()
    requested_priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.NORMAL,
    )
    validated_priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.REPORTED,
        db_index=True,
    )
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
    )
    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
    )
    reported_at = models.DateTimeField(auto_now_add=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["organization", "status"]),
            models.Index(fields=["organization", "created_at"]),
        ]

    def __str__(self):
        return f"{self.reference} - {self.title}"


class IncidentMedia(models.Model):
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="media",
    )
    file = models.ImageField(upload_to=incident_media_upload_path)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="incident_media_uploads",
    )
    caption = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Media {self.id} - {self.incident.reference}"


class IncidentStatusHistory(models.Model):
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="status_history",
    )
    previous_status = models.CharField(
        max_length=30,
        choices=Incident.Status.choices,
        null=True,
        blank=True,
    )
    new_status = models.CharField(
        max_length=30,
        choices=Incident.Status.choices,
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="incident_status_changes",
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.incident.reference} → {self.new_status}"


class IncidentAssignment(models.Model):
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="incident_assignments",
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="incident_assignments_created",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    unassigned_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["-assigned_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["incident"],
                condition=Q(is_active=True),
                name="unique_active_incident_assignment",
            )
        ]

    def __str__(self):
        return f"{self.incident.reference} → {self.technician.full_name}"


class Intervention(models.Model):
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="interventions",
    )
    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="interventions",
    )
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    resolution = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return (
            f"Intervention {self.incident.reference} "
            f"- {self.technician.full_name}"
        )
