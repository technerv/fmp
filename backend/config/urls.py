"""
URL configuration for farmer_market_pool project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.farmers.urls')),
    path('api/farmers/', include('apps.farmers.urls')),
    path('api/buyers/', include('apps.buyers.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/logistics/', include('apps.logistics.urls')),
    path('api/pricing/', include('apps.pricing.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/chat/', include('apps.chatbot.urls')),
    path('api/ussd/', include('apps.ussd.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
