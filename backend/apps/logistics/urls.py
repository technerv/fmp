from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CollectionPointViewSet, DeliveryPartnerViewSet, DeliveryViewSet

router = DefaultRouter()
router.register(r'collection-points', CollectionPointViewSet, basename='collectionpoint')
router.register(r'delivery-partners', DeliveryPartnerViewSet, basename='deliverypartner')
router.register(r'deliveries', DeliveryViewSet, basename='delivery')

urlpatterns = [
    path('', include(router.urls)),
]
