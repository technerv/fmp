import os
import django
import sys
from decimal import Decimal

sys.path.append('/Users/Macbook/farmer_market_pool/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.orders.models import Order
from apps.farmers.models import User
from apps.products.models import Product

buyer = User.objects.get(phone_number='254113932323')
# Find a product (or create one if needed, but let's try to find one)
product = Product.objects.first()

if not product:
    print("No products found!")
    sys.exit(1)

# Create a completed order
order = Order.objects.create(
    buyer=buyer,
    product=product,
    quantity=1,
    unit_price=product.price_per_unit,
    subtotal=product.price_per_unit,
    total_amount=product.price_per_unit, # simplified
    status='completed',
    delivery_address='Test Address',
    delivery_county='Nairobi'
)

print(f"Created Order {order.order_number} with status 'completed' for user {buyer.username}")
