import os
import django
import sys

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from apps.ussd.views import ussd_callback
from django.contrib.auth import get_user_model

User = get_user_model()

def test_ussd_flow():
    factory = RequestFactory()
    
    # Cleanup
    User.objects.filter(phone_number__in=['254700000001', '254700000002']).delete()
    
    print("--- Testing Farmer Registration ---")
    # Step 1: Initial Request (Unregistered)
    req = factory.post('/api/ussd/', {'phoneNumber': '254700000001', 'text': '', 'sessionId': '123', 'serviceCode': '*123#'})
    resp = ussd_callback(req)
    print(f"1. Init: {resp.content.decode()}")
    
    # Step 2: Select Farmer
    req = factory.post('/api/ussd/', {'phoneNumber': '254700000001', 'text': '1', 'sessionId': '123', 'serviceCode': '*123#'})
    resp = ussd_callback(req)
    print(f"2. Role: {resp.content.decode()}")

    # Step 3: Enter Name
    req = factory.post('/api/ussd/', {'phoneNumber': '254700000001', 'text': '1*John Doe', 'sessionId': '123', 'serviceCode': '*123#'})
    resp = ussd_callback(req)
    print(f"3. Name: {resp.content.decode()}")

    # Step 4: Enter PIN
    req = factory.post('/api/ussd/', {'phoneNumber': '254700000001', 'text': '1*John Doe*1234', 'sessionId': '123', 'serviceCode': '*123#'})
    resp = ussd_callback(req)
    print(f"4. PIN: {resp.content.decode()}")
    
    print("\n--- Testing Farmer Add Product ---")
    # Step 1: Menu
    req = factory.post('/api/ussd/', {'phoneNumber': '254700000001', 'text': '', 'sessionId': '124', 'serviceCode': '*123#'})
    resp = ussd_callback(req)
    print(f"1. Menu: {resp.content.decode()}")

    # Step 2: Add Product
    req = factory.post('/api/ussd/', {'phoneNumber': '254700000001', 'text': '1', 'sessionId': '124', 'serviceCode': '*123#'})
    resp = ussd_callback(req)
    print(f"2. Add Prod: {resp.content.decode()}")
    
    # Step 3: Name
    req = factory.post('/api/ussd/', {'phoneNumber': '254700000001', 'text': '1*Cabbage', 'sessionId': '124', 'serviceCode': '*123#'})
    resp = ussd_callback(req)
    print(f"3. Prod Name: {resp.content.decode()}")

    # Step 4: Price
    req = factory.post('/api/ussd/', {'phoneNumber': '254700000001', 'text': '1*Cabbage*50', 'sessionId': '124', 'serviceCode': '*123#'})
    resp = ussd_callback(req)
    print(f"4. Price: {resp.content.decode()}")

    # Step 5: Qty
    req = factory.post('/api/ussd/', {'phoneNumber': '254700000001', 'text': '1*Cabbage*50*100', 'sessionId': '124', 'serviceCode': '*123#'})
    resp = ussd_callback(req)
    print(f"5. Qty: {resp.content.decode()}")

    print("\n--- Testing Buyer Registration ---")
    # One-shot registration
    req = factory.post('/api/ussd/', {'phoneNumber': '254700000002', 'text': '2*Alice Buyer*5678', 'sessionId': '125', 'serviceCode': '*123#'})
    resp = ussd_callback(req)
    print(f"1. Register: {resp.content.decode()}")
    
    print("\n--- Testing Buyer Buy Product ---")
    # Step 1: Menu
    req = factory.post('/api/ussd/', {'phoneNumber': '254700000002', 'text': '', 'sessionId': '126', 'serviceCode': '*123#'})
    resp = ussd_callback(req)
    print(f"1. Menu: {resp.content.decode()}")

    # Step 2: List Products
    req = factory.post('/api/ussd/', {'phoneNumber': '254700000002', 'text': '1', 'sessionId': '126', 'serviceCode': '*123#'})
    resp = ussd_callback(req)
    print(f"2. List: {resp.content.decode()}")
    
    # Step 3: Select Product (1)
    req = factory.post('/api/ussd/', {'phoneNumber': '254700000002', 'text': '1*1', 'sessionId': '126', 'serviceCode': '*123#'})
    resp = ussd_callback(req)
    print(f"3. Select: {resp.content.decode()}")

    # Step 4: Qty
    req = factory.post('/api/ussd/', {'phoneNumber': '254700000002', 'text': '1*1*10', 'sessionId': '126', 'serviceCode': '*123#'})
    resp = ussd_callback(req)
    print(f"4. Buy: {resp.content.decode()}")

if __name__ == "__main__":
    test_ussd_flow()
