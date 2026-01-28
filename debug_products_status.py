import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
try:
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    sys.exit(1)

from apps.products.models import Product
from django.db.models import Count

def check_products():
    print("Checking Product counts by status:")
    counts = Product.objects.values('status').annotate(total=Count('id'))
    for entry in counts:
        print(f"Status: {entry['status']}, Count: {entry['total']}")
        
    print("\nSample available products:")
    available = Product.objects.filter(status='available')[:5]
    for p in available:
        print(f"ID: {p.id}, UUID: {p.uuid}, Name: {p.name}, Status: {p.status}")

    print("\nTotal products:", Product.objects.count())

if __name__ == "__main__":
    check_products()
