
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

try:
    from apps.orders.serializers import OrderSerializer
    print("Successfully imported OrderSerializer")
except Exception as e:
    print(f"Failed to import OrderSerializer: {e}")
