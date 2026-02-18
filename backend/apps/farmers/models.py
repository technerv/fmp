from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Custom user model for both farmers and buyers"""
    USER_TYPES = (
        ('farmer', 'Farmer'),
        ('buyer', 'Buyer'),
        ('admin', 'Admin'),
    )
    
    phone_number = models.CharField(max_length=15, unique=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPES)
    national_id = models.CharField(max_length=20, blank=True, null=True)
    mpesa_number = models.CharField(max_length=15, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['username', 'email']
    
    def __str__(self):
        return f"{self.phone_number} - {self.user_type}"


class FarmerProfile(models.Model):
    """Extended profile for farmers"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='farmer_profile')
    county = models.CharField(max_length=100)
    ward = models.CharField(max_length=100)
    # GPS coordinates using decimal fields (no GDAL/PostGIS required)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, help_text="Latitude (-1.2921)")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, help_text="Longitude (36.8219)")
    farm_size_acres = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    crops_specialization = models.JSONField(default=list, blank=True)  # List of crop types
    years_farming = models.IntegerField(default=0)
    bio = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to='farmers/', blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_sales = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.phone_number} - {self.county}"
    
    def has_location(self):
        """Check if farmer has GPS coordinates"""
        return self.latitude is not None and self.longitude is not None


class BuyerProfile(models.Model):
    """Extended profile for buyers"""
    BUYER_TYPES = (
        ('retailer', 'Retailer'),
        ('hotel', 'Hotel/Restaurant'),
        ('exporter', 'Exporter'),
        ('individual', 'Individual'),
        ('wholesaler', 'Wholesaler'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='buyer_profile')
    business_name = models.CharField(max_length=200, blank=True)
    buyer_type = models.CharField(max_length=20, choices=BUYER_TYPES)
    county = models.CharField(max_length=100)
    # GPS coordinates using decimal fields
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, help_text="Latitude")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, help_text="Longitude")
    license_number = models.CharField(max_length=100, blank=True)
    profile_picture = models.ImageField(upload_to='buyers/', blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_purchases = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    preferred_categories = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.business_name or self.user.phone_number} - {self.buyer_type}"
    
    def has_location(self):
        """Check if buyer has GPS coordinates"""
        return self.latitude is not None and self.longitude is not None


class VerificationDocument(models.Model):
    """Documents submitted for user verification"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    DOCUMENT_TYPES = (
        ('national_id', 'National ID'),
        ('business_permit', 'Business Permit'),
        ('certificate', 'Registration Certificate'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_documents')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    document_file = models.FileField(upload_to='verification_docs/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.phone_number} - {self.document_type} ({self.status})"