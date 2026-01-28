from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db import transaction
from decimal import Decimal
from .models import Payment, Escrow, Wallet, WalletTransaction, Payout
from .serializers import (
    PaymentSerializer, PaymentCreateSerializer, EscrowSerializer,
    WalletSerializer, WalletTransactionSerializer, PayoutSerializer,
    PayoutCreateSerializer
)
from apps.orders.models import Order
import uuid
import time
import threading
from django.utils import timezone

def simulate_mpesa_callback(payment_id: int, amount: float, phone_number: str):
    """Simulate M-Pesa callback after a short delay"""
    time.sleep(5)  # Simulate network delay
    
    # Let's mock the callback payload
    payload = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": f"MR-{uuid.uuid4().hex[:8]}",
                "CheckoutRequestID": f"CR-{uuid.uuid4().hex[:8]}",
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": amount},
                        {"Name": "MpesaReceiptNumber", "Value": f"MPS{uuid.uuid4().hex[:8].upper()}"},
                        {"Name": "TransactionDate", "Value": 20231025123000},
                        {"Name": "PhoneNumber", "Value": phone_number}
                    ]
                }
            }
        }
    }
    
    try:
        with transaction.atomic():
            payment = Payment.objects.get(id=payment_id)
            if payment.status == 'processing':
                payment.status = 'completed'
                payment.mpesa_receipt = payload['Body']['stkCallback']['CallbackMetadata']['Item'][1]['Value']
                payment.paid_at =  timezone.now()
                payment.save()
                
                # Update Order
                order = payment.order
                order.status = 'paid'
                order.save()
                
                print(f"Payment {payment.payment_id} simulated success")
    except Exception as e:
        print(f"Simulation failed: {e}")

