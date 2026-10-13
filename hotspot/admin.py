from django.contrib import admin
from .models import Router, Package


class PackageInline(admin.TabularInline):
    model  = Package
    extra  = 0
    fields = ['name', 'duration', 'price_ghs', 'speed_mbps', 'mikrotik_profile', 'is_active']


@admin.register(Router)
class RouterAdmin(admin.ModelAdmin):
    list_display   = ['name', 'isp', 'location', 'router_ip', 'is_active', 'created_at']
    list_filter    = ['is_active']
    search_fields  = ['name', 'location', 'isp__business_name', 'router_ip']
    ordering       = ['-created_at']
    inlines        = [PackageInline]
    readonly_fields = ['id', 'created_at']


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display  = ['name', 'router', 'duration', 'price_ghs', 'speed_mbps', 'is_active']
    list_filter   = ['duration', 'is_active']
    search_fields = ['name', 'router__name']
    ordering      = ['router', 'price_ghs']
