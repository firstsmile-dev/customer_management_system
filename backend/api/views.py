from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def api_home(request):
    return Response({
        "message": "Django API is working!",
        "status": "success",
        "data": "Ready to connect with React"
    })