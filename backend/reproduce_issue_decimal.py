
import os
import django
from decimal import Decimal
from math import radians, cos, sin, asin, sqrt

# Mock Django setup/imports isn't strictly necessary for math test
# but I'll write a standalone script to verify Decimal vs float in math functions

def test_haversine_with_decimal():
    try:
        lat = 0.528762128747672 # float from request
        product_lat = Decimal('0.528762') # Decimal from DB
        
        # This is what's in the code:
        # d_lat = radians(product_lat - type(product_lat)(lat))
        
        # Step 1: cast lat to Decimal
        lat_decimal = type(product_lat)(lat)
        print(f"lat_decimal type: {type(lat_decimal)}")
        
        # Step 2: subtraction
        diff = product_lat - lat_decimal
        print(f"diff type: {type(diff)}")
        
        # Step 3: radians
        print("Attempting radians(diff)...")
        r = radians(diff)
        print("Success!")
        
    except Exception as e:
        print(f"Caught expected error: {e}")

if __name__ == "__main__":
    test_haversine_with_decimal()
