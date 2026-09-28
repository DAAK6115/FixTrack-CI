from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        INCIDENT_REPORTED = (
            "INCIDENT_REPORTED",
            "Nouvel incident",
        )

        INCIDENT_ASSIGNED = (
            "INCIDENT_ASSIGNED",
            "Incident assigné",
        )

        INCIDENT_REASSIGNED = (
            "INCIDENT_REASSIGNED",
            "Incident réassigné",
        )

        INTERVENTION_STARTED = (
            "INTERVENTION_STARTED",
            "Intervention démarrée",
        )

        INTERVENTION_ON_HOLD = (
            "INTERVENTION_ON_HOLD",
            "Intervention en pause",
        )

        INTERVENTION_RESUMED = (
            "INTERVENTION_RESUMED",
            "Intervention reprise",
        )

        INCIDENT_RESOLVED = (
            "INCIDENT_RESOLVED",
            "Incident résolu",
        )

        INCIDENT_CLOSED = (
            "INCIDENT_CLOSED",
            "Incident fermé",
        )

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    incident = models.ForeignKey(
        "incidents.Incident",
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
    )

    notification_type = (
        models.CharField(
            max_length=40,
            choices=Type.choices,
            db_index=True,
        )
    )

    title = models.CharField(
        max_length=180
    )

    message = models.TextField()

    is_read = models.BooleanField(
        default=False,
        db_index=True,
    )

    read_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    class Meta:
        ordering = [
            "-created_at"
        ]

        indexes = [
            models.Index(
                fields=[
                    "recipient",
                    "is_read",
                    "created_at",
                ]
            ),
        ]

    def __str__(self):
        return (
            f"{self.recipient.email} "
            f"- {self.title}"
        )
