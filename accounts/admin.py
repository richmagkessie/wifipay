from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import ISPUser


@admin.register(ISPUser)
class ISPUserAdmin(UserAdmin):
    list_display   = ['email', 'business_name', 'phone', 'country', 'is_active', 'created_at']
    list_filter    = ['is_active', 'country']
    search_fields  = ['email', 'business_name', 'phone']
    ordering       = ['-created_at']
    fieldsets = (
        (None,          {'fields': ('email', 'password')}),
        ('Business',    {'fields': ('business_name', 'phone', 'country')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates',       {'fields': ('last_login', 'created_at'), 'classes': ('collapse',)}),
    )
    readonly_fields = ['created_at']
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields':  ('email', 'business_name', 'phone', 'password1', 'password2'),
        }),
    )
