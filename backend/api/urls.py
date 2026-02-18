from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"stores", views.StoreViewSet, basename="store")

urlpatterns = [
    path("", views.api_home),
    path("", include(router.urls)),
]
