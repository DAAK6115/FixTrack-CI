from django.core.management.base import BaseCommand

from apps.accounts.models import User
from apps.locations.models import (
    Building,
    Floor,
    Location,
    Site,
)
from apps.organizations.models import Organization


class Command(BaseCommand):
    help = (
        "Crée les données de démonstration "
        "de FixTrack CI."
    )

    def handle(self, *args, **options):
        organization, _ = (
            Organization.objects.get_or_create(
                slug="universite-horizon",
                defaults={
                    "name": "Université Horizon",
                    "type": Organization.Type.SCHOOL,
                    "email": "maintenance@horizon.ci",
                    "phone": "+225 05 00 00 00 00",
                    "address": (
                        "Cocody, Abidjan, Côte d'Ivoire"
                    ),
                },
            )
        )

        demo_users = [
            {
                "email": "admin@fixtrack.ci",
                "first_name": "Aminata",
                "last_name": "Koné",
                "role": User.Role.ADMIN,
            },
            {
                "email": "manager@fixtrack.ci",
                "first_name": "Jean",
                "last_name": "Kouassi",
                "role": User.Role.MANAGER,
            },
            {
                "email": "tech@fixtrack.ci",
                "first_name": "Eric",
                "last_name": "Yao",
                "role": User.Role.TECHNICIAN,
            },
            {
                "email": "requester@fixtrack.ci",
                "first_name": "Fatou",
                "last_name": "Traoré",
                "role": User.Role.REQUESTER,
            },
        ]

        password = "FixTrack123!"

        for data in demo_users:
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={
                    **data,
                    "organization": organization,
                    "is_active": True,
                },
            )

            user.first_name = data["first_name"]
            user.last_name = data["last_name"]
            user.role = data["role"]
            user.organization = organization
            user.is_active = True

            user.set_password(password)

            user.save()

            self.stdout.write(
                self.style.SUCCESS(
                    f"{'Créé' if created else 'Mis à jour'} : "
                    f"{user.email}"
                )
            )

        campus_cocody, _ = Site.objects.get_or_create(
            organization=organization,
            name="Campus Cocody",
            defaults={
                "address": "Cocody, Abidjan",
                "is_active": True,
            },
        )

        campus_marcory, _ = Site.objects.get_or_create(
            organization=organization,
            name="Campus Marcory",
            defaults={
                "address": "Marcory, Abidjan",
                "is_active": True,
            },
        )

        admin_building, _ = (
            Building.objects.get_or_create(
                site=campus_cocody,
                name="Administration",
                defaults={
                    "code": "ADM",
                    "is_active": True,
                },
            )
        )

        building_a, _ = Building.objects.get_or_create(
            site=campus_cocody,
            name="Bâtiment A",
            defaults={
                "code": "BAT-A",
                "is_active": True,
            },
        )

        building_b, _ = Building.objects.get_or_create(
            site=campus_cocody,
            name="Bâtiment B",
            defaults={
                "code": "BAT-B",
                "is_active": True,
            },
        )

        marcory_main, _ = (
            Building.objects.get_or_create(
                site=campus_marcory,
                name="Bâtiment principal",
                defaults={
                    "code": "MRC-01",
                    "is_active": True,
                },
            )
        )

        ground_floor, _ = Floor.objects.get_or_create(
            building=admin_building,
            level=0,
            defaults={
                "name": "Rez-de-chaussée",
                "is_active": True,
            },
        )

        building_a_floor_1, _ = (
            Floor.objects.get_or_create(
                building=building_a,
                level=1,
                defaults={
                    "name": "1er étage",
                    "is_active": True,
                },
            )
        )

        building_b_floor_1, _ = (
            Floor.objects.get_or_create(
                building=building_b,
                level=1,
                defaults={
                    "name": "1er étage",
                    "is_active": True,
                },
            )
        )

        marcory_ground, _ = Floor.objects.get_or_create(
            building=marcory_main,
            level=0,
            defaults={
                "name": "Rez-de-chaussée",
                "is_active": True,
            },
        )

        Location.objects.get_or_create(
            floor=ground_floor,
            name="Accueil",
            defaults={
                "code": "ADM-ACC",
                "description": "Accueil administratif",
            },
        )

        Location.objects.get_or_create(
            floor=ground_floor,
            name="Direction",
            defaults={
                "code": "ADM-DIR",
            },
        )

        Location.objects.get_or_create(
            floor=building_a_floor_1,
            name="Salle A12",
            defaults={
                "code": "A12",
            },
        )

        Location.objects.get_or_create(
            floor=building_a_floor_1,
            name="Salle A14",
            defaults={
                "code": "A14",
            },
        )

        Location.objects.get_or_create(
            floor=building_b_floor_1,
            name="Salle B12",
            defaults={
                "code": "B12",
            },
        )

        Location.objects.get_or_create(
            floor=marcory_ground,
            name="Salle M01",
            defaults={
                "code": "M01",
            },
        )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "Seed FixTrack CI Sprint 2 terminé."
            )
        )

        self.stdout.write(
            "Mot de passe démo : FixTrack123!"
        )