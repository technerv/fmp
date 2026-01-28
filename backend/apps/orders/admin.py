from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['subtotal']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'buyer', 'product', 'total_amount', 'status', 'created_at']
    list_filter = ['status', 'created_at', 'delivery_county']
    search_fields = ['order_number', 'buyer__phone_number', 'product__name']
    readonly_fields = ['order_number', 'subtotal', 'commission', 'total_amount']
    inlines = [OrderItemInline]
