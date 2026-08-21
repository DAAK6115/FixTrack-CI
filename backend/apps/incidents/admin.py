from django.contrib import admin

from .models import (
    Incident,
    IncidentCategory,
    IncidentMedia,
    IncidentStatusHistory,
)


@admin.register(IncidentCategory)
class IncidentCategoryAdmin(
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


class IncidentMediaInline(
    admin.TabularInline
):
    model = IncidentMedia
    extra = 0


class IncidentStatusHistoryInline(
    admin.TabularInline
):
    model = IncidentStatusHistory
    extra = 0
    readonly_fields = (
        "previous_status",
        "new_status",
        "changed_by",
        "comment",
        "created_at",
    )


@admin.register(Incident)
class IncidentAdmin(
    admin.ModelAdmin
):
    list_display = (
        "reference",
        "title",
        "organization",
        "category",
        "status",
        "requested_priority",
        "reported_by",
        "created_at",
    )

    list_filter = (
        "organization",
        "status",
        "requested_priority",
        "category",
    )

    search_fields = (
        "reference",
        "title",
        "description",
        "reported_by__email",
    )

    readonly_fields = (
        "reference",
        "reported_at",
        "created_at",
        "updated_at",
    )

    inlines = [
        IncidentMediaInline,
        IncidentStatusHistoryInline,
    ]