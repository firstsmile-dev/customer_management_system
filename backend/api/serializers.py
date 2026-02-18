from rest_framework import serializers
from .models import Store


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ["id", "name", "store_type", "address", "is_active"]
        read_only_fields = ["id"]
