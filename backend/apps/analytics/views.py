from collections import Counter
from datetime import timedelta

from django.db.models import Q
from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.accounts.permissions import HasOrganization
from apps.incidents.models import (
    Incident,
    IncidentAssignment,
    Intervention,
)


OPEN_STATUSES = {
    Incident.Status.REPORTED,
    Incident.Status.VALIDATED,
    Incident.Status.ASSIGNED,
    Incident.Status.IN_PROGRESS,
    Incident.Status.ON_HOLD,
}


def minutes_between(start, end):
    if not start or not end:
        return None

    seconds = (end - start).total_seconds()
    return max(round(seconds / 60, 1), 0)


def average(values):
    cleaned = [
        value
        for value in values
        if value is not None
    ]

    if not cleaned:
        return 0

    return round(
        sum(cleaned) / len(cleaned),
        1,
    )


def incident_to_dict(incident):
    return {
        "id": incident.id,
        "reference": incident.reference,
        "title": incident.title,
        "status": incident.status,
        "status_label": (
            incident.get_status_display()
        ),
        "priority": (
            incident.validated_priority
            or incident.requested_priority
        ),
        "priority_label": dict(
            Incident.Priority.choices
        ).get(
            incident.validated_priority
            or incident.requested_priority
        ),
        "category": incident.category.name,
        "site": (
            incident
            .location
            .floor
            .building
            .site
            .name
        ),
        "location": incident.location.name,
        "reported_at": incident.reported_at,
        "resolved_at": incident.resolved_at,
    }


