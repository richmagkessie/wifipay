from django.contrib import admin
from .models import ISPWallet, WalletTransaction, WithdrawalRequest


class WalletTransactionInline(admin.TabularInline):
    model           = WalletTransaction
    extra           = 0
    fields          = ['type', 'amount', 'description', 'created_at']
    readonly_fields = ['type', 'amount', 'description', 'created_at']
    can_delete      = False
    max_num         = 0
    ordering        = ['-created_at']


@admin.register(ISPWallet)
class ISPWalletAdmin(admin.ModelAdmin):
    list_display    = ['isp', 'balance', 'total_earned', 'total_withdrawn', 'updated_at']
    search_fields   = ['isp__business_name', 'isp__email']
    ordering        = ['-balance']
    readonly_fields = ['total_earned', 'total_withdrawn', 'updated_at']
    inlines         = [WalletTransactionInline]


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display    = ['wallet', 'type', 'amount', 'description', 'created_at']
    list_filter     = ['type']
    search_fields   = ['wallet__isp__business_name', 'description']
    ordering        = ['-created_at']
    readonly_fields = ['id', 'created_at']


@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display    = ['wallet', 'amount', 'momo_number', 'momo_name', 'status', 'hubtel_ref', 'created_at']
    list_filter     = ['status']
    search_fields   = ['momo_number', 'momo_name', 'hubtel_ref', 'wallet__isp__business_name']
    ordering        = ['-created_at']
    readonly_fields = ['id', 'hubtel_ref', 'created_at', 'updated_at']
    actions         = ['mark_completed']

    @admin.action(description='Mark selected as Completed')
    def mark_completed(self, request, queryset):
        queryset.update(status='completed')
