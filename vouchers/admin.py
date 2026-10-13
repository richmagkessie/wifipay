from django.contrib import admin
from .models import VoucherBatch, Voucher


class VoucherInline(admin.TabularInline):
    model          = Voucher
    extra          = 0
    fields         = ['code', 'status', 'sold_at', 'used_at']
    readonly_fields = ['code', 'sold_at', 'used_at']
    can_delete     = False
    max_num        = 0
    show_change_link = True


@admin.register(VoucherBatch)
class VoucherBatchAdmin(admin.ModelAdmin):
    list_display    = ['id', 'router', 'package', 'count', 'available_count', 'sold_count', 'created_by', 'created_at']
    list_filter     = ['router', 'package']
    search_fields   = ['router__name', 'package__name']
    ordering        = ['-created_at']
    readonly_fields = ['id', 'created_at']
    inlines         = [VoucherInline]

    @admin.display(description='Available')
    def available_count(self, obj):
        return obj.vouchers.filter(status='available').count()

    @admin.display(description='Sold')
    def sold_count(self, obj):
        return obj.vouchers.filter(status='sold').count()


@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display   = ['code', 'batch', 'status', 'sold_at', 'used_at', 'created_at']
    list_filter    = ['status']
    search_fields  = ['code']
    ordering       = ['-created_at']
    readonly_fields = ['id', 'created_at']
    actions        = ['mark_available']

    @admin.action(description='Reset selected vouchers to Available')
    def mark_available(self, request, queryset):
        queryset.update(status='available', sold_at=None, used_at=None)
