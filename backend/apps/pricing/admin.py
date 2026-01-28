from django.contrib import admin
from .models import MarketPrice, PriceAlert


@admin.register(MarketPrice)
class MarketPriceAdmin(admin.ModelAdmin):
    list_display = ['category', 'county', 'price_per_unit', 'unit', 'date', 'source']
    list_filter = ['date', 'county', 'source']
    search_fields = ['category__name', 'county']


@admin.register(PriceAlert)
class PriceAlertAdmin(admin.ModelAdmin):
    list_display = ['farmer', 'category', 'target_price', 'is_active', 'created_at']
    list_filter = ['is_active', 'category']
    search_fields = ['farmer__phone_number', 'category__name']
