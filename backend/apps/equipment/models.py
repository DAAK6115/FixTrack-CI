import uuid

from django.db import models


class EquipmentCategory(models.Model):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="equipment_categories",
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
                name="unique_equipment_category_organization",
            ),
        ]

    def __str__(self):
        return self.name


class Equipment(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Actif"
        MAINTENANCE = "MAINTENANCE", "En maintenance"
        OUT_OF_SERVICE = "OUT_OF_SERVICE", "Hors service"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="equipment",
    )
    category = models.ForeignKey(
        EquipmentCategory,
        on_delete=models.PROTECT,
        related_name="equipment",
    )
    location = models.ForeignKey(
        "locations.Location",
        on_delete=models.PROTECT,
        related_name="equipment",
    )
    code = models.CharField(max_length=80)
    name = models.CharField(max_length=180)
    brand = models.CharField(max_length=120, blank=True)
    model_name = models.CharField(max_length=120, blank=True)
    serial_number = models.CharField(max_length=160, blank=True)

    image = models.ImageField(
        upload_to="equipment/%Y/%m/",
        null=True,
        blank=True,
    )

    installation_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    qr_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        db_index=True,
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "code"],
                name="unique_equipment_code_organization",
            ),
        ]
        indexes = [
            models.Index(fields=["organization", "status"]),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"



class EquipmentAuditLog(models.Model):
    class Action(models.TextChoices):
        UPDATE = (
            "UPDATE",
            "Modification",
        )

        DELETE_REQUESTED = (
            "DELETE_REQUESTED",
            "Demande de suppression",
        )

        DELETE_APPROVED = (
            "DELETE_APPROVED",
            "Suppression validée",
        )

        DELETE_REJECTED = (
            "DELETE_REJECTED",
            "Suppression refusée",
        )

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="equipment_audit_logs",
    )

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name="audit_logs",
    )

    action = models.CharField(
        max_length=20,
        choices=Action.choices,
        db_index=True,
    )

    justification = models.TextField()

    performed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="equipment_audit_actions",
    )

    before_data = models.JSONField(
        default=dict,
        blank=True,
    )

    after_data = models.JSONField(
        default=dict,
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
                    "organization",
                    "equipment",
                    "created_at",
                ]
            ),
        ]

    def __str__(self):
        return (
            f"{self.equipment.code} - "
            f"{self.action}"
        )



class EquipmentDeletionRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = (
            "PENDING",
            "En attente",
        )

        APPROVED = (
            "APPROVED",
            "Validée",
        )

        REJECTED = (
            "REJECTED",
            "Refusée",
        )

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="equipment_deletion_requests",
    )

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name="deletion_requests",
    )

    requested_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="requested_equipment_deletions",
    )

    justification = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )

    reviewed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="reviewed_equipment_deletions",
        null=True,
        blank=True,
    )

    review_note = models.TextField(
        blank=True
    )

    requested_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        ordering = [
            "-requested_at"
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "equipment",
                ],
                condition=models.Q(
                    status="PENDING"
                ),
                name=(
                    "unique_pending_equipment_deletion"
                ),
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "organization",
                    "status",
                    "requested_at",
                ]
            ),
        ]

    def __str__(self):
        return (
            f"{self.equipment.code} - "
            f"{self.status}"
        )
