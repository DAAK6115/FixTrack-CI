from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.accounts.models import User


class EquipmentPermission(BasePermission):
    def has_permission(self, request, view):
        if (
            not request.user
            or not request.user.is_authenticated
            or not request.user.organization_id
        ):
            return False

        if request.method in SAFE_METHODS:
            return True

        return request.user.role in {
            User.Role.ADMIN,
            User.Role.MANAGER,
        }

    def has_object_permission(self, request, view, obj):
        if obj.organization_id != request.user.organization_id:
            return False

        if request.method in SAFE_METHODS:
            return True

        return request.user.role in {
            User.Role.ADMIN,
            User.Role.MANAGER,
        }
