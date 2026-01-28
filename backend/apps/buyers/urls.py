from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BuyerProfileViewSet

router = DefaultRouter()
router.register(r'profiles', BuyerProfileViewSet, basename='buyerprofile')

urlpatterns = [
    path('', include(router.urls)),
]
