from rest_framework import serializers
from .models import Category, Product, ProductImage
from apps.farmers.serializers import UserSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon']


class ProductImageSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = ['id', 'file', 'file_url', 'media_type', 'is_primary', 'created_at', 'image']
        read_only_fields = ['id', 'created_at']
    
    def get_file_url(self, obj):
        # Use file if available, otherwise fall back to image for backward compatibility
        file_field = obj.file if obj.file else obj.image
        if file_field:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(file_field.url)
            return file_field.url
        return None


class ProductSerializer(serializers.ModelSerializer):
    farmer = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False
    )
    images = serializers.SerializerMethodField()
    total_price = serializers.ReadOnlyField()
    distance_km = serializers.ReadOnlyField(required=False)  # For nearby products
    
    class Meta:
        model = Product
        fields = [
            'id', 'uuid', 'farmer', 'category', 'category_id', 'name', 'description',
            'quantity', 'unit', 'price_per_unit', 'total_price', 'harvest_date',
            'expiry_date', 'quality_grade', 'latitude', 'longitude', 'county', 'ward', 'status',
            'is_featured', 'images', 'distance_km', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'uuid', 'farmer', 'created_at', 'updated_at', 'distance_km']
    
    def get_images(self, obj):
        images = obj.product_images.all().order_by('-is_primary', 'created_at')
        return ProductImageSerializer(images, many=True, context=self.context).data

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Fallback to farmer's location if product location is missing
        if not ret.get('latitude') and hasattr(instance.farmer, 'farmer_profile'):
            ret['latitude'] = instance.farmer.farmer_profile.latitude
        if not ret.get('longitude') and hasattr(instance.farmer, 'farmer_profile'):
            ret['longitude'] = instance.farmer.farmer_profile.longitude
        
        # Ensure lat/long are floats for frontend
        if ret.get('latitude'):
            ret['latitude'] = float(ret['latitude'])
        if ret.get('longitude'):
            ret['longitude'] = float(ret['longitude'])
            
        return ret


class ProductCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating products (excludes some fields)"""
    category_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'uuid', 'category_id', 'name', 'description', 'quantity', 'unit',
            'price_per_unit', 'harvest_date', 'expiry_date', 'quality_grade',
            'latitude', 'longitude', 'county', 'ward'
        ]
        read_only_fields = ['id', 'uuid']
    
    def create(self, validated_data):
        category_id = validated_data.pop('category_id')
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            raise serializers.ValidationError({'category_id': 'Invalid category'})
        
        validated_data['category'] = category
        validated_data['farmer'] = self.context['request'].user
        
        # Auto-populate location from farmer profile if not provided
        if not validated_data.get('latitude') or not validated_data.get('longitude'):
            if hasattr(self.context['request'].user, 'farmer_profile'):
                profile = self.context['request'].user.farmer_profile
                if profile.latitude and profile.longitude:
                    validated_data['latitude'] = profile.latitude
                    validated_data['longitude'] = profile.longitude
        
        return super().create(validated_data)
