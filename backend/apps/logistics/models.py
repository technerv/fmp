from django.db import models


class CollectionPoint(models.Model):
    """Collection centers where farmers can drop off produce"""
    name = models.CharField(max_length=200)
    county = models.CharField(max_length=100)
    ward = models.CharField(max_length=100)
    # GPS coordinates using decimal fields
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, help_text="Latitude")
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True, help_text="Longitude")
    address = models.TextField()
    contact_person = models.CharField(max_length=100)
    contact_phone = models.CharField(max_length=15)
    is_active = models.BooleanField(default=True)
    operating_hours = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} - {self.county}"
    
    def distance_to(self, lat, lng):
        """Calculate distance to a location in kilometers"""
        if not (self.latitude and self.longitude):
            return None
        try:
            from geopy.distance import geodesic
            return geodesic(
                (float(self.latitude), float(self.longitude)),
                (float(lat), float(lng))
            ).kilometers
        except Exception:
            return None
    
    class Meta:
        ordering = ['county', 'name']


class DeliveryPartner(models.Model):
    """Delivery/logistics partners"""
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=100)
    contact_phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    service_counties = models.JSONField(default=list)  # List of counties served
    is_active = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class Delivery(models.Model):
    """Delivery tracking for orders"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    )
    
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='delivery')
    delivery_partner = models.ForeignKey(DeliveryPartner, on_delete=models.SET_NULL, null=True, blank=True)
    collection_point = models.ForeignKey(CollectionPoint, on_delete=models.SET_NULL, null=True, blank=True)
    tracking_number = models.CharField(max_length=100, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    pickup_address = models.TextField()
    delivery_address = models.TextField()
    estimated_delivery = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Delivery {self.tracking_number or 'N/A'} - {self.order.order_number}"
    
    def save(self, *args, **kwargs):
        if not self.tracking_number:
            import uuid
            self.tracking_number = f"DLV-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