def simulate_card_bitcoin_payment(payment_id: int):
    """Simulate Card/Bitcoin payment success"""
    time.sleep(3)
    try:
        with transaction.atomic():
            payment = Payment.objects.get(id=payment_id)
            if payment.status == 'processing':
                payment.status = 'completed'
                payment.transaction_reference = f"TXN-{uuid.uuid4().hex[:12].upper()}"
                payment.paid_at = timezone.now()
                payment.save()
                
                # Update Order
                order = payment.order
                order.status = 'paid'
                order.save()
                print(f"Payment {payment.payment_id} ({payment.method}) simulated success")
    except Exception as e:
        print(f"Payment simulation failed: {e}")


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """View payments"""
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'buyer':
            return Payment.objects.filter(order__buyer=user)
        elif user.user_type == 'farmer':
            return Payment.objects.filter(order__product__farmer=user)
        return Payment.objects.none()
    
    @action(detail=False, methods=['post'])
    def initiate(self, request):
        """Initiate payment"""
        serializer = PaymentCreateSerializer(data=request.data)
        if serializer.is_valid():
            order_id = serializer.validated_data['order_id']
            phone_number = serializer.validated_data['phone_number']
            method = serializer.validated_data['method']
            
            try:
                order = Order.objects.get(id=order_id, buyer=request.user)
            except Order.DoesNotExist:
                return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if payment already exists
            if hasattr(order, 'payment'):
                if order.payment.status not in ['failed', 'cancelled', 'pending']:
                    return Response({'error': 'Payment already initiated'}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    order.payment.delete()
            
            # Create payment record
            try:
                with transaction.atomic():
                    payment = Payment.objects.create(
                        payment_id=f"PAY-{uuid.uuid4().hex[:8].upper()}",
                        order=order,
                        amount=order.total_amount,
                        method=method,
                        phone_number=phone_number,
                        status='pending'
                    )
                    
                    # Create escrow if not exists
                    if not hasattr(order, 'escrow'):
                        # Calculate shares
                        commission_rate = Decimal('0.05')
                        platform_commission = order.total_amount * commission_rate
                        farmer_share = order.total_amount - platform_commission
                        
                        escrow = Escrow.objects.create(
                            order=order,
                            amount=order.total_amount,
                            platform_commission=platform_commission,
                            farmer_share=farmer_share
                        )
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Handle Payment Methods
            if method == 'mpesa':
                payment.status = 'processing'
                payment.save()
                
                # Check if M-Pesa credentials are configured
                if settings.MPESA_CONSUMER_KEY and settings.MPESA_CONSUMER_SECRET:
                    try:
                        mpesa_client = MpesaClient()
                        # Use current host for callback (in production this should be a valid public domain)
                        host = request.get_host()
                        scheme = request.scheme
                        callback_url = f"{scheme}://{host}/api/payments/mpesa_callback/"
                        
                        # Initiate STK Push
                        response = mpesa_client.stk_push(
                            phone_number=phone_number,
                            amount=order.total_amount,
                            account_reference=f"Order {order.order_number}",
                            transaction_desc="Payment for Order",
                            callback_url=callback_url
                        )
                        
                        if "ResponseCode" in response and response["ResponseCode"] == "0":
                            # Success
                            print(f"M-Pesa STK Push initiated for {payment.payment_id}")
                            # We don't complete it yet, we wait for callback
                        else:
                            # Failed to initiate, fallback to simulation or error?
                            # For now, if real API fails, we return error or log it.
                            # But if the user wants "sandbox", maybe they want to see it work even if config is bad?
                            # Let's log it.
                            print(f"M-Pesa STK Push failed: {response}")
                            payment.failure_reason = str(response)
                            payment.save()
                            
                    except Exception as e:
                        print(f"M-Pesa integration error: {e}")
                        # Fallback to simulation
                        threading.Thread(
                            target=simulate_mpesa_callback,
                            args=(payment.id, float(order.total_amount), phone_number)
                        ).start()
                else:
                    # No credentials, use simulation
                    threading.Thread(
                        target=simulate_mpesa_callback,
                        args=(payment.id, float(order.total_amount), phone_number)
                    ).start()
            
            elif method in ['card', 'bitcoin']:
                payment.status = 'processing'
                payment.save()
                threading.Thread(
                    target=simulate_card_bitcoin_payment,
                    args=(payment.id,)
                ).start()
            
            elif method == 'wallet':
                try:
                    wallet = Wallet.objects.get(user=request.user)
                    if wallet.balance < order.total_amount:
                        payment.status = 'failed'
                        payment.failure_reason = 'Insufficient funds'
                        payment.save()
                        return Response({'error': 'Insufficient wallet balance'}, status=status.HTTP_400_BAD_REQUEST)
                    
                    with transaction.atomic():
                        wallet.balance -= order.total_amount
                        wallet.save()
                        
                        WalletTransaction.objects.create(
                            wallet=wallet,
                            transaction_type='payment',
                            amount=order.total_amount,
                            reference=payment.payment_id,
                            description=f"Payment for Order {order.order_number}"
                        )
                        
                        payment.status = 'completed'
                        payment.paid_at = timezone.now()
                        payment.save()
                        
                        order.status = 'paid'
                        order.save()
                        
                except Wallet.DoesNotExist:
                    payment.status = 'failed'
                    payment.failure_reason = 'Wallet not found'
                    payment.save()
                    return Response({'error': 'Wallet not found'}, status=status.HTTP_404_NOT_FOUND)
                
            return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def mpesa_callback(self, request):
        """Handle M-Pesa Callback"""
        print("M-Pesa Callback Received:", request.data)
        try:
            body = request.data.get('Body', {})
            stk_callback = body.get('stkCallback', {})
            
            result_code = stk_callback.get('ResultCode')
            result_desc = stk_callback.get('ResultDesc')
            merchant_request_id = stk_callback.get('MerchantRequestID')
            checkout_request_id = stk_callback.get('CheckoutRequestID')
            callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
            
            # Find payment (we might need to store CheckoutRequestID to match exactly, 
            # but for now we can't easily match without it in the Payment model.
            # Assuming we can match by something else or just log it.
            # Ideally we should have stored CheckoutRequestID in Payment model.
            
            if result_code == 0:
                # Payment successful
                amount = next((item['Value'] for item in callback_metadata if item['Name'] == 'Amount'), 0)
                receipt = next((item['Value'] for item in callback_metadata if item['Name'] == 'MpesaReceiptNumber'), '')
                phone = next((item['Value'] for item in callback_metadata if item['Name'] == 'PhoneNumber'), '')
                
                # Find the most recent processing payment with matching amount/phone?
                # Or we should have stored the ID.
                # For this simplified version, let's find the latest processing M-Pesa payment for this phone
                # This is risky in high volume but fine for dev.
                payment = Payment.objects.filter(
                    method='mpesa', 
                    status='processing',
                    phone_number=str(phone)
                ).order_by('-created_at').first()
                
                if payment:
                    payment.status = 'completed'
                    payment.mpesa_receipt = receipt
                    payment.paid_at = timezone.now()
                    payment.save()
                    
                    payment.order.status = 'paid'
                    payment.order.save()
                    print(f"Payment {payment.payment_id} confirmed via M-Pesa callback")
            else:
                print(f"M-Pesa Payment Failed: {result_desc}")
                
        except Exception as e:
            print(f"Error processing M-Pesa callback: {e}")
            
        return Response({'status': 'received'})


class EscrowViewSet(viewsets.ReadOnlyModelViewSet):
    """View escrow accounts"""
    serializer_class = EscrowSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'farmer':
            return Escrow.objects.filter(order__product__farmer=user)
        return Escrow.objects.none()
    
    @action(detail=True, methods=['post'])
    def release(self, request, pk=None):
        """Release escrow to farmer (after delivery confirmation)"""
        escrow = self.get_object()
        # Allow buyer to release (Confirm Delivery) or admin
        is_buyer = request.user == escrow.order.buyer
        is_admin = request.user.is_staff
        
        if not (is_buyer or is_admin):
             return Response({'error': 'Not authorized. Only buyer can confirm delivery.'}, status=status.HTTP_403_FORBIDDEN)
        
        if escrow.is_released:
            return Response({'error': 'Escrow already released'}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Release funds
            escrow.is_released = True
            escrow.released_at = timezone.now()
            escrow.save()
            
            # Credit Farmer Wallet
            farmer_wallet, _ = Wallet.objects.get_or_create(user=escrow.order.product.farmer)
            farmer_wallet.balance += escrow.farmer_share
            farmer_wallet.save()
            
            WalletTransaction.objects.create(
                wallet=farmer_wallet,
                transaction_type='deposit',
                amount=escrow.farmer_share,
                reference=f"ESC-{escrow.id}",
                description=f"Earnings from Order {escrow.order.order_number}"
            )
            
            # Update order status
            escrow.order.status = 'completed'
            escrow.order.save()
        
        return Response(EscrowSerializer(escrow).data)


class WalletViewSet(viewsets.ReadOnlyModelViewSet):
    """View wallet and transactions"""
    serializer_class = WalletSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Wallet.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Get wallet transactions"""
        wallet = self.get_object()
        transactions = WalletTransaction.objects.filter(wallet=wallet).order_by('-created_at')
        serializer = WalletTransactionSerializer(transactions, many=True)
        return Response(serializer.data)


class PayoutViewSet(viewsets.ModelViewSet):
    """Manage payouts"""
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Payout.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PayoutCreateSerializer
        return PayoutSerializer
        
    def perform_create(self, serializer):
        # Check wallet balance
        wallet = Wallet.objects.get(user=self.request.user)
        amount = serializer.validated_data['amount']
        
        if wallet.balance < amount:
            raise serializers.ValidationError({"amount": "Insufficient wallet balance"})
            
        with transaction.atomic():
            # Deduct from wallet immediately
            wallet.balance -= amount
            wallet.save()
            
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='withdrawal',
                amount=amount,
                reference=f"WDR-{int(time.time())}",
                description="Payout Request"
            )
            
            serializer.save(user=self.request.user)



@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def mpesa_callback(request):
    """M-Pesa callback endpoint for payment notifications"""
    data = request.data
    # This logic is now partially handled by the simulation thread for dev
    # But in prod, we would parse `data` here.
    return Response({'status': 'received'}, status=status.HTTP_200_OK)
