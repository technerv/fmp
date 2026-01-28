from rest_framework import viewsets, filters, permissions
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from .models import MarketPrice, PriceAlert
from .serializers import MarketPriceSerializer, PriceAlertSerializer


class MarketPriceViewSet(viewsets.ReadOnlyModelViewSet):
    """List and retrieve market prices"""
    queryset = MarketPrice.objects.select_related('category').all()
    serializer_class = MarketPriceSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'county', 'date']
    ordering_fields = ['date', 'price_per_unit']
    ordering = ['-date']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Default to today's prices or most recent
        days = self.request.query_params.get('days', 7)
        if days:
            try:
                days = int(days)
                cutoff_date = timezone.now().date() - timedelta(days=days)
                queryset = queryset.filter(date__gte=cutoff_date)
            except ValueError:
                pass
        return queryset


class PriceAlertViewSet(viewsets.ModelViewSet):
    """Manage price alerts"""
    serializer_class = PriceAlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'is_active']
    
    def get_queryset(self):
        return PriceAlert.objects.filter(farmer=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user)
