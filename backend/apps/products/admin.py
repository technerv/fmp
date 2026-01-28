from django.contrib import admin
from .models import Category, Product, ProductImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'farmer', 'category', 'quantity', 'price_per_unit', 'status', 'county']
    list_filter = ['status', 'category', 'county', 'quality_grade']
    search_fields = ['name', 'farmer__phone_number', 'county']
    inlines = [ProductImageInline]
