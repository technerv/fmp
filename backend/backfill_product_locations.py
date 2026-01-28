import os
import django
import sys

sys.path.append('/Users/Macbook/farmer_market_pool/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product

def backfill_locations():
    products = Product.objects.filter(latitude__isnull=True) | Product.objects.filter(longitude__isnull=True)
    count = 0
    
    print(f"Found {products.count()} products missing location.")
    
    for product in products:
        if hasattr(product.farmer, 'farmer_profile'):
            profile = product.farmer.farmer_profile
            if profile.latitude and profile.longitude:
                product.latitude = profile.latitude
                product.longitude = profile.longitude
                product.county = profile.county # Also sync county/ward if missing?
                if not product.ward:
                    product.ward = profile.ward
                product.save()
                print(f"Updated product {product.name} with location from farmer {product.farmer.username}")
                count += 1
            else:
                print(f"Farmer {product.farmer.username} for product {product.name} has no location in profile.")
        else:
            print(f"Farmer {product.farmer.username} for product {product.name} has no profile.")
            
    print(f"Backfilled {count} products.")

if __name__ == "__main__":
    backfill_locations()
