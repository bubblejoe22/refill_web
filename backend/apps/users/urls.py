from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, UserProfileViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'profiles', UserProfileViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # Include Djoser user management and token auth
    path('', include('djoser.urls')),          # registration, password reset, etc.
    path('', include('djoser.urls.authtoken')), # login/logout with token
]