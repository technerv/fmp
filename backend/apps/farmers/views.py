from rest_framework import generics, status, permissions, viewsets, mixins, parsers
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Count, Sum
from .serializers import (
    UserSerializer, FarmerProfileSerializer, BuyerProfileSerializer,
    RegisterSerializer, LoginSerializer, VerificationDocumentSerializer
)
from .models import FarmerProfile, BuyerProfile, VerificationDocument
from apps.products.models import Product
from apps.orders.models import Order

User = get_user_model()


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    """Register a new user (farmer or buyer)"""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Create appropriate profile
        if user.user_type == 'farmer':
            FarmerProfile.objects.create(user=user)
        elif user.user_type == 'buyer':
            BuyerProfile.objects.create(user=user)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    """Login user and return JWT tokens"""
    serializer = LoginSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FarmerProfileView(generics.RetrieveUpdateAPIView):
    """Get or update farmer profile"""
    serializer_class = FarmerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user.farmer_profile


class BuyerProfileView(generics.RetrieveUpdateAPIView):
    """Get or update buyer profile"""
    serializer_class = BuyerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user.buyer_profile


class CurrentUserView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update or delete current authenticated user"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class VerificationDocumentViewSet(mixins.CreateModelMixin, 
                                mixins.ListModelMixin,
                                mixins.RetrieveModelMixin,
                                viewsets.GenericViewSet):
    """
    API endpoint for users to upload verification documents.
    Admins can view all documents and review them.
    """
    serializer_class = VerificationDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        if self.request.user.is_staff:
            return VerificationDocument.objects.all()
        return VerificationDocument.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def review(self, request, pk=None):
        document = self.get_object()
        status_val = request.data.get('status')
        admin_notes = request.data.get('admin_notes', '')

        if status_val not in ['approved', 'rejected']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        document.status = status_val
        document.admin_notes = admin_notes
        document.reviewed_at = timezone.now()
        document.save()

        if status_val == 'approved':
            user = document.user
            user.is_verified = True
            user.save()

        return Response(VerificationDocumentSerializer(document).data)


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin only viewset to manage users.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=['post'])
    def verify_user(self, request, pk=None):
        user = self.get_object()
        user.is_verified = True
        user.save()
        return Response(UserSerializer(user).data)


class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        # User Stats
        total_users = User.objects.count()
        farmers_count = User.objects.filter(user_type='farmer').count()
        buyers_count = User.objects.filter(user_type='buyer').count()
        
        # Product Stats
        total_products = Product.objects.count()
        products_by_category = Product.objects.values('category__name').annotate(count=Count('id'))
        
        # Order Stats
        total_orders = Order.objects.count()
        # Handle case where no orders exist and aggregate returns None
        total_revenue = Order.objects.filter(status='completed').aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        orders_by_status = Order.objects.values('status').annotate(count=Count('id'))
        
        # Verification Stats
        pending_verifications = VerificationDocument.objects.filter(status='pending').count()

        return Response({
            'users': {
                'total': total_users,
                'farmers': farmers_count,
                'buyers': buyers_count
            },
            'products': {
                'total': total_products,
                'by_category': products_by_category
            },
            'orders': {
                'total': total_orders,
                'revenue': total_revenue,
                'by_status': orders_by_status
            },
            'verifications': {
                'pending': pending_verifications
            }
        })
