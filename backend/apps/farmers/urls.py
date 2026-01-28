from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'verification', views.VerificationDocumentViewSet, basename='verification')
router.register(r'admin/users', views.AdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', views.CurrentUserView.as_view(), name='current_user'),
    path('profile/farmer/', views.FarmerProfileView.as_view(), name='farmer_profile'),
    path('profile/buyer/', views.BuyerProfileView.as_view(), name='buyer_profile'),
    path('admin/stats/', views.DashboardStatsView.as_view(), name='admin_stats'),
    path('', include(router.urls)),
]
