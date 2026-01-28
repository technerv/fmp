
import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.handlers.asgi import ASGIHandler
from django.test import RequestFactory
from channels.testing import HttpCommunicator
from apps.products.views import CategoryViewSet
from django.urls import path
from rest_framework import routers

# Define a simple URL conf for testing
router = routers.DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
urlpatterns = router.urls

async def test_request():
    # Use the full path as defined in config.urls -> apps.products.urls
    communicator = HttpCommunicator(ASGIHandler(), "GET", "/api/products/categories/")
    response = await communicator.get_response()
    print(f"Status: {response['status']}")
    print(f"Body: {response['body']}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_request())
