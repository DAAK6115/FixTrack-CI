from django.contrib import admin

from .models import (
    Incident,
    IncidentAssignment,
    IncidentCategory,
    IncidentMedia,
    IncidentStatusHistory,
    Intervention,
)


@admin.register(IncidentCategory)
class IncidentCategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "organization",
        "is_active",
    )
    list_filter = (
        "organization",
        "is_active",
    )
    search_fields = ("name",)


class IncidentMediaInline(admin.TabularInline):
    model = IncidentMedia
    extra = 0


class IncidentStatusHistoryInline(admin.TabularInline):
    model = IncidentStatusHistory
    extra = 0
    readonly_fields = (
        "previous_status",
        "new_status",
        "changed_by",
        "comment",
        "created_at",
    )


class IncidentAssignmentInline(admin.TabularInline):
    model = IncidentAssignment
    extra = 0
    readonly_fields = (
        "assigned_at",
        "unassigned_at",
    )


class InterventionInline(admin.TabularInline):
    model = Intervention
    extra = 0
    readonly_fields = (
        "started_at",
        "ended_at",
        "created_at",
        "updated_at",
    )


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = (
        "reference",
        "title",
        "organization",
        "category",
        "status",
        "requested_priority",
        "validated_priority",
        "reported_by",
        "created_at",
    )
    list_filter = (
        "organization",
        "status",
        "requested_priority",
        "validated_priority",
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
        "assigned_at",
        "started_at",
        "resolved_at",
        "closed_at",
        "created_at",
        "updated_at",
    )
    inlines = [
        IncidentMediaInline,
        IncidentAssignmentInline,
        InterventionInline,
        IncidentStatusHistoryInline,
    ]


@admin.register(IncidentAssignment)
class IncidentAssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "incident",
        "technician",
        "assigned_by",
        "assigned_at",
        "is_active",
    )
    list_filter = (
        "is_active",
        "technician",
    )
    search_fields = (
        "incident__reference",
        "technician__email",
    )


@admin.register(Intervention)
class InterventionAdmin(admin.ModelAdmin):
    list_display = (
        "incident",
        "technician",
        "started_at",
        "ended_at",
    )
    list_filter = (
        "technician",
        "started_at",
    )
    search_fields = (
        "incident__reference",
        "technician__email",
        "resolution",
    )
