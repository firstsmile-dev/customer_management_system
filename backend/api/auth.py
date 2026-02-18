"""
JWT authentication for CmsUser (api.users table).
Access tokens carry user_id; we resolve to CmsUser and attach a wrapper as request.user.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken

from .models import CmsUser


class CmsUserAuth:
    """Minimal user object for request.user when authenticated via JWT (CmsUser)."""
    def __init__(self, cms_user: CmsUser):
        self.cms_user = cms_user
        self.id = cms_user.id
        self.pk = cms_user.id
        self.is_authenticated = True


class CmsUserJWTAuthentication(JWTAuthentication):
    """Resolve JWT payload user_id to CmsUser and return CmsUserAuth wrapper."""
    def get_user(self, validated_token):
        try:
            user_id = validated_token.get("user_id")
            if user_id is None:
                raise InvalidToken("Token has no user_id")
            cms_user = CmsUser.objects.get(pk=user_id)
        except CmsUser.DoesNotExist:
            raise InvalidToken("User not found")
        return CmsUserAuth(cms_user)
