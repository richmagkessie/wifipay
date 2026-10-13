from django.db import models
from django.conf import settings
import uuid


class Router(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    isp          = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='routers')
    name         = models.CharField(max_length=100)
    location     = models.CharField(max_length=200, blank=True)
    router_ip    = models.GenericIPAddressField(help_text='Local IP of MikroTik e.g. 192.168.88.1')
    api_port     = models.PositiveIntegerField(default=8728)
    ssh_user     = models.CharField(max_length=50, default='admin')
    ssh_password = models.CharField(max_length=100)
    is_active    = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} — {self.isp.business_name}'


class Package(models.Model):
    DURATION_CHOICES = [
        ('1hr',    '1 Hour'),
        ('3hr',    '3 Hours'),
        ('daily',  'Daily'),
        ('weekly', 'Weekly'),
        ('custom', 'Custom'),
    ]
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    router       = models.ForeignKey(Router, on_delete=models.CASCADE, related_name='packages')
    name         = models.CharField(max_length=50)
    duration     = models.CharField(max_length=10, choices=DURATION_CHOICES)
    price_ghs    = models.DecimalField(max_digits=8, decimal_places=2)
    speed_mbps   = models.PositiveIntegerField(default=5)
    mikrotik_profile = models.CharField(max_length=50, help_text='Profile name on MikroTik')
    is_active    = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.name} — GHS {self.price_ghs}'
