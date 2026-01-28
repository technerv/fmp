from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, FarmerProfile, BuyerProfile, VerificationDocument


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['phone_number', 'username', 'email', 'user_type', 'is_verified', 'is_active']
    list_filter = ['user_type', 'is_verified', 'is_active']
    search_fields = ['phone_number', 'username', 'email']


@admin.register(FarmerProfile)
class FarmerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'county', 'ward', 'rating', 'total_sales']
    list_filter = ['county']
    search_fields = ['user__phone_number', 'county', 'ward']


@admin.register(BuyerProfile)
class BuyerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'business_name', 'buyer_type', 'county', 'rating']
    list_filter = ['buyer_type', 'county']
    search_fields = ['business_name', 'user__phone_number', 'county']


@admin.register(VerificationDocument)
class VerificationDocumentAdmin(admin.ModelAdmin):
    list_display = ['user', 'document_type', 'status', 'submitted_at']
    list_filter = ['status', 'document_type']
    search_fields = ['user__phone_number', 'user__username']
    actions = ['approve_documents', 'reject_documents']

    def approve_documents(self, request, queryset):
        for doc in queryset:
            doc.status = 'approved'
            doc.save()
            # Also verify the user
            user = doc.user
            user.is_verified = True
            user.save()
    approve_documents.short_description = "Approve selected documents and verify user"

    def reject_documents(self, request, queryset):
        queryset.update(status='rejected')
    reject_documents.short_description = "Reject selected documents"
