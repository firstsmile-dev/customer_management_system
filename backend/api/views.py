from django.contrib.auth.hashers import check_password, make_password
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .auth import CmsUserAuth
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
from .serializers import (
    CustomerDetailSerializer,
    CustomerPreferenceSerializer,
    CustomerProfileSerializer,
    CustomerSerializer,
    DailySummarySerializer,
    PerformanceTargetSerializer,
    StaffMemberSerializer,
    StoreSerializer,
    UserSerializer,
    VisitRecordSerializer,
)


@api_view(["GET"])
def api_home(request):
    return Response({
        "message": "Django API is working!",
        "status": "success",
        "data": "Ready to connect with React",
    })


class StoreViewSet(viewsets.ModelViewSet):
    """CRUD for stores."""
    queryset = Store.objects.all()
    serializer_class = StoreSerializer


class UserViewSet(viewsets.ModelViewSet):
    """CRUD for users (CmsUser). Passwords are hashed; never stored or returned in plain text.
    Only admins can change role or edit other users; non-admins can only update their own email and password.
    """
    queryset = CmsUser.objects.all()
    serializer_class = UserSerializer

    def _get_request_user_role(self):
        user = getattr(self.request, "user", None)
        if user is None or not getattr(user, "is_authenticated", False):
            return None
        return getattr(getattr(user, "cms_user", None), "role", None)

    def _is_admin(self):
        return self._get_request_user_role() == "Admin"

    def _request_user_pk(self):
        user = getattr(self.request, "user", None)
        if user is None:
            return None
        return getattr(user, "pk", None)

    def get_queryset(self):
        qs = super().get_queryset()
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
    """CRUD for the `customers` table only. Profile/detail/preferences are separate."""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer


class StaffMemberViewSet(viewsets.ModelViewSet):
    """CRUD for the `staff_members` table.
    Staff role: can only list/create/update/delete staff members whose user is Cast.
    """

    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer

    def _get_request_user_role(self):
        user = getattr(self.request, "user", None)
        if user is None or not getattr(user, "is_authenticated", False):
            return None
        return getattr(getattr(user, "cms_user", None), "role", None)

    def get_queryset(self):
        qs = super().get_queryset()
        role = self._get_request_user_role()
        if role == "Staff":
            return qs.filter(user__role=CmsUser.Role.CAST)
        return qs

    def create(self, request, *args, **kwargs):
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
    """CRUD for the `visit_records` table."""

    queryset = VisitRecord.objects.all()
    serializer_class = VisitRecordSerializer


class CustomerProfileViewSet(viewsets.ModelViewSet):
    """CRUD for the `customers_profile` table (one-to-one with Customer). Lookup by customer UUID."""

    queryset = CustomerProfile.objects.all()
    serializer_class = CustomerProfileSerializer
    lookup_url_kwarg = "customer_id"
    lookup_field = "customer"


class CustomerDetailViewSet(viewsets.ModelViewSet):
    """CRUD for the `customers_detail` table (one-to-one with Customer). Lookup by customer UUID."""

    queryset = CustomerDetail.objects.all()
    serializer_class = CustomerDetailSerializer
    lookup_url_kwarg = "customer_id"
    lookup_field = "customer"


class CustomerPreferenceViewSet(viewsets.ModelViewSet):
    """CRUD for the `customer_preferences` table (one-to-one with Customer). Lookup by customer UUID."""

    queryset = CustomerPreference.objects.all()
    serializer_class = CustomerPreferenceSerializer
    lookup_url_kwarg = "customer_id"
    lookup_field = "customer"


class PerformanceTargetViewSet(viewsets.ModelViewSet):
    """CRUD for the `performance_targets` table."""

    queryset = PerformanceTarget.objects.all()
    serializer_class = PerformanceTargetSerializer


class DailySummaryViewSet(viewsets.ModelViewSet):
    """CRUD for the `daily_summaries` table."""

    queryset = DailySummary.objects.all()
    serializer_class = DailySummarySerializer


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


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """
    Public registration. Body: { "username", "email", "password", "store" (optional for first admin) }.
    - If no admin user exists: create user with role Admin; store is optional (can register with no store).
    - Otherwise: create user with role Cast; store is required and at least one store must exist.
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

    has_admin = CmsUser.objects.filter(role=CmsUser.Role.ADMIN).exists()
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