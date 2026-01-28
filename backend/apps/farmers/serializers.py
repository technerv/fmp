from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, FarmerProfile, BuyerProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'phone_number', 'email', 'username', 'user_type', 'is_verified', 'is_staff', 'is_superuser', 'is_active']
        read_only_fields = ['id', 'is_verified', 'is_staff', 'is_superuser', 'is_active']


class FarmerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = FarmerProfile
        fields = [
            'id', 'user', 'county', 'ward', 'latitude', 'longitude',
            'farm_size_acres', 'crops_specialization', 'years_farming', 'bio',
            'profile_picture', 'rating', 'total_sales', 'created_at'
        ]
        read_only_fields = ['id', 'rating', 'total_sales', 'created_at']


class BuyerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = BuyerProfile
        fields = [
            'id', 'user', 'business_name', 'buyer_type', 'county',
            'latitude', 'longitude', 'license_number', 'rating', 'total_purchases',
            'preferred_categories', 'created_at'
        ]
        read_only_fields = ['id', 'rating', 'total_purchases', 'created_at']


class RegisterSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField(required=False)
    user_type = serializers.ChoiceField(choices=['farmer', 'buyer'])
    
    def validate_phone_number(self, value):
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("Phone number already registered")
        return value
    
    def create(self, validated_data):
        user = User.objects.create_user(
            phone_number=validated_data['phone_number'],
            username=validated_data.get('phone_number'),
            password=validated_data['password'],
            email=validated_data.get('email', ''),
            user_type=validated_data['user_type']
        )
        return user


class LoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        phone_number = attrs.get('phone_number')
        password = attrs.get('password')
        
        if phone_number and password:
            user = authenticate(request=self.context.get('request'),
                              username=phone_number, password=password)
            if not user:
                raise serializers.ValidationError('Invalid phone number or password')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include phone_number and password')


from .models import VerificationDocument

class VerificationDocumentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = VerificationDocument
        fields = ['id', 'user_details', 'document_type', 'document_file', 'status', 'admin_notes', 'submitted_at']
        read_only_fields = ['id', 'status', 'admin_notes', 'submitted_at', 'user_details']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
