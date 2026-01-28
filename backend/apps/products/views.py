from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product, ProductImage
from .serializers import CategorySerializer, ProductSerializer, ProductCreateSerializer, ProductImageSerializer
from .permissions import IsOwnerOrReadOnly


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """List and retrieve product categories"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


from math import radians, cos, sin, asin, sqrt

class ProductViewSet(viewsets.ModelViewSet):
    """CRUD operations for products"""
    queryset = Product.objects.filter(status='available').select_related('farmer', 'category')
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'county', 'status', 'quality_grade']
    search_fields = ['name', 'description', 'county', 'ward']
    ordering_fields = ['price_per_unit', 'created_at', 'harvest_date', 'distance_km']
    ordering = ['-created_at']
    lookup_field = 'uuid'
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ProductCreateSerializer
        return ProductSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin view: see all products
        if user.is_authenticated and user.is_staff:
            queryset = Product.objects.all().select_related('farmer', 'category')
            # Support filtering by status for admins
            status_param = self.request.query_params.get('status', None)
            if status_param:
                queryset = queryset.filter(status=status_param)
        
        # Check for 'mine' filter for farmers to see their own products
        elif user.is_authenticated and self.request.query_params.get('mine', None):
            return Product.objects.filter(farmer=user).select_related('category')
        
        else:
            # Default: Show all available products (Marketplace view)
            queryset = Product.objects.filter(status='available').select_related('farmer', 'category')
        
        # Location-based filtering (county)
        county = self.request.query_params.get('county', None)
        if county:
            queryset = queryset.filter(county__icontains=county)
            
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, uuid=None):
        product = self.get_object()
        product.status = 'available'
        product.save()
        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, uuid=None):
        product = self.get_object()
        product.status = 'rejected'
        product.save()
        return Response({'status': 'rejected'})

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Distance-based filtering
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        
        if lat and lng:
            try:
                lat = float(lat)
                lng = float(lng)
                radius = float(request.query_params.get('radius', 50))
                
                # Filter by rough bounding box first (1 deg approx 111km)
                lat_delta = radius / 111.0
                # Avoid division by zero at poles
                cos_lat = abs(cos(radians(lat)))
                lng_delta = radius / (111.0 * cos_lat) if cos_lat > 0.0001 else 360
                
                queryset = queryset.filter(
                    latitude__range=(lat - lat_delta, lat + lat_delta),
                    longitude__range=(lng - lng_delta, lng + lng_delta)
                )
                
                products = []
                for product in queryset:
                    if product.latitude and product.longitude:
                        # Convert Decimal to float for math operations
                        p_lat = float(product.latitude)
                        p_lng = float(product.longitude)
                        
                        d_lat = radians(p_lat - lat)
                        d_lng = radians(p_lng - lng)
                        a = sin(d_lat / 2)**2 + cos(radians(lat)) * cos(radians(p_lat)) * sin(d_lng / 2)**2
                        # Clamp 'a' to [0, 1] to avoid domain errors
                        a = min(1.0, max(0.0, a))
                        c = 2 * asin(sqrt(a))
                        distance = 6371 * c  # Radius of earth in km
                        
                        if distance <= radius:
                            product.distance_km = round(distance, 1)
                            products.append(product)
                
                # Sort by distance
                products.sort(key=lambda x: x.distance_km)
                
                page = self.paginate_queryset(products)
                if page is not None:
                    serializer = self.get_serializer(page, many=True)
                    return self.get_paginated_response(serializer.data)

                serializer = self.get_serializer(products, many=True)
                return Response(serializer.data)
                
            except (ValueError, TypeError):
                pass
        
        return super().list(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user)
    
    @action(detail=True, methods=['post'], url_path='upload-media')
    def upload_media(self, request, pk=None, **kwargs):
        """Upload images or videos for a product"""
        product = self.get_object()
        
        # Check if user owns this product
        if product.farmer != request.user:
            return Response(
                {'error': 'You can only upload media for your own products'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        files = request.FILES.getlist('files')
        if not files:
            # Fallback: try to find files in request.data (e.g. if parsed differently)
            if 'files' in request.data:
                data_files = request.data.get('files')
                if data_files:
                     if isinstance(data_files, list):
                         files = data_files
                     else:
                         files = [data_files]

        if not files:
            return Response(
                {'error': 'No files provided. Ensure you are sending "files" key in multipart/form-data.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_files = []
        for file in files:
            # Determine media type from file extension
            try:
                file_name = getattr(file, 'name', 'unknown')
                file_ext = file_name.split('.')[-1].lower()
                media_type = 'video' if file_ext in ['mp4', 'mov', 'avi', 'webm', 'mkv'] else 'image'
                
                # Check if this should be primary (first file or explicit flag)
                is_primary = len(uploaded_files) == 0 and not ProductImage.objects.filter(
                    product=product, is_primary=True
                ).exists()
                
                product_image = ProductImage.objects.create(
                    product=product,
                    file=file,
                    media_type=media_type,
                    is_primary=is_primary
                )
                serializer = ProductImageSerializer(product_image, context={'request': request})
                uploaded_files.append(serializer.data)
            except Exception as e:
                # Log the error and continue with other files or return error
                print(f"Error uploading file {getattr(file, 'name', 'unknown')}: {e}")
                import traceback
                traceback.print_exc()
                return Response(
                    {'error': f'Failed to process file {getattr(file, "name", "unknown")}: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response({
            'message': f'Successfully uploaded {len(uploaded_files)} file(s)',
            'files': uploaded_files
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'], url_path='media/(?P<media_id>[^/.]+)')
    def delete_media(self, request, pk=None, media_id=None, **kwargs):
        """Delete a specific media file"""
        product = self.get_object()
        
        if product.farmer != request.user:
            return Response(
                {'error': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            media = ProductImage.objects.get(id=media_id, product=product)
            media.delete()
            return Response({'message': 'Media deleted successfully'})
        except ProductImage.DoesNotExist:
            return Response(
                {'error': 'Media not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='nearby')
    def nearby(self, request):
        """Find products near a location using geopy distance calculations"""
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius = float(request.query_params.get('radius', 50))  # km
        
        if not lat or not lng:
            return Response(
                {'error': 'lat and lng parameters required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = float(lat)
            lng = float(lng)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid lat/lng values'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all available products with locations
        queryset = Product.objects.filter(
            status='available',
            latitude__isnull=False,
            longitude__isnull=False
        ).select_related('farmer', 'category')
        
        # Calculate distances and filter
        from geopy.distance import geodesic
        products_with_distance = []
        user_location = (lat, lng)
        
        for product in queryset:
            try:
                product_location = (float(product.latitude), float(product.longitude))
                distance_km = geodesic(user_location, product_location).kilometers
                
                if distance_km <= radius:
                    products_with_distance.append({
                        'product': product,
                        'distance_km': round(distance_km, 2)
                    })
            except (ValueError, TypeError):
                continue
        
        # Sort by distance
        products_with_distance.sort(key=lambda x: x['distance_km'])
        
        # Serialize results
        results = []
        for item in products_with_distance:
            product_data = ProductSerializer(item['product'], context={'request': request}).data
            product_data['distance_km'] = item['distance_km']
            results.append(product_data)
        
        return Response({
            'count': len(results),
            'results': results,
            'location': {'lat': lat, 'lng': lng},
            'radius_km': radius,
            'method': 'geopy_distance_calculation'
        })
