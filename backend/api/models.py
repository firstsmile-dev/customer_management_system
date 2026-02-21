from django.db import models
from django.utils import timezone
import uuid


class Store(models.Model):
    """
    Maps to the `stores` table.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, default="TTLAND")

    class StoreType(models.TextChoices):
        CON_CAFE = "Con Cafe", "Con Cafe"
        BAR = "Bar", "Bar"
        HOST_CLUB = "Host Club", "Host Club"

    store_type = models.CharField(
        max_length=255,
        choices=StoreType.choices,
        default=StoreType.CON_CAFE,
    )
    address = models.TextField()
    is_active = models.BooleanField()

    class Meta:
        db_table = "stores"

    def __str__(self) -> str:
        return self.name


class CmsUser(models.Model):
    """
    Application-level user table (`users`) from the DDL.
    Not Django's auth user.
    """

    class Role(models.TextChoices):
        CAST = "Cast", "Cast"
        STAFF = "Staff", "Staff"
        MANAGER = "Manager", "Manager"
        ADMIN = "Admin", "Admin"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=255, blank=True, default="")
    email = models.EmailField(max_length=255, unique=True)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(
        max_length=255,
        choices=Role.choices,
        default=Role.CAST,
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "users"

    def __str__(self) -> str:
        return self.email


class StaffMember(models.Model):
    """
    Maps to `staff_members`.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        CmsUser,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="staff_members",
    )
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        db_column="store_id",
        related_name="staff_members",
    )
    hourly_wage = models.DecimalField(max_digits=8, decimal_places=2)
    commission_rate = models.FloatField()
    is_on_duty = models.BooleanField()
    check_in = models.DateTimeField()
    check_out = models.DateTimeField()

    class Meta:
        db_table = "staff_members"

    def __str__(self) -> str:
        return f"{self.user.email} @ {self.store.name}"


class PerformanceTarget(models.Model):
    """
    Maps to `performance_targets`.
    """

    class TargetType(models.TextChoices):
        DAILY = "Daily", "Daily"
        MONTHLY = "Monthly", "Monthly"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    staff = models.ForeignKey(
        StaffMember,
        on_delete=models.CASCADE,
        db_column="staff_id",
        related_name="performance_targets",
    )
    target_amount = models.DecimalField(max_digits=8, decimal_places=2)
    target_type = models.CharField(
        max_length=255,
        choices=TargetType.choices,
    )
    target_date = models.DateField()

    class Meta:
        db_table = "performance_targets"


class Customer(models.Model):
    """
    Maps to `customers`.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        db_column="store_id",
        related_name="customers",
    )
    name = models.CharField(max_length=255)
    first_visit = models.DateField()
    contact_info = models.JSONField()
    preferences = models.JSONField()
    total_spend = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        db_table = "customers"

    def __str__(self) -> str:
        return self.name


class VisitRecord(models.Model):
    """
    Maps to `visit_records`.
    """

    class PaymentMethod(models.TextChoices):
        CASH = "Cash", "Cash"
        CREDIT_CARD = "Credit Card", "Credit Card"
        PAYPAY = "PayPay", "PayPay"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        db_column="customer_id",
        related_name="visit_records",
    )
    cast = models.ForeignKey(
        StaffMember,
        on_delete=models.CASCADE,
        db_column="cast_id",
        related_name="visit_records",
    )
    visit_date = models.DateField()
    spending = models.DecimalField(max_digits=8, decimal_places=2)
    payment_method = models.CharField(
        max_length=255,
        choices=PaymentMethod.choices,
    )
    entry_time = models.DateTimeField()
    exit_time = models.DateTimeField()
    accompanied = models.BooleanField()
    companions = models.CharField(max_length=255)
    memo = models.TextField()
    unpaid_amount = models.DecimalField(max_digits=8, decimal_places=2)
    received_amount = models.BigIntegerField()
    unpaid_date = models.DateField(db_column="unpaid date")
    receipt = models.BooleanField()

    class Meta:
        db_table = "visit_records"


class DailySummary(models.Model):
    """
    Maps to `daily_summaries`.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        db_column="store_id",
        related_name="daily_summaries",
    )
    report_date = models.DateField()
    total_sales = models.DecimalField(max_digits=8, decimal_places=2)
    total_expenses = models.DecimalField(max_digits=8, decimal_places=2)
    labor_costs = models.DecimalField(max_digits=8, decimal_places=2)
    notes = models.TextField()

    class Meta:
        db_table = "daily_summaries"


class CustomerProfile(models.Model):
    """
    Maps to `customers_profile`.
    One-to-one with `Customer`.
    """

    customer = models.OneToOneField(
        Customer,
        on_delete=models.CASCADE,
        db_column="customer_id",
        primary_key=True,
        related_name="profile",
    )
    birthday = models.DateField()
    zodiac = models.CharField(max_length=255)
    animal_fortune = models.CharField(max_length=255)

    class Meta:
        db_table = "customers_profile"


class CustomerDetail(models.Model):
    """
    Maps to `customers_detail`.
    One-to-one with `Customer`.
    """

    class ResidenceType(models.TextChoices):
        OWN = "Own", "Own"
        RENT = "Rent", "Rent"
        OTHER = "Other", "Other"

    class MaritalStatus(models.TextChoices):
        SINGLE = "Single", "Single"
        MARRIED = "Married", "Married"
        DIVORCED = "Divorced", "Divorced"
        WIDOWED = "Widowed", "Widowed"

    customer = models.OneToOneField(
        Customer,
        on_delete=models.CASCADE,
        db_column="customer_id",
        primary_key=True,
        related_name="detail",
    )
    blood_type = models.CharField(max_length=255)
    birthplace = models.CharField(max_length=255)
    appearance_memo = models.TextField()
    company_name = models.CharField(max_length=255)
    job_title = models.CharField(max_length=255)
    job_description = models.TextField()
    work_location = models.CharField(max_length=255)
    monthly_income = models.IntegerField()
    monthly_drinking_budget = models.IntegerField()
    residence_type = models.CharField(
        max_length=255,
        choices=ResidenceType.choices,
    )
    nearest_station = models.CharField(max_length=255)
    has_lover = models.BooleanField()
    marital_status = models.CharField(
        max_length=255,
        choices=MaritalStatus.choices,
    )
    children_info = models.CharField(max_length=255)

    class Meta:
        db_table = "customers_detail"


class CustomerPreference(models.Model):
    """
    Maps to `customer_preferences`.
    One-to-one with `Customer`.
    """

    class AlcoholStrength(models.TextChoices):
        WEAK = "Weak", "Weak"
        MEDIUM = "Medium", "Medium"
        STRONG = "Strong", "Strong"

    customer = models.OneToOneField(
        Customer,
        on_delete=models.CASCADE,
        db_column="customer_id",
        primary_key=True,
        related_name="preference",
    )
    alcohol_strength = models.CharField(
        max_length=255,
        choices=AlcoholStrength.choices,
    )
    favorite_food = models.TextField()
    dislike_food = models.TextField()
    hobby = models.TextField()
    favorite_brand = models.TextField()

    class Meta:
        db_table = "customer_preferences"

