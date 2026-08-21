from rest_framework.permissions import (
    BasePermission,
    SAFE_METHODS,
)

from apps.accounts.models import User
from .models import Incident


class IncidentAccessPermission(
    BasePermission
):
    def has_permission(
        self,
        request,
        view,
    ):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.organization_id
        )

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        user = request.user

        if (
            obj.organization_id
            != user.organization_id
        ):
            return False

        if request.method in SAFE_METHODS:
            if user.role in {
                User.Role.ADMIN,
                User.Role.MANAGER,
                User.Role.TECHNICIAN,
            }:
                return True

            return (
                obj.reported_by_id
                == user.id
            )

        if user.role in {
            User.Role.ADMIN,
            User.Role.MANAGER,
        }:
            return True

        if (
            obj.reported_by_id
            == user.id
            and obj.status
            == Incident.Status.REPORTED
        ):
            return True

        return False