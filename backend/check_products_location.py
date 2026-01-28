import os
import django
import sys

sys.path.append('/Users/Macbook/farmer_market_pool/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product
from apps.farmers.models import FarmerProfile
from apps.products.serializers import ProductSerializer

def check_products():
    products = Product.objects.all()
    print(f"Found {products.count()} products.")
    
    for product in products:
        print(f"Product: {product.name} (ID: {product.id})")
        print(f"  DB Lat/Long: {product.latitude}, {product.longitude}")
        
        if hasattr(product.farmer, 'farmer_profile'):
            print(f"  Farmer Profile Lat/Long: {product.farmer.farmer_profile.latitude}, {product.farmer.farmer_profile.longitude}")
        else:
            print("  No Farmer Profile")
            
        serializer = ProductSerializer(product)
        data = serializer.data
        print(f"  Serialized Lat/Long: {data.get('latitude')}, {data.get('longitude')}")
        print("-" * 20)

if __name__ == "__main__":
    check_products()
