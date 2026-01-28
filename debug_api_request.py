import os
import django
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from apps.products.views import ProductViewSet
from apps.farmers.models import User

def debug_request():
    factory = APIRequestFactory()
    
    # Create a temp admin user
    email = 'temp_admin_debug@example.com'
    if not User.objects.filter(email=email).exists():
        user = User.objects.create_user(
            username='temp_admin',
            email=email,
            password='password123',
            first_name='Temp',
            last_name='Admin',
            phone_number='+254700000000'
        )
        user.is_staff = True
        user.is_superuser = True
        user.save()
    else:
        user = User.objects.get(email=email)
        if not user.is_staff:
            user.is_staff = True
            user.save()
            
    print(f"User: {user.email}, Is Staff: {user.is_staff}")
    
    # Create request
    view = ProductViewSet.as_view({'get': 'list'})
    request = factory.get('/products/', {'status': 'available', 'page': 1})
    force_authenticate(request, user=user)
    
    print("\n--- Making Request ---")
    response = view(request)
    print(f"Response Status: {response.status_code}")
    if hasattr(response, 'data'):
        data = response.data
        if 'results' in data:
            print(f"Results count: {len(data['results'])}")
            print(f"Total count: {data['count']}")
        else:
            print(f"Data: {data}")
    else:
        print("No data in response")

    # Clean up
    # user.delete() # Keep it for now

if __name__ == "__main__":
    debug_request()
