from django.db import transaction
from django.utils import timezone

from rest_framework.exceptions import PermissionDenied

from apps.accounts.models import User

from .models import (
    Incident,
    IncidentAssignment,
    IncidentStatusHistory,
    Intervention,
)


class WorkflowError(Exception):
    pass


def _require_manager(user):
    if user.role not in {
        User.Role.ADMIN,
        User.Role.MANAGER,
    }:
        raise PermissionDenied(
            "Cette action est réservée aux responsables et administrateurs."
        )


def _active_assignment(incident):
    return (
        IncidentAssignment.objects
        .select_related("technician")
        .filter(
            incident=incident,
            is_active=True,
        )
        .first()
    )


def _require_assigned_technician_or_manager(incident, user):
    if user.role in {
        User.Role.ADMIN,
        User.Role.MANAGER,
    }:
        return _active_assignment(incident)

    if user.role != User.Role.TECHNICIAN:
        raise PermissionDenied(
            "Cette action est réservée au technicien assigné."
        )

    assignment = _active_assignment(incident)

    if (
        not assignment
        or assignment.technician_id != user.id
    ):
        raise PermissionDenied(
            "Cet incident ne vous est pas assigné."
        )

    return assignment


def _history(
    incident,
    previous_status,
    new_status,
    user,
    comment="",
):
    IncidentStatusHistory.objects.create(
        incident=incident,
        previous_status=previous_status,
        new_status=new_status,
        changed_by=user,
        comment=comment,
    )


@transaction.atomic
def validate_incident(
    incident_id,
    user,
    validated_priority=None,
    comment="",
):
    _require_manager(user)

    incident = (
        Incident.objects
        .select_for_update()
        .get(pk=incident_id)
    )

    if incident.organization_id != user.organization_id:
        raise PermissionDenied("Incident inaccessible.")

    if incident.status != Incident.Status.REPORTED:
        raise WorkflowError(
            "Seul un incident signalé peut être validé."
        )

    previous = incident.status

    incident.validated_priority = (
        validated_priority
        or incident.requested_priority
    )
    incident.status = Incident.Status.VALIDATED

    incident.save(
        update_fields=[
            "validated_priority",
            "status",
            "updated_at",
        ]
    )

    _history(
        incident,
        previous,
        incident.status,
        user,
        comment or "Incident validé.",
    )

    return incident


@transaction.atomic
def reject_incident(
    incident_id,
    user,
    comment="",
):
    _require_manager(user)

    incident = (
        Incident.objects
        .select_for_update()
        .get(pk=incident_id)
    )

    if incident.organization_id != user.organization_id:
        raise PermissionDenied("Incident inaccessible.")

    if incident.status != Incident.Status.REPORTED:
        raise WorkflowError(
            "Seul un incident signalé peut être rejeté."
        )

    previous = incident.status
    incident.status = Incident.Status.REJECTED

    incident.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )

    _history(
        incident,
        previous,
        incident.status,
        user,
        comment or "Incident rejeté.",
    )

    return incident


@transaction.atomic
def assign_incident(
    incident_id,
    user,
    technician,
    comment="",
):
    _require_manager(user)

    incident = (
        Incident.objects
        .select_for_update()
        .get(pk=incident_id)
    )

    if incident.organization_id != user.organization_id:
        raise PermissionDenied("Incident inaccessible.")

    if incident.status not in {
        Incident.Status.REPORTED,
        Incident.Status.VALIDATED,
        Incident.Status.ASSIGNED,
        Incident.Status.ON_HOLD,
    }:
        raise WorkflowError(
            "Cet incident ne peut pas être assigné dans son état actuel."
        )

    if (
        technician.organization_id
        != incident.organization_id
        or technician.role
        != User.Role.TECHNICIAN
        or not technician.is_active
    ):
        raise WorkflowError(
            "Le technicien sélectionné est invalide."
        )

    previous = incident.status
    now = timezone.now()

    (
        IncidentAssignment.objects
        .filter(
            incident=incident,
            is_active=True,
        )
        .update(
            is_active=False,
            unassigned_at=now,
        )
    )

    IncidentAssignment.objects.create(
        incident=incident,
        technician=technician,
        assigned_by=user,
    )

    incident.status = Incident.Status.ASSIGNED
    incident.assigned_at = now

    incident.save(
        update_fields=[
            "status",
            "assigned_at",
            "updated_at",
        ]
    )

    if previous != Incident.Status.ASSIGNED:
        _history(
            incident,
            previous,
            incident.status,
            user,
            comment
            or f"Incident assigné à {technician.full_name}.",
        )

    return incident


