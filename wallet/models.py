from django.db import models
from django.conf import settings
import uuid


class ISPWallet(models.Model):
    isp              = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    balance          = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_earned     = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_withdrawn  = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    updated_at       = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.isp.business_name} — GHS {self.balance}'

    def credit(self, amount, description, payment=None):
        self.balance       += amount
        self.total_earned  += amount
        self.save(update_fields=['balance', 'total_earned', 'updated_at'])
        WalletTransaction.objects.create(
            wallet=self, type='credit', amount=amount,
            description=description, payment=payment,
        )

    def debit(self, amount, description):
        self.balance          -= amount
        self.total_withdrawn  += amount
        self.save(update_fields=['balance', 'total_withdrawn', 'updated_at'])
        WalletTransaction.objects.create(
            wallet=self, type='debit', amount=amount, description=description,
        )


class WalletTransaction(models.Model):
    TYPE_CHOICES = [('credit', 'Credit'), ('debit', 'Debit')]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet      = models.ForeignKey(ISPWallet, on_delete=models.CASCADE, related_name='transactions')
    type        = models.CharField(max_length=6, choices=TYPE_CHOICES)
    amount      = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=200)
    payment     = models.ForeignKey('payments.Payment', null=True, blank=True, on_delete=models.SET_NULL)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class WithdrawalRequest(models.Model):
    STATUS = [
        ('pending',    'Pending'),
        ('processing', 'Processing'),
        ('completed',  'Completed'),
        ('failed',     'Failed'),
    ]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet      = models.ForeignKey(ISPWallet, on_delete=models.CASCADE, related_name='withdrawals')
    amount      = models.DecimalField(max_digits=10, decimal_places=2)
    momo_number = models.CharField(max_length=15)
    momo_name   = models.CharField(max_length=100)
    status      = models.CharField(max_length=12, choices=STATUS, default='pending')
    hubtel_ref  = models.CharField(max_length=100, blank=True)
    failure_msg = models.CharField(max_length=300, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
