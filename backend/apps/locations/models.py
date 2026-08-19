from django.db import models


class Site(models.Model):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="sites",
    )

    name = models.CharField(max_length=180)
    address = models.CharField(max_length=255, blank=True)

    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
    )

    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Building(models.Model):
    site = models.ForeignKey(
        Site,
        on_delete=models.CASCADE,
        related_name="buildings",
    )

    name = models.CharField(max_length=180)
    code = models.CharField(max_length=50, blank=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["site__name", "name"]

    def __str__(self):
        return f"{self.site.name} - {self.name}"


class Floor(models.Model):
    building = models.ForeignKey(
        Building,
        on_delete=models.CASCADE,
        related_name="floors",
    )

    name = models.CharField(max_length=100)
    level = models.IntegerField(default=0)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = [
            "building__site__name",
            "building__name",
            "level",
        ]

    def __str__(self):
        return f"{self.building.name} - {self.name}"


class Location(models.Model):
    floor = models.ForeignKey(
        Floor,
        on_delete=models.CASCADE,
        related_name="locations",
    )

    name = models.CharField(max_length=180)
    code = models.CharField(max_length=50, blank=True)

    description = models.TextField(blank=True)

    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
    )

    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        null=True,
        blank=True,
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = [
            "floor__building__site__name",
            "floor__building__name",
            "floor__level",
            "name",
        ]

    def __str__(self):
        return (
            f"{self.floor.building.site.name} - "
            f"{self.floor.building.name} - "
            f"{self.name}"
        )