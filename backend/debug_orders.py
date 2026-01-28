import os
import django
import sys

# Add the project root to the Python path
sys.path.append('/Users/Macbook/farmer_market_pool/backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.orders.models import Order
from apps.farmers.models import User

print("--- Users ---")
for user in User.objects.all():
    print(f"User: {user.username}, Type: {user.user_type}")

print("\n--- Orders ---")
for order in Order.objects.all():
    print(f"Order ID: {order.id}, Buyer: {order.buyer.username}, Status: '{order.status}'")
