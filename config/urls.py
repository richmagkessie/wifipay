from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/',            admin.site.urls),
    path('api/auth/',         include('accounts.urls')),
    path('api/hotspot/',      include('hotspot.urls')),
    path('api/payments/',     include('payments.urls')),
]
