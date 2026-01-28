from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import CollectionPoint, DeliveryPartner, Delivery
from .serializers import (
    CollectionPointSerializer, DeliveryPartnerSerializer, DeliverySerializer
)


class CollectionPointViewSet(viewsets.ReadOnlyModelViewSet):
    """List collection points"""
    queryset = CollectionPoint.objects.filter(is_active=True)
    serializer_class = CollectionPointSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['county', 'ward']
    search_fields = ['name', 'county', 'ward']


class DeliveryPartnerViewSet(viewsets.ReadOnlyModelViewSet):
    """List delivery partners"""
    queryset = DeliveryPartner.objects.filter(is_active=True)
    serializer_class = DeliveryPartnerSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['service_counties']


class DeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    """View deliveries"""
    serializer_class = DeliverySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'tracking_number']
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'buyer':
            return Delivery.objects.filter(order__buyer=user)
        elif user.user_type == 'farmer':
            return Delivery.objects.filter(order__product__farmer=user)
        return Delivery.objects.none()
