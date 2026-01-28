
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

try:
    from apps.orders.views import OrderViewSet
    print("Successfully imported OrderViewSet")
except Exception as e:
    print(f"Failed to import OrderViewSet: {e}")
