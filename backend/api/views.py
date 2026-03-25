from django.contrib.auth.hashers import check_password, make_password
from django.db import IntegrityError
from django.db.models import Count, Q, Sum
from rest_framework import status, viewsets
from datetime import date
from decimal import Decimal, ROUND_CEILING, ROUND_FLOOR, ROUND_HALF_UP

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .auth import CmsUserAuth
from .models import (
    AdvanceRequest,
    CmsUser,
    Customer,
    CustomerDetail,
    CustomerPreference,
    CustomerProfile,
    DailySummary,
    DailyReport,
    HostSalarySetting,
    PerformanceTarget,
    StaffMember,
    StoreTarget,
    Store,
    VisitRecord,
)
from .serializers import (
    AdvanceRequestSerializer,
    CustomerDetailSerializer,
    CustomerPreferenceSerializer,
    CustomerProfileSerializer,
    CustomerSerializer,
    DailySummarySerializer,
    DailyReportSerializer,
    HostSalarySettingSerializer,
    PerformanceTargetSerializer,
    StaffMemberSerializer,
    StoreTargetSerializer,
    StoreSerializer,
    UserSerializer,
    VisitRecordSerializer,
)


def _get_request_cms_user(request):
    """Return the CmsUser for the authenticated request user, or None."""
    user = getattr(request, "user", None)
    if user is None or not getattr(user, "is_authenticated", False):
        return None
    return getattr(user, "cms_user", None)


def _get_request_user_store_id(request):
    """Return the store_id of the authenticated user (CmsUser.store_id), or None if admin/all stores."""
    cms_user = _get_request_cms_user(request)
    if cms_user is None:
        return None
    return getattr(cms_user, "store_id", None)


def _get_request_user_store_ids(request):
    """
    Return None if user can access all stores (Admin/Owner).
    Return list of store PKs the user can access (Supervisor: viewable_stores; Manager/Staff/Cast: single store).
    """
    cms_user = _get_request_cms_user(request)
    if cms_user is None:
        return []
    role = getattr(cms_user, "role", None)
    if role in ("Admin", "Owner"):
        return None  # no restriction = all stores
    if role == "Supervisor":
        ids = list(cms_user.viewable_stores.values_list("pk", flat=True))
        return ids
    # Manager, Staff, Cast: single store
    sid = getattr(cms_user, "store_id", None)
    return [sid] if sid else []


def _is_admin(request):
    """True if the request user has Admin role."""
    cms_user = _get_request_cms_user(request)
    if cms_user is None:
        return False
    return getattr(cms_user, "role", None) == "Admin"


def _is_owner(request):
    """True if the request user has Owner role (full authority like Admin)."""
    cms_user = _get_request_cms_user(request)
    if cms_user is None:
        return False
    return getattr(cms_user, "role", None) == "Owner"


def _is_admin_or_owner(request):
    """True if the request user has Admin or Owner role (full authority over all stores)."""
    return _is_admin(request) or _is_owner(request)


def _is_supervisor(request):
    """True if the request user has Supervisor role (統括: same as Manager + view all stores)."""
    cms_user = _get_request_cms_user(request)
    if cms_user is None:
        return False
    return getattr(cms_user, "role", None) == "Supervisor"


def _can_write_daily_report(request):
    """日報の作成・編集・削除: スタッフ・マネージャー・管理者・オーナーのみ（キャスト・統括は閲覧のみ）。"""
    role = _get_request_user_role(request)
    return role in ("Staff", "Manager", "Admin", "Owner")


