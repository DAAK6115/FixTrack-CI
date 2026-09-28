from django.contrib import admin

from .models import Equipment, EquipmentCategory


@admin.register(EquipmentCategory)
class EquipmentCategoryAdmin(admin.ModelAdmin):
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


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
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
