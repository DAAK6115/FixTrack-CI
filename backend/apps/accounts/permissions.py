from rest_framework.permissions import BasePermission
from .models import User

class HasOrganization(BasePermission):
    message = "Votre compte n'est associé à aucune organisation."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.organization_id
        )

class IsOrganizationAdmin(BasePermission):
    message = "Cette action est réservée aux administrateurs."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.organization_id
            and (
                request.user.is_superuser
                or request.user.role == User.Role.ADMIN
            )
        )

class IsOrganizationAdminOrManager(BasePermission):
    message = "Cette action est réservée aux administrateurs et responsables."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.organization_id
            and (
                request.user.is_superuser
                or request.user.role in {
                    User.Role.ADMIN,
                    User.Role.MANAGER,
                }
            )
        )

class IsTechnicianOrHigher(BasePermission):
    message = "Permission insuffisante."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.organization_id
            and (
                request.user.is_superuser
                or request.user.role in {
                    User.Role.ADMIN,
                    User.Role.MANAGER,
                    User.Role.TECHNICIAN,
                }
            )
        )