@transaction.atomic
def start_incident(
    incident_id,
    user,
    comment="",
):
    incident = (
        Incident.objects
        .select_for_update()
        .get(pk=incident_id)
    )

    if incident.organization_id != user.organization_id:
        raise PermissionDenied("Incident inaccessible.")

    assignment = _require_assigned_technician_or_manager(
        incident,
        user,
    )

    if not assignment:
        raise WorkflowError(
            "Aucun technicien actif n'est assigné à cet incident."
        )

    if incident.status not in {
        Incident.Status.ASSIGNED,
        Incident.Status.ON_HOLD,
    }:
        raise WorkflowError(
            "Cette intervention ne peut pas être démarrée maintenant."
        )

    previous = incident.status
    now = timezone.now()

    if previous == Incident.Status.ASSIGNED:
        Intervention.objects.create(
            incident=incident,
            technician=assignment.technician,
            started_at=now,
        )

        if not incident.started_at:
            incident.started_at = now

    incident.status = Incident.Status.IN_PROGRESS

    incident.save(
        update_fields=[
            "status",
            "started_at",
            "updated_at",
        ]
    )

    _history(
        incident,
        previous,
        incident.status,
        user,
        comment
        or (
            "Intervention commencée."
            if previous == Incident.Status.ASSIGNED
            else "Intervention reprise."
        ),
    )

    return incident


@transaction.atomic
def hold_incident(
    incident_id,
    user,
    comment="",
):
    incident = (
        Incident.objects
        .select_for_update()
        .get(pk=incident_id)
    )

    if incident.organization_id != user.organization_id:
        raise PermissionDenied("Incident inaccessible.")

    _require_assigned_technician_or_manager(
        incident,
        user,
    )

    if incident.status != Incident.Status.IN_PROGRESS:
        raise WorkflowError(
            "Seule une intervention en cours peut être mise en attente."
        )

    previous = incident.status
    incident.status = Incident.Status.ON_HOLD

    incident.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )

    _history(
        incident,
        previous,
        incident.status,
        user,
        comment or "Intervention mise en attente.",
    )

    return incident


@transaction.atomic
def resolve_incident(
    incident_id,
    user,
    resolution,
    notes="",
):
    incident = (
        Incident.objects
        .select_for_update()
        .get(pk=incident_id)
    )

    if incident.organization_id != user.organization_id:
        raise PermissionDenied("Incident inaccessible.")

    assignment = _require_assigned_technician_or_manager(
        incident,
        user,
    )

    if incident.status != Incident.Status.IN_PROGRESS:
        raise WorkflowError(
            "L'incident doit être en cours avant d'être résolu."
        )

    if not assignment:
        raise WorkflowError(
            "Aucun technicien actif n'est assigné."
        )

    resolution = resolution.strip()

    if not resolution:
        raise WorkflowError(
            "Le compte rendu de résolution est obligatoire."
        )

    intervention = (
        Intervention.objects
        .filter(
            incident=incident,
            ended_at__isnull=True,
        )
        .order_by("-started_at")
        .first()
    )

    if not intervention:
        raise WorkflowError(
            "Aucune intervention active n'a été trouvée."
        )

    previous = incident.status
    now = timezone.now()

    intervention.ended_at = now
    intervention.resolution = resolution
    intervention.notes = notes.strip()

    intervention.save(
        update_fields=[
            "ended_at",
            "resolution",
            "notes",
            "updated_at",
        ]
    )

    incident.status = Incident.Status.RESOLVED
    incident.resolved_at = now

    incident.save(
        update_fields=[
            "status",
            "resolved_at",
            "updated_at",
        ]
    )

    _history(
        incident,
        previous,
        incident.status,
        user,
        f"Incident résolu. {resolution}",
    )

    return incident


@transaction.atomic
def close_incident(
    incident_id,
    user,
    comment="",
):
    incident = (
        Incident.objects
        .select_for_update()
        .get(pk=incident_id)
    )

    if incident.organization_id != user.organization_id:
        raise PermissionDenied("Incident inaccessible.")

    if (
        user.role
        not in {
            User.Role.ADMIN,
            User.Role.MANAGER,
        }
        and incident.reported_by_id != user.id
    ):
        raise PermissionDenied(
            "Vous ne pouvez pas fermer cet incident."
        )

    if incident.status != Incident.Status.RESOLVED:
        raise WorkflowError(
            "Seul un incident résolu peut être fermé."
        )

    previous = incident.status
    now = timezone.now()

    incident.status = Incident.Status.CLOSED
    incident.closed_at = now

    incident.save(
        update_fields=[
            "status",
            "closed_at",
            "updated_at",
        ]
    )

    _history(
        incident,
        previous,
        incident.status,
        user,
        comment
        or "Résolution confirmée et incident fermé.",
    )

    return incident
