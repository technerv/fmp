from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, EscrowViewSet, WalletViewSet, PayoutViewSet, mpesa_callback

router = DefaultRouter()
router.register(r'escrow', EscrowViewSet, basename='escrow')
router.register(r'wallet', WalletViewSet, basename='wallet')
router.register(r'payouts', PayoutViewSet, basename='payout')
router.register(r'', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
    path('mpesa/callback/', mpesa_callback, name='mpesa_callback'),
    path('initiate/', PaymentViewSet.as_view({'post': 'initiate'}), name='payment_initiate'),
]
