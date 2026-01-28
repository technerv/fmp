
import os
import sys
import django
from django.core.files.uploadedfile import SimpleUploadedFile

# Add current directory to path so we can import apps and config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product, ProductImage, Category
from apps.farmers.models import User
from apps.products.serializers import ProductImageSerializer
from unittest.mock import Mock

def reproduce():
    try:
        # Create dummy user and product
        user, _ = User.objects.get_or_create(phone_number='1234567890', defaults={'password': 'pass', 'user_type': 'farmer'})
        category, _ = Category.objects.get_or_create(name='Test Cat', slug='test-cat')
        product, _ = Product.objects.get_or_create(
            farmer=user, 
            category=category, 
            name='Test Product', 
            defaults={
                'quantity': 10, 
                'price_per_unit': 100, 
                'harvest_date': '2025-01-01',
                'county': 'Test'
            }
        )

        # Mock request for serializer context
        request = Mock()
        request.build_absolute_uri = lambda x: f"http://testserver{x}"

        # Create dummy file
        file_content = b'test content'
        uploaded_file = SimpleUploadedFile("test.jpg", file_content, content_type="image/jpeg")

        print("Attempting to create ProductImage...")
        img = ProductImage.objects.create(
            product=product,
            file=uploaded_file,
            media_type='image',
            is_primary=True
        )
        print("ProductImage created successfully:", img)
        
        print("Attempting to serialize...")
        serializer = ProductImageSerializer(img, context={'request': request})
        print("Serialized data:", serializer.data)
        
    except Exception as e:
        print("Caught exception:", e)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    reproduce()
