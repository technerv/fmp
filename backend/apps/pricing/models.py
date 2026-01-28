from django.db import models
from decimal import Decimal
from django.conf import settings


class MarketPrice(models.Model):
    """Daily market prices for products by location"""
    category = models.ForeignKey('products.Category', on_delete=models.CASCADE, related_name='market_prices')
    county = models.CharField(max_length=100)
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, default='kg')
    date = models.DateField()
    source = models.CharField(max_length=50, default='crowdsourced')  # crowdsourced, admin, api
    volume_traded = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Total volume in kgs
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['category', 'county', 'date']
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.category.name} - {self.county} - {self.date} - KES {self.price_per_unit}/{self.unit}"
    
    @property
    def price_floor(self):
        """Calculate price floor (10% below average by default)"""
        floor_percentage = Decimal(settings.PRICE_FLOOR_PERCENTAGE)
        return self.price_per_unit * (1 - floor_percentage)


class PriceAlert(models.Model):
    """Price alerts for farmers when prices reach certain thresholds"""
    farmer = models.ForeignKey('farmers.User', on_delete=models.CASCADE, related_name='price_alerts')
    category = models.ForeignKey('products.Category', on_delete=models.CASCADE)
    target_price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.farmer.phone_number} - {self.category.name} - KES {self.target_price}"
