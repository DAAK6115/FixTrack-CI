from django.contrib import admin

from .models import Building, Floor, Location, Site


@admin.register(Site)
class SiteAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "organization",
        "address",
        "is_active",
    )

    list_filter = (
        "organization",
        "is_active",
    )

    search_fields = (
        "name",
        "address",
    )


@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "site",
        "is_active",
    )

    list_filter = (
        "site",
        "is_active",
    )

    search_fields = (
        "name",
        "code",
    )


@admin.register(Floor)
class FloorAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "level",
        "building",
        "is_active",
    )

    list_filter = (
        "building",
        "is_active",
    )


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "floor",
        "is_active",
    )

    list_filter = (
        "floor",
        "is_active",
    )

    search_fields = (
        "name",
        "code",
    )