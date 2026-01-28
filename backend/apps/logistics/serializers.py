from rest_framework import serializers
from .models import CollectionPoint, DeliveryPartner, Delivery
from apps.orders.serializers import OrderSerializer


class CollectionPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollectionPoint
        fields = [
            'id', 'name', 'county', 'ward', 'address',
            'contact_person', 'contact_phone', 'operating_hours',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DeliveryPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryPartner
        fields = [
            'id', 'name', 'contact_person', 'contact_phone',
            'email', 'service_counties', 'is_active', 'rating', 'created_at'
        ]
        read_only_fields = ['id', 'rating', 'created_at']


class DeliverySerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    delivery_partner = DeliveryPartnerSerializer(read_only=True)
    collection_point = CollectionPointSerializer(read_only=True)
    
    class Meta:
        model = Delivery
        fields = [
            'id', 'order', 'delivery_partner', 'collection_point',
            'tracking_number', 'status', 'pickup_address', 'delivery_address',
            'estimated_delivery', 'delivered_at', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'tracking_number', 'status', 'delivered_at',
            'created_at', 'updated_at'
        ]
