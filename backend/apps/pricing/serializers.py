from rest_framework import serializers
from .models import MarketPrice, PriceAlert
from apps.products.serializers import CategorySerializer


class MarketPriceSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    price_floor = serializers.ReadOnlyField()
    
    class Meta:
        model = MarketPrice
        fields = [
            'id', 'category', 'county', 'price_per_unit', 'unit',
            'date', 'source', 'volume_traded', 'price_floor', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PriceAlertSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = PriceAlert
        fields = ['id', 'category', 'category_id', 'target_price', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        from apps.products.models import Category
        category_id = validated_data.pop('category_id')
        validated_data['category'] = Category.objects.get(id=category_id)
        validated_data['farmer'] = self.context['request'].user
        return super().create(validated_data)
