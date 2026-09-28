from django.core.management.base import BaseCommand

from apps.equipment.models import Equipment, EquipmentCategory
from apps.locations.models import Location
from apps.organizations.models import Organization


class Command(BaseCommand):
    help = "Crée des équipements de démonstration FixTrack CI."

    def handle(self, *args, **options):
        organization = (
            Organization.objects
            .filter(is_active=True)
            .first()
        )

        if not organization:
            self.stderr.write(
                self.style.ERROR("Aucune organisation active.")
            )
            return

        locations = list(
            Location.objects.filter(
                floor__building__site__organization=organization,
                is_active=True,
            )[:4]
        )

        if not locations:
            self.stderr.write(
                self.style.ERROR(
                    "Aucune localisation. Exécute d'abord seed_demo."
                )
            )
            return

        category_specs = [
            ("Climatisation", "❄️"),
            ("Informatique", "💻"),
            ("Électricité", "⚡"),
            ("Sécurité", "🛡️"),
        ]

        categories = {}

        for name, icon in category_specs:
            category, _ = EquipmentCategory.objects.get_or_create(
                organization=organization,
                name=name,
                defaults={"icon": icon},
            )
            categories[name] = category

        specs = [
            {
                "code": "CLIM-A-001",
                "name": "Climatiseur salle principale",
                "category": categories["Climatisation"],
                "location": locations[0],
                "brand": "LG",
                "model_name": "Dual Inverter",
            },
            {
                "code": "PC-ADM-001",
                "name": "Poste administratif",
                "category": categories["Informatique"],
                "location": locations[min(1, len(locations) - 1)],
                "brand": "HP",
                "model_name": "ProDesk",
            },
            {
                "code": "OND-001",
                "name": "Onduleur principal",
                "category": categories["Électricité"],
                "location": locations[min(2, len(locations) - 1)],
                "brand": "APC",
                "model_name": "Smart-UPS",
            },
        ]

        created_count = 0

        for payload in specs:
            _, created = Equipment.objects.get_or_create(
                organization=organization,
                code=payload["code"],
                defaults=payload,
            )
            created_count += 1 if created else 0

        self.stdout.write(
            self.style.SUCCESS(
                f"{created_count} équipement(s) créé(s)."
            )
        )
