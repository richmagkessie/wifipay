from django.db import models
import uuid


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('success',   'Success'),
        ('failed',    'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    router          = models.ForeignKey('hotspot.Router', on_delete=models.CASCADE, related_name='payments')
    package         = models.ForeignKey('hotspot.Package', on_delete=models.CASCADE)
    voucher         = models.OneToOneField('vouchers.Voucher', on_delete=models.SET_NULL, null=True, blank=True)
    amount_ghs      = models.DecimalField(max_digits=8, decimal_places=2)
    platform_fee    = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    isp_amount      = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    phone_number    = models.CharField(max_length=20)
    device_mac      = models.CharField(max_length=17, blank=True)
    device_ip       = models.GenericIPAddressField(null=True, blank=True)
    hubtel_ref      = models.CharField(max_length=100, blank=True)
    status          = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at      = models.DateTimeField(auto_now_add=True)
    completed_at    = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.phone_number} — GHS {self.amount_ghs} ({self.status})'
