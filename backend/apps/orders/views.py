from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Order
from .serializers import OrderSerializer, OrderUpdateSerializer
from apps.notifications.utils import send_notification


class OrderViewSet(viewsets.ModelViewSet):
    """CRUD operations for orders"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'product', 'delivery_county']
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'buyer':
            return Order.objects.filter(buyer=user).select_related('product', 'buyer')
        elif user.user_type == 'farmer':
            return Order.objects.filter(product__farmer=user).select_related('product', 'buyer')
        return Order.objects.none()
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return OrderUpdateSerializer
        return OrderSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        order = serializer.save()
        # Notify Farmer
        send_notification(
            user=order.product.farmer,
            title="New Order Received",
            message=f"You have a new order for {order.product.name} (Qty: {order.quantity})",
            notification_type="order_created",
            related_id=str(order.id)
        )
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Farmer confirms order"""
        order = self.get_object()
        if order.product.farmer != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        order.status = 'confirmed'
        order.save()
        serializer = self.get_serializer(order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel order"""
        order = self.get_object()
        if order.buyer != request.user and order.product.farmer != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        order.status = 'cancelled'
        order.save()
        # Restore product availability
        if order.product.status == 'pending':
            order.product.status = 'available'
            order.product.save()
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Allow deleting orders only if they are completed, cancelled or rejected"""
        order = self.get_object()
        if order.status not in ['completed', 'cancelled', 'rejected']:
             return Response(
                {'error': 'Only completed, cancelled or rejected orders can be deleted'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)
