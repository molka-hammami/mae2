from rest_framework import serializers
from .models import AppUser


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUser
        fields = [
            "id",
            "name",
            "email",
            "role",
            "must_change_password",
            "assigned_category",
            "is_active",
            "created_at",
        ]


class CreateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUser
        fields = [
            "id",
            "name",
            "email",
            "password",
            "role",
            "must_change_password",
            "assigned_category",
            "is_active",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }