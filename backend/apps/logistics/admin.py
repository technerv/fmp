from django.contrib import admin
from .models import CollectionPoint, DeliveryPartner, Delivery


@admin.register(CollectionPoint)
class CollectionPointAdmin(admin.ModelAdmin):
    list_display = ['name', 'county', 'ward', 'contact_phone', 'is_active']
    list_filter = ['county', 'is_active']
    search_fields = ['name', 'county', 'ward', 'contact_phone']


@admin.register(DeliveryPartner)
class DeliveryPartnerAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_phone', 'rating', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'contact_person', 'contact_phone']


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ['tracking_number', 'order', 'status', 'delivery_partner', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['tracking_number', 'order__order_number']
    readonly_fields = ['tracking_number', 'created_at', 'updated_at']
