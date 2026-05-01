from rest_framework import serializers
from .models import AppUser


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUser
        fields = [
            "id",
            "name",
            "email",              # login @mae.tn
            "personal_email",     # ✅ ajouté
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
            "personal_email",   # ✅ ADD THIS
            "password",
            "role",
            "must_change_password",
            "assigned_category",
            "is_active",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = AppUser(**validated_data)

        # ⚠️ IMPORTANT (hash password)
        from django.contrib.auth.hashers import make_password
        user.password = make_password(password)

        user.save()
        return user