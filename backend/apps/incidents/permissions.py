from rest_framework.permissions import (
    BasePermission,
    SAFE_METHODS,
)

from apps.accounts.models import User
from .models import Incident


class IncidentAccessPermission(
    BasePermission
):
    TECHNICIAN_WORKFLOW_ACTIONS = {
        "start_action",
        "hold_action",
        "resume_action",
        "resolve_action",
    }

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

        # Lecture
        if request.method in SAFE_METHODS:
            if user.role in {
                User.Role.ADMIN,
                User.Role.MANAGER,
            }:
                return True

            if user.role == User.Role.TECHNICIAN:
                return (
                    obj.reported_by_id
                    == user.id
                    or obj.assignments.filter(
                        technician=user,
                        is_active=True,
                    ).exists()
                )

            return (
                obj.reported_by_id
                == user.id
            )

        # Les responsables peuvent exécuter
        # les actions métier autorisées par
        # les services du workflow.
        if user.role in {
            User.Role.ADMIN,
            User.Role.MANAGER,
        }:
            return True

        # Le technicien assigné doit pouvoir
        # piloter lui-même son intervention.
        #
        # On limite cette autorisation aux
        # actions de workflow techniques.
        # Les services.py vérifient ensuite
        # l'état exact de l'incident.
        if (
            user.role
            == User.Role.TECHNICIAN
            and getattr(
                view,
                "action",
                None,
            )
            in self.TECHNICIAN_WORKFLOW_ACTIONS
        ):
            return obj.assignments.filter(
                technician=user,
                is_active=True,
            ).exists()

        # Le demandeur peut uniquement
        # modifier son incident tant qu'il
        # est encore au statut REPORTED.
        if (
            obj.reported_by_id
            == user.id
            and obj.status
            == Incident.Status.REPORTED
        ):
            return True

        # Fermeture d'un incident résolu :
        # le service close_incident vérifie
        # que l'utilisateur est le demandeur.
        if (
            getattr(
                view,
                "action",
                None,
            )
            == "close_action"
            and obj.reported_by_id
            == user.id
            and obj.status
            == Incident.Status.RESOLVED
        ):
            return True

        return False