class DashboardAnalyticsView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasOrganization,
    ]

    def get_base_queryset(self, user):
        queryset = (
            Incident.objects
            .select_related(
                "category",
                "location",
                "location__floor",
                "location__floor__building",
                "location__floor__building__site",
                "reported_by",
            )
            .filter(
                organization=user.organization
            )
        )

        if user.role == User.Role.REQUESTER:
            return queryset.filter(
                reported_by=user
            )

        if user.role == User.Role.TECHNICIAN:
            return (
                queryset
                .filter(
                    Q(
                        assignments__technician=user,
                        assignments__is_active=True,
                    )
                    |
                    Q(
                        interventions__technician=user
                    )
                )
                .distinct()
            )

        return queryset

    def get(self, request):
        user = request.user
        queryset = self.get_base_queryset(
            user
        )

        incidents = list(queryset)

        open_incidents = [
            incident
            for incident in incidents
            if incident.status
            in OPEN_STATUSES
        ]

        resolved_incidents = [
            incident
            for incident in incidents
            if incident.status
            in {
                Incident.Status.RESOLVED,
                Incident.Status.CLOSED,
            }
        ]

        closed_incidents = [
            incident
            for incident in incidents
            if incident.status
            == Incident.Status.CLOSED
        ]

        critical_open = [
            incident
            for incident in open_incidents
            if (
                incident.validated_priority
                or incident.requested_priority
            )
            == Incident.Priority.CRITICAL
        ]

        in_progress = [
            incident
            for incident in incidents
            if incident.status
            == Incident.Status.IN_PROGRESS
        ]

        on_hold = [
            incident
            for incident in incidents
            if incident.status
            == Incident.Status.ON_HOLD
        ]

        assigned = [
            incident
            for incident in incidents
            if incident.status
            == Incident.Status.ASSIGNED
        ]

        resolution_minutes = [
            minutes_between(
                incident.reported_at,
                incident.resolved_at,
            )
            for incident in resolved_incidents
            if incident.resolved_at
        ]

        by_status = Counter(
            incident.status
            for incident in incidents
        )

        by_priority = Counter(
            (
                incident.validated_priority
                or incident.requested_priority
            )
            for incident in incidents
        )

        by_category = Counter(
            incident.category.name
            for incident in incidents
        )

        today = timezone.localdate()
        trend = []

        for offset in range(6, -1, -1):
            day = today - timedelta(
                days=offset
            )

            reported_count = sum(
                1
                for incident in incidents
                if timezone.localdate(
                    incident.reported_at
                )
                == day
            )

            resolved_count = sum(
                1
                for incident in incidents
                if incident.resolved_at
                and timezone.localdate(
                    incident.resolved_at
                )
                == day
            )

            trend.append(
                {
                    "date": day.isoformat(),
                    "label": day.strftime(
                        "%d/%m"
                    ),
                    "reported": (
                        reported_count
                    ),
                    "resolved": (
                        resolved_count
                    ),
                }
            )

        status_labels = dict(
            Incident.Status.choices
        )

        priority_labels = dict(
            Incident.Priority.choices
        )

        status_data = [
            {
                "key": key,
                "label": (
                    status_labels.get(
                        key,
                        key,
                    )
                ),
                "count": count,
            }
            for key, count
            in by_status.items()
        ]

        priority_data = [
            {
                "key": key,
                "label": (
                    priority_labels.get(
                        key,
                        key,
                    )
                ),
                "count": count,
            }
            for key, count
            in by_priority.items()
        ]

        category_data = [
            {
                "label": label,
                "count": count,
            }
            for label, count
            in by_category.most_common(8)
        ]

        recent_incidents = [
            incident_to_dict(
                incident
            )
            for incident
            in sorted(
                incidents,
                key=lambda item: (
                    item.reported_at
                ),
                reverse=True,
            )[:6]
        ]

        technician_performance = []

        if user.role in {
            User.Role.ADMIN,
            User.Role.MANAGER,
        }:
            technicians = (
                User.objects
                .filter(
                    organization=(
                        user.organization
                    ),
                    role=(
                        User.Role.TECHNICIAN
                    ),
                    is_active=True,
                )
                .order_by(
                    "first_name",
                    "last_name",
                    "email",
                )
            )

            for technician in technicians:
                active_assignments = (
                    IncidentAssignment.objects
                    .filter(
                        incident__organization=(
                            user.organization
                        ),
                        technician=technician,
                        is_active=True,
                    )
                    .select_related(
                        "incident"
                    )
                )

                active_incidents = [
                    assignment.incident
                    for assignment
                    in active_assignments
                    if assignment.incident.status
                    in OPEN_STATUSES
                ]

                technician_interventions = list(
                    Intervention.objects
                    .filter(
                        incident__organization=(
                            user.organization
                        ),
                        technician=technician,
                    )
                )

                finished = [
                    intervention
                    for intervention
                    in technician_interventions
                    if intervention.ended_at
                ]

                duration_values = [
                    minutes_between(
                        intervention.started_at,
                        intervention.ended_at,
                    )
                    for intervention
                    in finished
                ]

                technician_performance.append(
                    {
                        "id": technician.id,
                        "name": (
                            technician.full_name
                            or technician.email
                        ),
                        "email": (
                            technician.email
                        ),
                        "active_assignments": (
                            len(active_incidents)
                        ),
                        "in_progress": sum(
                            1
                            for incident
                            in active_incidents
                            if incident.status
                            == Incident.Status.IN_PROGRESS
                        ),
                        "on_hold": sum(
                            1
                            for incident
                            in active_incidents
                            if incident.status
                            == Incident.Status.ON_HOLD
                        ),
                        "completed_interventions": (
                            len(finished)
                        ),
                        "avg_intervention_minutes": (
                            average(
                                duration_values
                            )
                        ),
                    }
                )

        own_intervention_minutes = 0

        if user.role == User.Role.TECHNICIAN:
            own_finished = (
                Intervention.objects
                .filter(
                    incident__organization=(
                        user.organization
                    ),
                    technician=user,
                    ended_at__isnull=False,
                )
            )

            own_intervention_minutes = (
                average(
                    [
                        minutes_between(
                            intervention.started_at,
                            intervention.ended_at,
                        )
                        for intervention
                        in own_finished
                    ]
                )
            )

        return Response(
            {
                "role": user.role,

                "summary": {
                    "total": len(incidents),
                    "open": len(
                        open_incidents
                    ),
                    "reported": by_status.get(
                        Incident.Status.REPORTED,
                        0,
                    ),
                    "assigned": len(
                        assigned
                    ),
                    "in_progress": len(
                        in_progress
                    ),
                    "on_hold": len(
                        on_hold
                    ),
                    "resolved": len(
                        resolved_incidents
                    ),
                    "closed": len(
                        closed_incidents
                    ),
                    "critical_open": len(
                        critical_open
                    ),
                    "avg_resolution_minutes": (
                        average(
                            resolution_minutes
                        )
                    ),
                    "avg_intervention_minutes": (
                        own_intervention_minutes
                    ),
                },

                "by_status": status_data,
                "by_priority": priority_data,
                "by_category": category_data,
                "trend": trend,

                "recent_incidents": (
                    recent_incidents
                ),

                "technician_performance": (
                    technician_performance
                ),
            }
        )
