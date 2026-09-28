from django.contrib import admin

from .models import (
    Equipment,
    EquipmentAuditLog,
    EquipmentCategory,
    EquipmentDeletionRequest,
)


@admin.register(EquipmentCategory)
class EquipmentCategoryAdmin(
    admin.ModelAdmin
):
    list_display = (
        "name",
        "organization",
        "is_active",
    )

    list_filter = (
        "organization",
        "is_active",
    )

    search_fields = (
        "name",
    )


@admin.register(Equipment)
class EquipmentAdmin(
    admin.ModelAdmin
):
    list_display = (
        "code",
        "name",
        "category",
        "organization",
        "location",
        "status",
        "is_active",
    )

    list_filter = (
        "organization",
        "category",
        "status",
        "is_active",
    )

    search_fields = (
        "code",
        "name",
        "brand",
        "model_name",
        "serial_number",
    )

    readonly_fields = (
        "qr_token",
        "created_at",
        "updated_at",
    )


@admin.register(EquipmentAuditLog)
class EquipmentAuditLogAdmin(
    admin.ModelAdmin
):
    list_display = (
        "equipment",
        "action",
        "performed_by",
        "created_at",
    )

    list_filter = (
        "organization",
        "action",
        "created_at",
    )

    search_fields = (
        "equipment__code",
        "equipment__name",
        "justification",
        "performed_by__email",
    )

    readonly_fields = (
        "organization",
        "equipment",
        "action",
        "justification",
        "performed_by",
        "before_data",
        "after_data",
        "created_at",
    )

    def has_add_permission(
        self,
        request,
    ):
        return False



@admin.register(EquipmentDeletionRequest)
class EquipmentDeletionRequestAdmin(
    admin.ModelAdmin
):
    list_display = (
        "equipment",
        "status",
        "requested_by",
        "requested_at",
        "reviewed_by",
        "reviewed_at",
    )

    list_filter = (
        "organization",
        "status",
        "requested_at",
        "reviewed_at",
    )

    search_fields = (
        "equipment__code",
        "equipment__name",
        "justification",
        "requested_by__email",
        "reviewed_by__email",
    )

    readonly_fields = (
        "organization",
        "equipment",
        "requested_by",
        "justification",
        "status",
        "reviewed_by",
        "review_note",
        "requested_at",
        "reviewed_at",
    )

    def has_add_permission(
        self,
        request,
    ):
        return False