def _ensure_store_for_non_admin(request, store_id, action_label="this action"):
    """If user is not admin/owner, ensure store_id is one of their allowed stores. Return None or a 403 Response."""
    if _is_admin_or_owner(request):
        return None
    store_ids = _get_request_user_store_ids(request)
    if not store_ids:  # Supervisor with no viewable_stores, or no store assigned
        return Response(
            {"detail": "You do not have a store assigned. Only your store(s) are allowed."},
            status=status.HTTP_403_FORBIDDEN,
        )
    if store_id is None or str(store_id) not in [str(s) for s in store_ids]:
        return Response(
            {"detail": f"You can only perform {action_label} for your allowed store(s)."},
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


@api_view(["GET"])
def api_home(request):
    return Response({
        "message": "Django API is working!",
        "status": "success",
        "data": "Ready to connect with React",
    })


class StoreViewSet(viewsets.ModelViewSet):
    """CRUD for stores. Admin/Owner: all stores, can create. Supervisor: viewable_stores only (set by Admin). Others: only their store. Create: Admin and Owner only."""
    queryset = Store.objects.all()
    serializer_class = StoreSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        store_ids = _get_request_user_store_ids(self.request)
        if store_ids is None:
            return qs
        if not store_ids:
            return qs.none()
        return qs.filter(pk__in=store_ids)

    def create(self, request, *args, **kwargs):
        if not _is_admin_or_owner(request):
            return Response(
                {"detail": "Only administrators or owners can create new stores."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)


class UserViewSet(viewsets.ModelViewSet):
    """CRUD for users (CmsUser). Passwords are hashed; never stored or returned in plain text.
    Only admins can change role or edit other users; non-admins can only update their own email and password.
    """
    queryset = CmsUser.objects.all()
    serializer_class = UserSerializer

    def _get_request_user_role(self):
        cms = _get_request_cms_user(self.request)
        return getattr(cms, "role", None) if cms else None

    def _is_admin(self):
        return _is_admin_or_owner(self.request)

    def _request_user_pk(self):
        user = getattr(self.request, "user", None)
        if user is None:
            return None
        return getattr(user, "pk", None)

    def get_queryset(self):
        qs = super().get_queryset()
        store_ids = _get_request_user_store_ids(self.request)
        if store_ids is None:
            pass  # Admin/Owner: all users
        elif not store_ids:
            return qs.none()
        else:
            qs = qs.filter(store_id__in=store_ids)
        role = self._get_request_user_role()
        if role == "Staff":
            return qs.filter(role=CmsUser.Role.CAST)
        return qs

    def update(self, request, *args, **kwargs):
        partial = kwargs.get("partial", False)
        instance = self.get_object()
        req_pk = self._request_user_pk()
        if req_pk is None:
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
        is_admin = self._is_admin()
        if not is_admin and instance.pk != req_pk:
            return Response(
                {"detail": "Only administrators can edit other users."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not is_admin and instance.pk == req_pk:
            # Non-admin editing self: cannot change role or store
            allowed = {"email", "password", "username"}
            data = {k: request.data.get(k) for k in allowed if k in request.data}
            if not data and not partial:
                data = {"email": getattr(instance, "email", None)}
            serializer = self.get_serializer(instance, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)


class CustomerViewSet(viewsets.ModelViewSet):
    """CRUD for the `customers` table only. Admin: all. Others: only customers of their store(s)."""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        store_ids = _get_request_user_store_ids(self.request)
        if store_ids is None:
            return qs
        if not store_ids:
            return qs.none()
        return qs.filter(store_id__in=store_ids)

    def create(self, request, *args, **kwargs):
        store_id = request.data.get("store")
        err = _ensure_store_for_non_admin(request, store_id, "customer creation")
        if err is not None:
            return err
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not _is_admin_or_owner(request) and request.data.get("store") is not None:
            err = _ensure_store_for_non_admin(request, request.data.get("store"), "customer update")
            if err is not None:
                return err
        return super().update(request, *args, **kwargs)


class StaffMemberViewSet(viewsets.ModelViewSet):
    """CRUD for the `staff_members` table. Admin: all. Others: only staff members of their store. Staff role: only Cast users."""
    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer

    def _get_request_user_role(self):
        cms = _get_request_cms_user(self.request)
        return getattr(cms, "role", None) if cms else None

    def get_queryset(self):
        qs = super().get_queryset()
        store_ids = _get_request_user_store_ids(self.request)
        if store_ids is None:
            pass
        elif not store_ids:
            return qs.none()
        else:
            qs = qs.filter(store_id__in=store_ids)
        role = self._get_request_user_role()
        if role == "Staff":
            return qs.filter(user__role=CmsUser.Role.CAST)
        return qs

    def create(self, request, *args, **kwargs):
        store_id = request.data.get("store")
        err = _ensure_store_for_non_admin(request, store_id, "staff member creation")
        if err is not None:
            return err
        if self._get_request_user_role() == "Staff":
            user_id = request.data.get("user")
            try:
                u = CmsUser.objects.get(pk=user_id)
                if u.role != CmsUser.Role.CAST:
                    return Response(
                        {"detail": "Staff can only assign Cast users to staff members."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except CmsUser.DoesNotExist:
                pass
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not _is_admin_or_owner(request) and request.data.get("store") is not None:
            err = _ensure_store_for_non_admin(request, request.data.get("store"), "staff member update")
            if err is not None:
                return err
        if self._get_request_user_role() == "Staff":
            user_id = request.data.get("user")
            if user_id is not None:
                try:
                    u = CmsUser.objects.get(pk=user_id)
                    if u.role != CmsUser.Role.CAST:
                        return Response(
                            {"detail": "Staff can only assign Cast users to staff members."},
                            status=status.HTTP_403_FORBIDDEN,
                        )
                except CmsUser.DoesNotExist:
                    pass
        return super().update(request, *args, **kwargs)


class VisitRecordViewSet(viewsets.ModelViewSet):
    """CRUD for the `visit_records` table. Admin: all. Others: only records for customers in their store(s)."""
    queryset = VisitRecord.objects.all()
    serializer_class = VisitRecordSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        store_ids = _get_request_user_store_ids(self.request)
        if store_ids is None:
            return qs
        if not store_ids:
            return qs.none()
        return qs.filter(customer__store_id__in=store_ids)

    def create(self, request, *args, **kwargs):
        if not _is_admin_or_owner(self.request):
            customer_id = request.data.get("customer")
            store_ids = _get_request_user_store_ids(self.request)
            if customer_id and store_ids:
                try:
                    c = Customer.objects.get(pk=customer_id)
                    if str(c.store_id) not in [str(s) for s in store_ids]:
                        return Response(
                            {"detail": "You can only create visit records for customers in your store(s)."},
                            status=status.HTTP_403_FORBIDDEN,
                        )
                except Customer.DoesNotExist:
                    pass
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not _is_admin_or_owner(self.request):
            instance = self.get_object()
            store_ids = _get_request_user_store_ids(self.request)
            if store_ids and str(instance.customer.store_id) not in [str(s) for s in store_ids]:
                return Response(
                    {"detail": "You can only update visit records for your store(s)."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return super().update(request, *args, **kwargs)


class CustomerProfileViewSet(viewsets.ModelViewSet):
    """CRUD for the `customers_profile` table. Admin: all. Others: only for customers in their store(s)."""
    queryset = CustomerProfile.objects.all()
    serializer_class = CustomerProfileSerializer
    lookup_url_kwarg = "customer_id"
    lookup_field = "customer"

    def get_queryset(self):
        qs = super().get_queryset()
        store_ids = _get_request_user_store_ids(self.request)
        if store_ids is None:
            return qs
        if not store_ids:
            return qs.none()
        return qs.filter(customer__store_id__in=store_ids)


class CustomerDetailViewSet(viewsets.ModelViewSet):
    """CRUD for the `customers_detail` table. Admin: all. Others: only for customers in their store(s)."""
    queryset = CustomerDetail.objects.all()
    serializer_class = CustomerDetailSerializer
    lookup_url_kwarg = "customer_id"
    lookup_field = "customer"

    def get_queryset(self):
        qs = super().get_queryset()
        store_ids = _get_request_user_store_ids(self.request)
        if store_ids is None:
            return qs
        if not store_ids:
            return qs.none()
        return qs.filter(customer__store_id__in=store_ids)


class CustomerPreferenceViewSet(viewsets.ModelViewSet):
    """CRUD for the `customer_preferences` table. Admin: all. Others: only for customers in their store(s)."""
    queryset = CustomerPreference.objects.all()
    serializer_class = CustomerPreferenceSerializer
    lookup_url_kwarg = "customer_id"
    lookup_field = "customer"

    def get_queryset(self):
        qs = super().get_queryset()
        store_ids = _get_request_user_store_ids(self.request)
        if store_ids is None:
            return qs
        if not store_ids:
            return qs.none()
        return qs.filter(customer__store_id__in=store_ids)


def _get_request_user_id(request):
    """Return the CmsUser pk for the authenticated request, or None."""
    cms_user = _get_request_cms_user(request)
    return cms_user.id if cms_user else None


def _get_request_user_role(request):
    """Return the role of the authenticated user (e.g. 'Cast', 'Staff', 'Manager', 'Admin'), or None."""
    cms_user = _get_request_cms_user(request)
    return getattr(cms_user, "role", None) if cms_user else None


class PerformanceTargetViewSet(viewsets.ModelViewSet):
    """
    CRUD for the `performance_targets` table.
    - Cast: only own targets (staff belongs to current user); create/edit/delete only own.
    - Staff, Manager, Admin: list and CRUD all targets for stores within their authority
      (Staff/Manager: their store only; Admin: all stores).
    """
    queryset = PerformanceTarget.objects.all()
    serializer_class = PerformanceTargetSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        role = _get_request_user_role(self.request)
        if role in ("Admin", "Owner"):
            return qs
        if role == "Cast":
            user_id = _get_request_user_id(self.request)
            if user_id is None:
                return qs.none()
            return qs.filter(staff__user_id=user_id)
        # Staff, Manager, or Supervisor: targets for staff in their store(s) only
        store_ids = _get_request_user_store_ids(self.request)
        if not store_ids:
            return qs.none()
        return qs.filter(staff__store_id__in=store_ids)

    def _staff_belongs_to_request_user(self, staff_id):
        """True if the given staff_id is a StaffMember for the current user (Cast: own only)."""
        user_id = _get_request_user_id(self.request)
        if user_id is None:
            return False
        try:
            sm = StaffMember.objects.get(pk=staff_id)
            return str(sm.user_id) == str(user_id)
        except StaffMember.DoesNotExist:
            return False

    def _staff_in_request_user_store(self, staff_id):
        """True if the given staff_id is a StaffMember in the current user's store(s) (Staff/Manager/Supervisor)."""
        store_ids = _get_request_user_store_ids(self.request)
        if not store_ids:
            return False
        try:
            sm = StaffMember.objects.get(pk=staff_id)
            return str(sm.store_id) in [str(s) for s in store_ids]
        except StaffMember.DoesNotExist:
            return False

    def _validate_staff_for_create_update(self, staff_id):
        """Return None if staff_id is allowed for current user; else return 400/403 Response."""
        if not staff_id:
            return Response(
                {"detail": "staff is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        role = _get_request_user_role(self.request)
        if role == "Cast":
            if not self._staff_belongs_to_request_user(staff_id):
                return Response(
                    {"detail": "Cast can only create or edit performance targets for themselves."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        elif role in ("Staff", "Manager", "Supervisor"):
            if not self._staff_in_request_user_store(staff_id):
                return Response(
                    {"detail": "You can only assign targets to staff in your store."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        # Admin or Owner: any staff allowed
        return None

    def create(self, request, *args, **kwargs):
        if not _is_admin_or_owner(request):
            staff_id = request.data.get("staff")
            err = self._validate_staff_for_create_update(staff_id)
            if err is not None:
                return err
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not _is_admin_or_owner(request):
            staff_id = request.data.get("staff")
            if staff_id is not None:
                err = self._validate_staff_for_create_update(staff_id)
                if err is not None:
                    return err
        return super().update(request, *args, **kwargs)


class DailySummaryViewSet(viewsets.ModelViewSet):
    """CRUD for the `daily_summaries` table. Admin: all. Others: only their store(s)."""
    queryset = DailySummary.objects.all()
    serializer_class = DailySummarySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        store_ids = _get_request_user_store_ids(self.request)
        if store_ids is None:
            return qs
        if not store_ids:
            return qs.none()
        return qs.filter(store_id__in=store_ids)

    def create(self, request, *args, **kwargs):
        store_id = request.data.get("store")
        err = _ensure_store_for_non_admin(request, store_id, "daily summary creation")
        if err is not None:
            return err
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not _is_admin_or_owner(request) and request.data.get("store") is not None:
            err = _ensure_store_for_non_admin(request, request.data.get("store"), "daily summary update")
            if err is not None:
                return err
        return super().update(request, *args, **kwargs)


class DailyReportViewSet(viewsets.ModelViewSet):
    """
    店舗日報: 1店舗・1日1件。閲覧は店舗権限内。作成・更新・削除はスタッフ/マネージャー/管理者/オーナーのみ。
    """

    queryset = DailyReport.objects.all()
    serializer_class = DailyReportSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if _get_request_user_role(self.request) == "Cast":
            return qs.none()
        store_ids = _get_request_user_store_ids(self.request)
        if store_ids is None:
            return qs
        if not store_ids:
            return qs.none()
        return qs.filter(store_id__in=store_ids)

    def perform_create(self, serializer):
        cms_user = _get_request_cms_user(self.request)
        serializer.save(created_by=cms_user)

    def create(self, request, *args, **kwargs):
        if not _can_write_daily_report(request):
            return Response(
                {"detail": "Only staff, managers, administrators, or owners can create daily reports."},
                status=status.HTTP_403_FORBIDDEN,
            )
        store_id = request.data.get("store")
        err = _ensure_store_for_non_admin(request, store_id, "daily report creation")
        if err is not None:
            return err
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"detail": "この店舗・日付の日報は既に登録されています。"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def update(self, request, *args, **kwargs):
        if not _can_write_daily_report(request):
            return Response(
                {"detail": "Only staff, managers, administrators, or owners can update daily reports."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not _is_admin_or_owner(request) and request.data.get("store") is not None:
            err = _ensure_store_for_non_admin(request, request.data.get("store"), "daily report update")
            if err is not None:
                return err
        try:
            return super().update(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {"detail": "この店舗・日付の組み合わせは既に別の日報で使用されています。"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, *args, **kwargs):
        if not _can_write_daily_report(request):
            return Response(
                {"detail": "Only staff, managers, administrators, or owners can delete daily reports."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)


class StoreTargetViewSet(viewsets.ModelViewSet):
    """CRUD for store targets. Admin/Owner: all. Others: only their store(s)."""

    queryset = StoreTarget.objects.all()
    serializer_class = StoreTargetSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        store_ids = _get_request_user_store_ids(self.request)
        if store_ids is None:
            return qs
        if not store_ids:
            return qs.none()
        return qs.filter(store_id__in=store_ids)

    def create(self, request, *args, **kwargs):
        store_id = request.data.get("store")
        err = _ensure_store_for_non_admin(request, store_id, "store target creation")
        if err is not None:
            return err
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not _is_admin_or_owner(request) and request.data.get("store") is not None:
            err = _ensure_store_for_non_admin(request, request.data.get("store"), "store target update")
            if err is not None:
                return err
        return super().update(request, *args, **kwargs)


class AdvanceRequestViewSet(viewsets.ModelViewSet):
    """
    前借申請: 金額の申請と前借伝票の添付。
    - Cast/Staff: create (own), list (own).
    - Manager/Supervisor/Admin/Owner: list (store-scoped or all), update status (approve/reject).
    """

    queryset = AdvanceRequest.objects.all()
    serializer_class = AdvanceRequestSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        cms_user = _get_request_cms_user(self.request)
        if not cms_user:
            return qs.none()
        role = _get_request_user_role(self.request)
        if role in ("Admin", "Owner"):
            return qs
        if role in ("Manager", "Supervisor"):
            store_ids = _get_request_user_store_ids(self.request)
            if not store_ids:
                return qs.none()
            return qs.filter(user__store_id__in=store_ids)
        return qs.filter(user=cms_user)

    def create(self, request, *args, **kwargs):
        # Applicants cannot set status; it always starts as Pending
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        if "status" in data:
            data.pop("status", None)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        cms_user = _get_request_cms_user(self.request)
        if not cms_user:
            raise ValueError("Authentication required")
        serializer.save(user=cms_user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        role = _get_request_user_role(request)
        if role not in ("Admin", "Owner", "Manager", "Supervisor"):
            return Response(
                {"detail": "Only managers or administrators can approve or reject advance requests."},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Only allow updating status (and optionally memo)
        allowed = {"status", "memo"}
        data = {k: request.data.get(k) for k in allowed if k in request.data}
        if not data and not kwargs.get("partial"):
            return super().update(request, *args, **kwargs)
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_page_salary(request):
    """
    Returns salary info for the current user (Cast): hourly_wage, current month commission, last month commission.
    Used by My Page to show 現在給与（今月の歩合見込み） and 先月給与（先月の歩合）.
    """
    cms_user = _get_request_cms_user(request)
    if not cms_user:
        return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

    my_staff = StaffMember.objects.filter(user=cms_user)
    if not my_staff.exists():
        return Response({
            "hourly_wage": None,
            "current_month_commission": 0,
            "last_month_commission": 0,
        })

    today = date.today()
    cur_year, cur_month = today.year, today.month
    if cur_month == 1:
        last_year, last_month = cur_year - 1, 12
    else:
        last_year, last_month = cur_year, cur_month - 1

    first_staff = my_staff.first()
    hourly_wage = int(Decimal(first_staff.hourly_wage))

    current_commission = 0.0
    for r in VisitRecord.objects.filter(
        cast__in=my_staff, visit_date__year=cur_year, visit_date__month=cur_month
    ).select_related("cast"):
        current_commission += float(r.spending) * (r.cast.commission_rate / 100)

    last_commission = 0.0
    for r in VisitRecord.objects.filter(
        cast__in=my_staff, visit_date__year=last_year, visit_date__month=last_month
    ).select_related("cast"):
        last_commission += float(r.spending) * (r.cast.commission_rate / 100)

    return Response({
        "hourly_wage": hourly_wage,
        "current_month_commission": int(round(current_commission)),
        "last_month_commission": int(round(last_commission)),
    })


def _commission_for_staff_month(cast_staff, year: int, month: int) -> int:
    agg = VisitRecord.objects.filter(
        cast=cast_staff, visit_date__year=year, visit_date__month=month
    ).aggregate(t=Sum("spending"))
    spending_sum = int(agg["t"] or 0)
    return int(round(spending_sum * (cast_staff.commission_rate / 100)))


def _achieved_sales_for_performance_target(cast_staff, target: PerformanceTarget) -> int:
    if target.target_type == PerformanceTarget.TargetType.DAILY:
        agg = VisitRecord.objects.filter(cast=cast_staff, visit_date=target.target_date).aggregate(
            t=Sum("spending")
        )
    else:
        y, m = target.target_date.year, target.target_date.month
        agg = VisitRecord.objects.filter(
            cast=cast_staff, visit_date__year=y, visit_date__month=m
        ).aggregate(t=Sum("spending"))
    return int(agg["t"] or 0)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def store_cast_overview(request):
    """
    店舗キャストの目標達成率・給与（歩合・時給）一覧。スタッフ・マネージャーのみ。
    達成額=来店記録の利用額合計（対象期間内）。歩合=利用額×歩合率の合計。
    """
    role = _get_request_user_role(request)
    if role not in ("Staff", "Manager"):
        return Response(
            {"detail": "この一覧はスタッフ・マネージャーのみ利用できます。"},
            status=status.HTTP_403_FORBIDDEN,
        )
    cms_user = _get_request_cms_user(request)
    if not cms_user:
        return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

    store_ids = _get_request_user_store_ids(request)
    if store_ids is None or len(store_ids) == 0:
        return Response({"casts": []})

    staff_rows = (
        StaffMember.objects.filter(store_id__in=store_ids, user__role=CmsUser.Role.CAST)
        .select_related("user", "store")
        .order_by("store__name", "user__email")
    )

    today = date.today()
    cy, cm = today.year, today.month
    if cm == 1:
        ly, lm = cy - 1, 12
    else:
        ly, lm = cy, cm - 1

    casts_out = []
    for sm in staff_rows:
        hourly = int(Decimal(sm.hourly_wage))
        targets_data = []
        for t in PerformanceTarget.objects.filter(staff=sm).order_by("-target_date")[:40]:
            achieved = _achieved_sales_for_performance_target(sm, t)
            tgt = int(Decimal(t.target_amount))
            pct = None
            if tgt > 0:
                pct = int(round(100.0 * achieved / tgt))
            targets_data.append(
                {
                    "id": str(t.id),
                    "target_type": t.target_type,
                    "target_date": str(t.target_date),
                    "target_amount": tgt,
                    "achieved_amount": achieved,
                    "achievement_percent": pct,
                }
            )
        casts_out.append(
            {
                "staff_id": str(sm.id),
                "user_id": str(sm.user_id),
                "email": sm.user.email,
                "username": sm.user.username or "",
                "store_id": str(sm.store_id),
                "store_name": sm.store.name,
                "hourly_wage": hourly,
                "current_month_commission": _commission_for_staff_month(sm, cy, cm),
                "last_month_commission": _commission_for_staff_month(sm, ly, lm),
                "targets": targets_data,
            }
        )

    return Response({"casts": casts_out})


def _competition_ranks(rows, metric_key: str, rank_key: str) -> None:
    """Assign competition ranks (1,1,3…) by metric descending, then store_name."""
    sorted_rows = sorted(rows, key=lambda r: (-r[metric_key], r["store_name"]))
    rank = 1
    for i, row in enumerate(sorted_rows):
        if i > 0 and row[metric_key] < sorted_rows[i - 1][metric_key]:
            rank = i + 1
        row[rank_key] = rank


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def monthly_store_rankings(request):
    """
    当月の店舗別ランキング（オーナー・管理者向け）。
    売上=来店の利用額合計、組数=来店件数、新規組数=初回日が当月内のお客様の来店件数（店舗目標画面と同じ定義）。
    クエリ: year, month（省略時は当月）。全体=全店合計。
    """
    role = _get_request_user_role(request)
    if role not in ("Owner", "Admin"):
        return Response(
            {"detail": "このレポートはオーナー・管理者のみ利用できます。"},
            status=status.HTTP_403_FORBIDDEN,
        )
    cms_user = _get_request_cms_user(request)
    if not cms_user:
        return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

    today = date.today()
    try:
        year = int(request.query_params.get("year", today.year))
        month = int(request.query_params.get("month", today.month))
    except (TypeError, ValueError):
        return Response(
            {"detail": "year と month は整数で指定してください。"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if month < 1 or month > 12 or year < 2000 or year > 2100:
        return Response(
            {"detail": "無効な年月です。"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    visit_agg = (
        VisitRecord.objects.filter(visit_date__year=year, visit_date__month=month)
        .values("customer__store_id", "customer__store__name")
        .annotate(
            sales=Sum("spending"),
            groups=Count("id"),
            new_groups=Count(
                "id",
                filter=Q(
                    customer__first_visit__year=year,
                    customer__first_visit__month=month,
                ),
            ),
        )
    )
    by_store = {}
    for row in visit_agg:
        sid = row["customer__store_id"]
        by_store[sid] = {
            "store_id": str(sid),
            "store_name": row["customer__store__name"] or "",
            "sales": int(row["sales"] or 0),
            "groups": int(row["groups"] or 0),
            "new_groups": int(row["new_groups"] or 0),
        }

    base_rows = []
    for store in Store.objects.filter(is_active=True).order_by("name"):
        sid = store.id
        d = by_store.get(sid)
        if d:
            base_rows.append(dict(d))
        else:
            base_rows.append(
                {
                    "store_id": str(sid),
                    "store_name": store.name,
                    "sales": 0,
                    "groups": 0,
                    "new_groups": 0,
                }
            )

    _competition_ranks(base_rows, "sales", "rank_sales")
    _competition_ranks(base_rows, "groups", "rank_groups")
    _competition_ranks(base_rows, "new_groups", "rank_new_groups")

    overall = {
        "sales_total": sum(r["sales"] for r in base_rows),
        "groups_total": sum(r["groups"] for r in base_rows),
        "new_groups_total": sum(r["new_groups"] for r in base_rows),
    }

    return Response(
        {
            "year": year,
            "month": month,
            "overall": overall,
            "by_store": base_rows,
        }
    )


def _require_manager_host_store(request):
    cms_user = _get_request_cms_user(request)
    if not cms_user:
        return None, Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)
    role = _get_request_user_role(request)
    if role != "Manager":
        return None, Response({"detail": "この設定はマネージャーのみ利用できます。"}, status=status.HTTP_403_FORBIDDEN)
    store = getattr(cms_user, "store", None)
    if store is None:
        return None, Response({"detail": "店舗が設定されていません。"}, status=status.HTTP_400_BAD_REQUEST)
    if store.store_type != Store.StoreType.HOST_CLUB:
        return None, Response({"detail": "ホストクラブ店舗のみ設定できます。"}, status=status.HTTP_403_FORBIDDEN)
    return store, None


def _round_yen(value: Decimal, mode: str) -> int:
    if mode == HostSalarySetting.RoundingMode.FLOOR:
        q = value.quantize(Decimal("1"), rounding=ROUND_FLOOR)
    elif mode == HostSalarySetting.RoundingMode.CEIL:
        q = value.quantize(Decimal("1"), rounding=ROUND_CEILING)
    else:
        q = value.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(q)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def host_salary_settings(request):
    """
    ホストクラブの給与計算用設定（小計/総売上）。マネージャーのみ。
    """
    store, err = _require_manager_host_store(request)
    if err is not None:
        return err

    setting, _ = HostSalarySetting.objects.get_or_create(store=store)
    if request.method == "GET":
        return Response(HostSalarySettingSerializer(setting).data)

    serializer = HostSalarySettingSerializer(setting, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def host_salary_settings_preview(request):
    """
    当月(または指定月)の総売上/小計の計算プレビュー。マネージャーのみ。
    query: year, month（省略時は当月）
    """
    store, err = _require_manager_host_store(request)
    if err is not None:
        return err

    setting, _ = HostSalarySetting.objects.get_or_create(store=store)

    today = date.today()
    try:
        year = int(request.query_params.get("year", today.year))
        month = int(request.query_params.get("month", today.month))
    except (TypeError, ValueError):
        return Response({"detail": "year と month は整数で指定してください。"}, status=status.HTTP_400_BAD_REQUEST)
    if month < 1 or month > 12 or year < 2000 or year > 2100:
        return Response({"detail": "無効な年月です。"}, status=status.HTTP_400_BAD_REQUEST)

    agg = VisitRecord.objects.filter(
        customer__store=store, visit_date__year=year, visit_date__month=month
    ).aggregate(t=Sum("spending"), c=Count("id"))
    total_sales = Decimal(int(agg["t"] or 0))
    groups = int(agg["c"] or 0)

    multiplier = Decimal("1") + Decimal(setting.tax_rate) + Decimal(setting.service_rate)
    if multiplier <= 0:
        subtotal = 0
        total_from_subtotal = 0
    else:
        subtotal = _round_yen(total_sales / multiplier, setting.rounding_mode)
        total_from_subtotal = _round_yen(Decimal(subtotal) * multiplier, setting.rounding_mode)

    return Response(
        {
            "year": year,
            "month": month,
            "store_id": str(store.id),
            "store_name": store.name,
            "tax_rate": str(setting.tax_rate),
            "service_rate": str(setting.service_rate),
            "rounding_mode": setting.rounding_mode,
            "groups": groups,
            "total_sales": int(total_sales),
            "subtotal_estimated": subtotal,
            "total_from_subtotal_estimated": total_from_subtotal,
        }
    )


@api_view(["POST"])
def jwt_login(request):
    """
    Authenticate by email + password; return access and refresh JWT.
    Body: { "email": "...", "password": "..." }
    """
    email = request.data.get("email")
    password = request.data.get("password")
    if not email or not password:
        return Response(
            {"detail": "email and password required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        user = CmsUser.objects.get(email=email)
    except CmsUser.DoesNotExist:
        return Response(
            {"detail": "Invalid email or password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    if not check_password(password, user.password_hash):
        return Response(
            {"detail": "Invalid email or password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return _login_response(user)


def _login_response(user):
    """Build JWT login-style response for a CmsUser."""
    wrapper = CmsUserAuth(user)
    refresh = RefreshToken.for_user(wrapper)
    store_id = str(user.store_id) if user.store_id else None
    store_name = user.store.name if user.store else None
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user_id": str(user.id),
        "username": user.username or "",
        "email": user.email,
        "role": user.role,
        "store_id": store_id,
        "store_name": store_name,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def registration_mode(request):
    """
    Public endpoint. Returns whether an admin exists so the frontend can show the correct registration flow.
    When has_admin is true, new users must register as Cast with a store. Returns store list for the dropdown.
    """
    from .serializers import StoreSerializer

    has_admin = CmsUser.objects.filter(role__in=[CmsUser.Role.ADMIN, CmsUser.Role.OWNER]).exists()
    stores = list(Store.objects.all()) if has_admin else []
    return Response({
        "has_admin": has_admin,
        "registration_role": "Cast" if has_admin else "Admin",
        "stores": StoreSerializer(stores, many=True).data,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """
    Public registration. Body: { "username", "email", "password", "store" (optional for first admin) }.
    - If no admin user exists: create user with role Admin; store is optional (can register with no store).
    - If at least one admin exists: create user with role Cast; store is required and at least one store must exist.
    """
    email = (request.data.get("email") or "").strip()
    password = request.data.get("password")
    username = (request.data.get("username") or "").strip()
    store_id = request.data.get("store")

    if not email or not password:
        return Response(
            {"detail": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if CmsUser.objects.filter(email=email).exists():
        return Response(
            {"detail": "A user with this email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    has_admin = CmsUser.objects.filter(role__in=[CmsUser.Role.ADMIN, CmsUser.Role.OWNER]).exists()
    if has_admin:
        # Registering as Cast: store is required and must exist
        if not Store.objects.exists():
            return Response(
                {"detail": "No stores available. An administrator must create a store first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not store_id:
            return Response(
                {"detail": "Store selection is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            store = Store.objects.get(pk=store_id)
        except (Store.DoesNotExist, ValueError, TypeError):
            return Response(
                {"detail": "Invalid store."},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        # First user: register as Admin; store is optional (no store yet)
        store = None
        if store_id:
            try:
                store = Store.objects.get(pk=store_id)
            except (Store.DoesNotExist, ValueError, TypeError):
                pass  # ignore invalid store when no stores exist; use store=None

    role = CmsUser.Role.ADMIN if not has_admin else CmsUser.Role.CAST
    user = CmsUser.objects.create(
        email=email,
        username=username,
        password_hash=make_password(password),
        role=role,
        store=store,
    )
    return _login_response(user)