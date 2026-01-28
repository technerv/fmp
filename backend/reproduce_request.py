
import os
import sys
import django
from django.core.files.uploadedfile import SimpleUploadedFile

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from rest_framework import status
from apps.products.models import Product, ProductImage, Category
from apps.farmers.models import User

def reproduce_request():
    print("Setting up test data...")
    # Create user
    user, _ = User.objects.get_or_create(
        phone_number='254700000000', 
        defaults={'password': 'password123', 'user_type': 'farmer', 'username': 'testfarmer'}
    )
    
    # Create category
    category, _ = Category.objects.get_or_create(name='Test Category', slug='test-category')
    
    # Create product
    product, _ = Product.objects.get_or_create(
        farmer=user,
        category=category,
        name='Test Product Request',
        defaults={
            'quantity': 100,
            'price_per_unit': 50,
            'harvest_date': '2025-12-31',
            'county': 'Nairobi'
        }
    )
    
    print(f"Product UUID: {product.uuid}")
    
    # Setup client
    client = APIClient()
    client.force_authenticate(user=user)
    
    url = f'/api/products/{product.uuid}/upload-media/'
    print(f"POSTing to {url}")
    
    # Test 1: Successful upload
    print("\n--- Test 1: Valid Image Upload ---")
    file_content = b'fake image content'
    file = SimpleUploadedFile("test_upload.jpg", file_content, content_type="image/jpeg")
    
    try:
        response = client.post(
            url,
            {'files': [file]},
            format='multipart'
        )
        print(f"Status: {response.status_code}")
        if response.status_code != 201:
            print(f"Content: {response.content}")
    except Exception as e:
        print(f"Exception: {e}")

    # Test 2: Invalid file content but valid extension (Corrupt image)
    print("\n--- Test 2: Corrupt Image Content ---")
    file_content = b'not an image'
    file = SimpleUploadedFile("corrupt.jpg", file_content, content_type="image/jpeg")
    
    try:
        response = client.post(
            url,
            {'files': [file]},
            format='multipart'
        )
        print(f"Status: {response.status_code}")
        if response.status_code != 201:
            print(f"Content: {response.content}")
    except Exception as e:
        print(f"Exception: {e}")

    # Test 3: Video upload
    print("\n--- Test 3: Video Upload ---")
    file_content = b'fake video content'
    file = SimpleUploadedFile("test.mp4", file_content, content_type="video/mp4")
    
    try:
        response = client.post(
            url,
            {'files': [file]},
            format='multipart'
        )
        print(f"Status: {response.status_code}")
        if response.status_code != 201:
            print(f"Content: {response.content}")
    except Exception as e:
        print(f"Exception: {e}")

    # Test 5: Wrong Content-Type
    print("\n--- Test 5: Wrong Content-Type (application/json) ---")
    file_content = b'fake image content'
    file = SimpleUploadedFile("test_upload.jpg", file_content, content_type="image/jpeg")
    
    try:
        # Note: APIClient.post overrides content_type if data is dict. 
        # We need to manually construct request to simulate this edge case if possible,
        # but APIClient makes it hard to send multipart body with json header.
        # Instead, we can try to send it as 'json' format but with file data (which won't work standardly).
        # Let's just try to set content_type explicitly to application/json while sending data.
        
        response = client.post(
            url,
            {'files': [file]},
            content_type='application/json' # This might not even send the body correctly in test client
        )
        print(f"Status: {response.status_code}")
        print(f"Content: {response.content}")
    except Exception as e:
        print(f"Exception: {e}")


if __name__ == '__main__':
    reproduce_request()
