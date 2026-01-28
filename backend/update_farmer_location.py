import os
import django
import sys
from decimal import Decimal

sys.path.append('/Users/Macbook/farmer_market_pool/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product
from apps.farmers.models import FarmerProfile
from apps.products.serializers import ProductSerializer

def update_farmer_location():
    product = Product.objects.first()
    if not product:
        print("No products found")
        return

    print(f"Updating farmer for product: {product.name}")
    farmer = product.farmer
    
    # Get or create profile
    profile, created = FarmerProfile.objects.get_or_create(user=farmer)
    
    # Set Nairobi coordinates
    profile.latitude = Decimal('-1.2921')
    profile.longitude = Decimal('36.8219')
    profile.county = "Nairobi"
    profile.ward = "CBD"
    profile.save()
    
    print(f"Updated farmer {farmer.username} profile location to Nairobi.")
    
    # Verify serializer
    serializer = ProductSerializer(product)
    data = serializer.data
    print(f"Serialized Lat/Long: {data.get('latitude')}, {data.get('longitude')}")

if __name__ == "__main__":
    update_farmer_location()
