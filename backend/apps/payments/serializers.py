from rest_framework import serializers
from .models import Payment, Escrow, Wallet, WalletTransaction, Payout
from apps.orders.serializers import OrderSerializer


class PaymentSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_id', 'order', 'amount', 'method', 'status',
            'mpesa_receipt', 'phone_number', 'transaction_reference',
            'failure_reason', 'paid_at', 'created_at'
        ]
        read_only_fields = [
            'id', 'payment_id', 'status', 'mpesa_receipt',
            'transaction_reference', 'failure_reason', 'paid_at', 'created_at'
        ]


class PaymentCreateSerializer(serializers.Serializer):
    """Serializer for initiating payment"""
    order_id = serializers.IntegerField()
    phone_number = serializers.CharField(max_length=15)
    method = serializers.ChoiceField(choices=['mpesa', 'wallet', 'card', 'bitcoin'], default='mpesa')


class PayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = [
            'id', 'amount', 'method', 'account_details', 
            'status', 'reference', 'created_at', 'processed_at'
        ]
        read_only_fields = [
            'id', 'status', 'reference', 'created_at', 'processed_at'
        ]


class PayoutCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payout
        fields = ['amount', 'method', 'account_details']
        
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value


class EscrowSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)
    
    class Meta:
        model = Escrow
        fields = [
            'id', 'order', 'amount', 'farmer_share',
            'platform_commission', 'is_released', 'released_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ['id', 'balance', 'created_at', 'updated_at']
        read_only_fields = ['id', 'balance', 'created_at', 'updated_at']


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = [
            'id', 'transaction_type', 'amount', 'reference',
            'description', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
