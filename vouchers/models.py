from django.db import models
from django.conf import settings
import uuid


class VoucherBatch(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    router     = models.ForeignKey('hotspot.Router', on_delete=models.CASCADE, related_name='batches')
    package    = models.ForeignKey('hotspot.Package', on_delete=models.CASCADE)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    count      = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Batch {self.id} — {self.count} vouchers'


class Voucher(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('sold',      'Sold'),
        ('used',      'Used'),
        ('expired',   'Expired'),
    ]
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch      = models.ForeignKey(VoucherBatch, on_delete=models.CASCADE, related_name='vouchers')
    code       = models.CharField(max_length=20, unique=True)
    status     = models.CharField(max_length=10, choices=STATUS_CHOICES, default='available')
    sold_at    = models.DateTimeField(null=True, blank=True)
    used_at    = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.code} ({self.status})'
