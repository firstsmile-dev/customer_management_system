from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from .models import CmsUser, Store


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ["id", "name", "store_type", "address", "is_active"]
        read_only_fields = ["id"]


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})

    class Meta:
        model = CmsUser
        fields = ["id", "email", "password", "role", "created_at"]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        raw_password = validated_data.pop("password")
        validated_data["password_hash"] = make_password(raw_password)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        raw_password = validated_data.pop("password", None)
        if raw_password is not None:
            validated_data["password_hash"] = make_password(raw_password)
        return super().update(instance, validated_data)
