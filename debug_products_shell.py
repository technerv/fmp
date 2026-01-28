from apps.products.models import Product
from django.db.models import Count

print("Checking Product counts by status:")
try:
    counts = Product.objects.values('status').annotate(total=Count('id'))
    for entry in counts:
        print(f"Status: {entry['status']}, Count: {entry['total']}")
        
    print("\nSample available products:")
    available = Product.objects.filter(status='available')[:5]
    for p in available:
        print(f"ID: {p.id}, UUID: {p.uuid}, Name: {p.name}, Status: {p.status}")

    print("\nTotal products:", Product.objects.count())
except Exception as e:
    print(f"Error: {e}")
