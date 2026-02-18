from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Store
from .serializers import StoreSerializer


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