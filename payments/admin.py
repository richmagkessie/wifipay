from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display    = ['phone_number', 'router', 'package', 'amount_ghs', 'platform_fee', 'isp_amount', 'status', 'created_at', 'completed_at']
    list_filter     = ['status', 'router']
    search_fields   = ['phone_number', 'hubtel_ref', 'device_mac']
    ordering        = ['-created_at']
    readonly_fields = ['id', 'hubtel_ref', 'platform_fee', 'isp_amount', 'created_at', 'completed_at']
    fieldsets = (
        ('Transaction', {'fields': ('id', 'hubtel_ref', 'status')}),
        ('Customer',    {'fields': ('phone_number', 'device_mac', 'device_ip')}),
        ('Details',     {'fields': ('router', 'package', 'voucher', 'amount_ghs', 'platform_fee', 'isp_amount')}),
        ('Timestamps',  {'fields': ('created_at', 'completed_at')}),
    )
