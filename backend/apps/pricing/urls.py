from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MarketPriceViewSet, PriceAlertViewSet

router = DefaultRouter()
router.register(r'market-prices', MarketPriceViewSet, basename='marketprice')
router.register(r'alerts', PriceAlertViewSet, basename='pricealert')

urlpatterns = [
    path('', include(router.urls)),
]
