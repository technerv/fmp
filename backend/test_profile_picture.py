
import os
import django
from django.core.files.uploadedfile import SimpleUploadedFile

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.farmers.models import User, BuyerProfile, FarmerProfile
from apps.farmers.serializers import BuyerProfileSerializer, FarmerProfileSerializer

def test_buyer_profile_picture():
    print("Testing BuyerProfile picture upload...")
    
    # Create a dummy user
    phone = "254711000000"
    if User.objects.filter(phone_number=phone).exists():
        user = User.objects.get(phone_number=phone)
        if hasattr(user, 'buyer_profile'):
            user.buyer_profile.delete()
        user.delete()
        
    user = User.objects.create_user(
        phone_number=phone,
        username=phone,
        password="password123",
        user_type="buyer"
    )
    
    # Create profile
    profile = BuyerProfile.objects.create(
        user=user,
        buyer_type="individual",
        county="Nairobi"
    )
    
    # Mock file upload
    # Smallest valid GIF
    image_content = (
        b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00'
        b'\xff\xff\xff\x21\xf9\x04\x00\x00\x00\x00\x00\x2c\x00\x00\x00\x00'
        b'\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b'
    )
    image = SimpleUploadedFile("test_image.gif", image_content, content_type="image/gif")
    
    # Update profile using serializer (mimicking view behavior)
    data = {
        "profile_picture": image
    }
    
    serializer = BuyerProfileSerializer(profile, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        print("Serializer valid. Saved.")
        
        # Verify
        profile.refresh_from_db()
        if profile.profile_picture:
            print(f"Success! Profile picture saved at: {profile.profile_picture.url}")
        else:
            print("Failed! Profile picture is empty.")
    else:
        print("Serializer errors:", serializer.errors)
        
    # Cleanup
    # user.delete() # Keep it for inspection if needed, or delete

if __name__ == "__main__":
    test_buyer_profile_picture()
