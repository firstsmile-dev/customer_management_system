from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from .models import (
    CmsUser,
    Customer,
    CustomerDetail,
    CustomerPreference,
    CustomerProfile,
    DailySummary,
    PerformanceTarget,
    StaffMember,
    Store,
    VisitRecord,
)


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ["id", "name", "store_type", "address", "is_active"]
        read_only_fields = ["id"]


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})

    class Meta:
        model = CmsUser
        fields = ["id", "username", "email", "password", "role", "created_at"]
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


class CustomerSerializer(serializers.ModelSerializer):
    """CRUD for the `customers` table only (no profile/detail/preferences)."""

    class Meta:
        model = Customer
        fields = ["id", "store", "name", "first_visit", "contact_info", "preferences", "total_spend"]
        read_only_fields = ["id"]


class StaffMemberSerializer(serializers.ModelSerializer):
    """CRUD for the `staff_members` table."""

    class Meta:
        model = StaffMember
        fields = [
            "id",
            "user",
            "store",
            "hourly_wage",
            "commission_rate",
            "is_on_duty",
            "check_in",
            "check_out",
        ]
        read_only_fields = ["id"]


class VisitRecordSerializer(serializers.ModelSerializer):
    """CRUD for the `visit_records` table."""

    class Meta:
        model = VisitRecord
        fields = [
            "id",
            "customer",
            "cast",
            "visit_date",
            "spending",
            "payment_method",
            "entry_time",
            "exit_time",
            "accompanied",
            "companions",
            "memo",
            "unpaid_amount",
            "received_amount",
            "unpaid_date",
            "receipt",
        ]
        read_only_fields = ["id"]


class CustomerProfileSerializer(serializers.ModelSerializer):
    """CRUD for the `customers_profile` table (one-to-one with Customer)."""

    class Meta:
        model = CustomerProfile
        fields = ["customer", "birthday", "zodiac", "animal_fortune"]


class CustomerDetailSerializer(serializers.ModelSerializer):
    """CRUD for the `customers_detail` table (one-to-one with Customer)."""

    class Meta:
        model = CustomerDetail
        fields = [
            "customer",
            "blood_type",
            "birthplace",
            "appearance_memo",
            "company_name",
            "job_title",
            "job_description",
            "work_location",
            "monthly_income",
            "monthly_drinking_budget",
            "residence_type",
            "nearest_station",
            "has_lover",
            "marital_status",
            "children_info",
        ]


class CustomerPreferenceSerializer(serializers.ModelSerializer):
    """CRUD for the `customer_preferences` table (one-to-one with Customer)."""

    class Meta:
        model = CustomerPreference
        fields = [
            "customer",
            "alcohol_strength",
            "favorite_food",
            "dislike_food",
            "hobby",
            "favorite_brand",
        ]


class PerformanceTargetSerializer(serializers.ModelSerializer):
    """CRUD for the `performance_targets` table."""

    class Meta:
        model = PerformanceTarget
        fields = ["id", "staff", "target_amount", "target_type", "target_date"]
        read_only_fields = ["id"]


class DailySummarySerializer(serializers.ModelSerializer):
    """CRUD for the `daily_summaries` table."""

    class Meta:
        model = DailySummary
        fields = ["id", "store", "report_date", "total_sales", "total_expenses", "labor_costs", "notes"]
        read_only_fields = ["id"]
