from django.db import models
from django.core.files.base import ContentFile
from apps.farmers.models import User
import uuid


class Category(models.Model):
    """Product categories (Crops, Livestock, etc.)"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)  # Icon name/emoji
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"


class Product(models.Model):
    """Farmer's product listing"""
    STATUS_CHOICES = (
        ('pending_approval', 'Pending Approval'),
        ('available', 'Available'),
        ('rejected', 'Rejected'),
        ('pending_sale', 'Pending Sale'),
        ('sold', 'Sold'),
        ('expired', 'Expired'),
    )
    
    QUALITY_GRADES = (
        ('premium', 'Premium'),
        ('standard', 'Standard'),
        ('fair', 'Fair'),
    )
    
    farmer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    name = models.CharField(max_length=200)  # e.g., "Maize", "Potatoes", "Tomatoes"
    description = models.TextField(blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)  # in kgs/liters
    unit = models.CharField(max_length=20, default='kg')  # kg, liters, pieces, etc.
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    harvest_date = models.DateField()
    expiry_date = models.DateField(blank=True, null=True)
    quality_grade = models.CharField(max_length=20, choices=QUALITY_GRADES, default='standard')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, help_text="Latitude")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, help_text="Longitude")
    county = models.CharField(max_length=100)
    ward = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_approval')
    is_featured = models.BooleanField(default=False)  # For premium listings
    images = models.JSONField(default=list, blank=True)  # List of image URLs
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.farmer.phone_number}"
    
    @property
    def total_price(self):
        return self.quantity * self.price_per_unit
    
    class Meta:
        ordering = ['-created_at']


class ProductImage(models.Model):
    """Product images and videos"""
    MEDIA_TYPES = (
        ('image', 'Image'),
        ('video', 'Video'),
    )
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_images')
    image = models.ImageField(upload_to='products/', blank=True, null=True)  # Keep for backward compatibility
    file = models.FileField(upload_to='products/', blank=True, null=True)  # Can be image or video
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='image')
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.product.name} - {self.media_type} {self.id}"
    
    def save(self, *args, **kwargs):
        # If file is set but image is not, set image for backward compatibility
        if self.file and not self.image:
            # If it's an image, copy to image field
            if self.media_type == 'image':
                try:
                    # Ensure file is open
                    if self.file.closed:
                        self.file.open()
                    
                    # Read content and create ContentFile to avoid file pointer issues
                    file_content = self.file.read()
                    self.image.save(self.file.name, ContentFile(file_content), save=False)
                    
                    # Reset pointer for the original file field
                    self.file.seek(0)
                except Exception as e:
                    # If image processing fails (e.g. invalid image), just skip the backward compatibility field
                    print(f"Warning: Failed to copy file to image field: {e}")
        super().save(*args, **kwargs)
    
    @property
    def image_url(self):
        """Get image URL - returns file if image not set"""
        if self.image:
            return self.image.url
        elif self.file and self.media_type == 'image':
            return self.file.url
        return None
