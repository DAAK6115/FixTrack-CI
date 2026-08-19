from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = (
        "email",
        "first_name",
        "last_name",
        "role",
        "organization",
        "is_active",
        "is_staff",
    )
    list_filter = ("role", "organization", "is_active", "is_staff")
    search_fields = ("email", "first_name", "last_name", "phone")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Identité", {"fields": ("first_name", "last_name", "phone", "avatar")}),
        ("FixTrack", {"fields": ("organization", "role")}),
        (
            "Permissions Django",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "organization",
                    "role",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )
