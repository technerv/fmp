from django.contrib import admin
from .models import Payment, Escrow, Wallet, WalletTransaction


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_id', 'order', 'amount', 'method', 'status', 'created_at']
    list_filter = ['status', 'method', 'created_at']
    search_fields = ['payment_id', 'order__order_number', 'mpesa_receipt', 'phone_number']
    readonly_fields = ['payment_id', 'created_at', 'updated_at']


@admin.register(Escrow)
class EscrowAdmin(admin.ModelAdmin):
    list_display = ['order', 'amount', 'farmer_share', 'platform_commission', 'is_released', 'created_at']
    list_filter = ['is_released', 'created_at']
    search_fields = ['order__order_number']
    readonly_fields = ['created_at']


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'balance', 'created_at']
    search_fields = ['user__phone_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ['wallet', 'transaction_type', 'amount', 'reference', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['wallet__user__phone_number', 'reference']
    readonly_fields = ['created_at']
