from django.db import models

class Organization(models.Model):
    class Type(models.TextChoices):
        SCHOOL = "SCHOOL", "Établissement scolaire"
        COMPANY = "COMPANY", "Entreprise"
        HOTEL = "HOTEL", "Hôtel"
        RESIDENCE = "RESIDENCE", "Résidence"
        COMMERCIAL = "COMMERCIAL", "Espace commercial"
        OTHER = "OTHER", "Autre"

    name = models.CharField(max_length=180)
    slug = models.SlugField(max_length=180, unique=True)
    type = models.CharField(
        max_length=30,
        choices=Type.choices,
        default=Type.OTHER,
    )
    logo = models.URLField(blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
