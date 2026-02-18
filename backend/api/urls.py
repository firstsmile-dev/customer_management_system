from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register(r"stores", views.StoreViewSet, basename="store")
router.register(r"users", views.UserViewSet, basename="user")
router.register(r"customers", views.CustomerViewSet, basename="customer")
router.register(r"staff-members", views.StaffMemberViewSet, basename="staff-member")
router.register(r"visit-records", views.VisitRecordViewSet, basename="visit-record")

urlpatterns = [
    path("", views.api_home),
    path("auth/login/", views.jwt_login),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("", include(router.urls)),
]
