
import os
from decimal import Decimal
from math import radians, cos, sin, asin, sqrt

def test_haversine_full():
    try:
        lat = 0.528762128747672 # float
        lng = 35.255566796543405 # float
        
        product_lat = Decimal('0.530000')
        product_lng = Decimal('35.260000')
        
        print("--- Testing Full Haversine with Decimal ---")
        
        # d_lat = radians(product.latitude - type(product.latitude)(lat))
        d_lat = radians(product_lat - type(product_lat)(lat))
        d_lng = radians(product_lng - type(product_lng)(lng))
        
        print(f"d_lat: {d_lat} (type: {type(d_lat)})")
        
        # a = sin(d_lat / 2)**2 + cos(radians(lat)) * cos(radians(product.latitude)) * sin(d_lng / 2)**2
        
        term1 = sin(d_lat / 2)**2
        print(f"term1: {term1}")
        
        term2_part1 = cos(radians(lat)) # float input
        print(f"term2_part1: {term2_part1}")
        
        print("Attempting cos(radians(product_lat))...")
        term2_part2 = cos(radians(product_lat)) # Decimal input to radians, output float?
        print(f"term2_part2: {term2_part2}")
        
        term3 = sin(d_lng / 2)**2
        print(f"term3: {term3}")
        
        a = term1 + term2_part1 * term2_part2 * term3
        print(f"a: {a}")
        
        c = 2 * asin(sqrt(a))
        distance = 6371 * c
        
        print(f"Distance: {distance}")
        
    except Exception as e:
        print(f"Caught error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_haversine_full()
