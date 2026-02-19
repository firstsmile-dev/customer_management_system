from django.contrib.auth.hashers import check_password
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .auth import CmsUserAuth
from .models import CmsUser, Customer, CustomerDetail, CustomerProfile, StaffMember, Store, VisitRecord
from .serializers import (
    CustomerDetailSerializer,
    CustomerProfileSerializer,
    CustomerSerializer,
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
    """CRUD for users (CmsUser). Passwords are hashed; never stored or returned in plain text."""
    queryset = CmsUser.objects.all()
    serializer_class = UserSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    """CRUD for the `customers` table only. Profile/detail/preferences are separate."""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer


class StaffMemberViewSet(viewsets.ModelViewSet):
    """CRUD for the `staff_members` table."""

    queryset = StaffMember.objects.all()
    serializer_class = StaffMemberSerializer


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
    wrapper = CmsUserAuth(user)
    refresh = RefreshToken.for_user(wrapper)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user_id": str(user.id),
        "email": user.email,
        "role": user.role,
    })