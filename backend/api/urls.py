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
router.register(r"customer-profiles", views.CustomerProfileViewSet, basename="customer-profile")
router.register(r"customer-details", views.CustomerDetailViewSet, basename="customer-detail")
router.register(r"customer-preferences", views.CustomerPreferenceViewSet, basename="customer-preference")
router.register(r"performance-targets", views.PerformanceTargetViewSet, basename="performance-target")
router.register(r"daily-summaries", views.DailySummaryViewSet, basename="daily-summary")
router.register(r"advance-requests", views.AdvanceRequestViewSet, basename="advance-request")

urlpatterns = [
    path("", views.api_home),
    path("auth/login/", views.jwt_login),
    path("auth/registration-mode/", views.registration_mode),
    path("auth/register/", views.register),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("my-page/salary/", views.my_page_salary),
    path("", include(router.urls)),
]
