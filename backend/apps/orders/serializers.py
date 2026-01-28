from rest_framework import serializers
from .models import Order, OrderItem
from apps.products.serializers import ProductSerializer
from apps.farmers.serializers import UserSerializer
from apps.logistics.models import Delivery, CollectionPoint, DeliveryPartner


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'unit_price', 'subtotal']


class OrderSerializer(serializers.ModelSerializer):
    buyer = UserSerializer(read_only=True)
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    
    # Delivery fields
    delivery_method = serializers.ChoiceField(
        choices=['pickup', 'delivery'], 
        write_only=True,
        default='delivery'
    )
    collection_point_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    escrow_id = serializers.PrimaryKeyRelatedField(source='escrow', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'buyer', 'product', 'product_id',
            'quantity', 'unit_price', 'subtotal', 'commission',
            'total_amount', 'status', 'delivery_address', 'delivery_county',
            'notes', 'created_at', 'updated_at', 'delivered_at', 'items',
            'delivery_method', 'collection_point_id', 'escrow_id'
        ]
        read_only_fields = [
            'id', 'order_number', 'buyer', 'unit_price', 'subtotal',
            'commission', 'total_amount', 'status', 'created_at',
            'updated_at', 'delivered_at'
        ]
    
    def validate_product_id(self, value):
        from apps.products.models import Product
        if not Product.objects.filter(id=value, status='available').exists():
            raise serializers.ValidationError("Product not found or not available")
        return value

    def create(self, validated_data):
        from apps.products.models import Product
        
        # Extract delivery data
        delivery_method = validated_data.pop('delivery_method', 'delivery')
        collection_point_id = validated_data.pop('collection_point_id', None)
        
        product_id = validated_data.pop('product_id')
        product = Product.objects.get(id=product_id, status='available')
        
        quantity = validated_data['quantity']
        
        # Set unit price from product
        validated_data['product'] = product
        validated_data['unit_price'] = product.price_per_unit
        validated_data['subtotal'] = quantity * product.price_per_unit
        validated_data['buyer'] = self.context['request'].user
        
        # If pickup, set delivery address to collection point address
        collection_point = None
        if delivery_method == 'pickup' and collection_point_id:
            try:
                collection_point = CollectionPoint.objects.get(id=collection_point_id)
                validated_data['delivery_address'] = collection_point.address
                validated_data['delivery_county'] = collection_point.county
            except CollectionPoint.DoesNotExist:
                raise serializers.ValidationError({"collection_point_id": "Invalid collection point"})
        
        # Create order
        order = super().create(validated_data)
        
        # Create Delivery Record
        delivery = Delivery.objects.create(
            order=order,
            pickup_address=f"{product.county}, {product.ward}", # Simplified farmer location
            delivery_address=validated_data['delivery_address'],
            collection_point=collection_point,
            status='pending'
        )
        
        # Update product status
        if product.quantity <= quantity:
            product.status = 'pending'
        product.save()
        
        return order


class OrderUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating order status"""
    class Meta:
        model = Order
        fields = ['status', 'notes']
    
    def validate_status(self, value):
        """Validate status transitions"""
        order = self.instance
        valid_transitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['paid', 'cancelled'],
            'paid': ['in_transit', 'cancelled'],
            'in_transit': ['delivered', 'cancelled'],
            'delivered': ['completed'],
        }
        
        if order.status in valid_transitions:
            if value not in valid_transitions[order.status]:
                raise serializers.ValidationError(
                    f"Cannot transition from {order.status} to {value}"
                )
        return value
