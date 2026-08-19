from django.contrib.auth import get_user_model

from rest_framework import serializers

from .models import User


class MeSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(
        read_only=True
    )

    organization = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "avatar",
            "role",
            "organization",
            "is_active",
        ]

        read_only_fields = [
            "id",
            "email",
            "role",
            "organization",
            "is_active",
        ]

    def get_organization(self, obj):
        if not obj.organization:
            return None

        return {
            "id": obj.organization.id,
            "name": obj.organization.name,
            "slug": obj.organization.slug,
            "type": obj.organization.type,
        }


class UserManagementSerializer(
    serializers.ModelSerializer
):
    full_name = serializers.CharField(
        read_only=True
    )

    organization_name = serializers.CharField(
        source="organization.name",
        read_only=True,
    )

    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8,
    )

    class Meta:
        model = User

        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "avatar",
            "role",
            "organization_name",
            "is_active",
            "password",
            "date_joined",
        ]

        read_only_fields = [
            "id",
            "full_name",
            "organization_name",
            "date_joined",
        ]

    def validate(self, attrs):
        if self.instance is None:
            password = attrs.get("password")

            if not password:
                raise serializers.ValidationError(
                    {
                        "password": (
                            "Le mot de passe est obligatoire."
                        )
                    }
                )

        return attrs

    def validate_email(self, value):
        UserModel = get_user_model()

        queryset = UserModel.objects.filter(
            email__iexact=value
        )

        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Cette adresse e-mail est déjà utilisée."
            )

        return value

    def create(self, validated_data):
        password = validated_data.pop("password")

        request = self.context["request"]

        user = User.objects.create_user(
            password=password,
            organization=request.user.organization,
            **validated_data,
        )

        return user

    def update(
        self,
        instance,
        validated_data,
    ):
        password = validated_data.pop(
            "password",
            None,
        )

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if password:
            instance.set_password(password)

        instance.save()

        return instance