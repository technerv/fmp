from django.db import models
from decimal import Decimal


class Payment(models.Model):
    """Payment records"""
    PAYMENT_METHODS = (
        ('mpesa', 'M-Pesa'),
        ('wallet', 'Wallet Balance'),
        ('bank', 'Bank Transfer'),
        ('card', 'Credit/Debit Card'),
        ('bitcoin', 'Bitcoin'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )
    
    payment_id = models.CharField(max_length=100, unique=True)
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='mpesa')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    mpesa_receipt = models.CharField(max_length=100, blank=True, null=True)
    phone_number = models.CharField(max_length=15)
    transaction_reference = models.CharField(max_length=200, blank=True, null=True)
    failure_reason = models.TextField(blank=True)
    paid_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment {self.payment_id} - {self.order.order_number}"
    
    class Meta:
        ordering = ['-created_at']


class Payout(models.Model):
    """Payout requests for farmers"""
    PAYOUT_METHODS = (
        ('mpesa', 'M-Pesa'),
        ('bank', 'Bank Transfer'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processed', 'Processed'),
        ('rejected', 'Rejected'),
    )
    
    user = models.ForeignKey('farmers.User', on_delete=models.CASCADE, related_name='payouts')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=PAYOUT_METHODS, default='mpesa')
    account_details = models.TextField(help_text="Phone number or Bank Account details")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reference = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return f"Payout {self.user.phone_number} - {self.amount}"
    
    class Meta:
        ordering = ['-created_at']


class Escrow(models.Model):
    """Escrow account holding funds until delivery confirmation"""
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='escrow')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    farmer_share = models.DecimalField(max_digits=10, decimal_places=2)
    platform_commission = models.DecimalField(max_digits=10, decimal_places=2)
    is_released = models.BooleanField(default=False)
    released_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Escrow for Order {self.order.order_number}"
    
    def calculate_shares(self):
        """Calculate farmer share and platform commission"""
        self.platform_commission = self.amount * Decimal('0.05')  # 5% default
        self.farmer_share = self.amount - self.platform_commission
        self.save()


class Wallet(models.Model):
    """User wallet for storing balance"""
    user = models.OneToOneField('farmers.User', on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Wallet {self.user.phone_number} - KES {self.balance}"


class WalletTransaction(models.Model):
    """Wallet transaction history"""
    TRANSACTION_TYPES = (
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('payment', 'Payment'),
        ('refund', 'Refund'),
        ('commission', 'Commission Earned'),
    )
    
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount} - {self.wallet.user.phone_number}"
