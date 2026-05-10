from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, UserAddress
from djoser.serializers import TokenSerializer

class CustomTokenSerializer(TokenSerializer):
    username = serializers.CharField(source='user.username')
    email    = serializers.CharField(source='user.email')
    is_staff = serializers.BooleanField(source='user.is_staff')

    class Meta(TokenSerializer.Meta):
        fields = ['auth_token', 'username', 'email', 'is_staff']
        
class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = ['id', 'address_text', 'is_default']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff']

class UserProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    addresses = UserAddressSerializer(many=True, read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'id', 'user_details', 'phone', 'payment_method', 
            'avatar_type', 'avatar_seed', 'points', 'sms_notifications', 
            'email_notifications', 'addresses', 'app_rating', 'rated_stations'
        ]