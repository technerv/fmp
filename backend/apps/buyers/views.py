from rest_framework import viewsets, permissions
from apps.farmers.models import BuyerProfile
from apps.farmers.serializers import BuyerProfileSerializer


class BuyerProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """View buyer profiles (public for farmers to see)"""
    queryset = BuyerProfile.objects.select_related('user').all()
    serializer_class = BuyerProfileSerializer
    permission_classes = [permissions.AllowAny]
