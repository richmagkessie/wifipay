from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone
from django.db import transaction as db_transaction
from django.conf import settings
from .models import Payment
from .hubtel import initiate_payment
from vouchers.models import Voucher
from hotspot.models import Package, Router
import uuid
from decimal import Decimal

PLATFORM_FEE_RATE = Decimal('0.10')


class InitiatePaymentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        router_id  = request.data.get('router_id')
        package_id = request.data.get('package_id')
        phone      = request.data.get('phone')
        device_mac = request.data.get('mac', '')
        device_ip  = request.data.get('ip') or None

        try:
            router  = Router.objects.get(id=router_id, is_active=True)
            package = Package.objects.get(id=package_id, router=router, is_active=True)
        except (Router.DoesNotExist, Package.DoesNotExist):
            return Response({'error': 'Invalid router or package'}, status=400)

        with db_transaction.atomic():
            voucher = Voucher.objects.filter(
                batch__router=router,
                batch__package=package,
                status='available',
            ).select_for_update().first()

            if not voucher:
                return Response({'error': 'No vouchers available for this package'}, status=503)

            ref = str(uuid.uuid4()).replace('-', '')[:20]
            fee = (package.price_ghs * PLATFORM_FEE_RATE).quantize(Decimal('0.01'))
            isp_amount = package.price_ghs - fee

            payment = Payment.objects.create(
                router=router,
                package=package,
                voucher=voucher,
                amount_ghs=package.price_ghs,
                platform_fee=fee,
                isp_amount=isp_amount,
                phone_number=phone,
                device_mac=device_mac,
                device_ip=device_ip,
                hubtel_ref=ref,
            )

            voucher.status  = 'sold'
            voucher.sold_at = timezone.now()
            voucher.save()

        callback_url = f'https://wifipay.baskit.cc/api/payments/webhook/'

        try:
            hubtel_resp = initiate_payment(
                phone=phone,
                amount=package.price_ghs,
                description=f'WifiPay — {package.name}',
                callback_url=callback_url,
                client_reference=ref,
            )
            return Response({'payment_id': str(payment.id), 'reference': ref, 'hubtel': hubtel_resp})
        except Exception as e:
            with db_transaction.atomic():
                voucher.status  = 'available'
                voucher.sold_at = None
                voucher.save()
                payment.delete()
            return Response({'error': str(e)}, status=502)


class HubtelWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data   = request.data
        ref    = data.get('ClientReference') or data.get('clientReference', '')
        status = data.get('Status') or data.get('status', '')

        try:
            payment = Payment.objects.select_related('router__isp', 'voucher').get(hubtel_ref=ref)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=404)

        if status in ('Success', 'success', 'Successful'):
            with db_transaction.atomic():
                payment.status       = 'success'
                payment.completed_at = timezone.now()
                payment.save()

                # Credit ISP wallet (90% of sale)
                from wallet.models import ISPWallet
                wallet, _ = ISPWallet.objects.get_or_create(isp=payment.router.isp)
                wallet.credit(
                    amount=payment.isp_amount,
                    description=f'Sale: {payment.package.name} — {payment.phone_number}',
                    payment=payment,
                )
        else:
            with db_transaction.atomic():
                payment.status = 'failed'
                payment.save()
                if payment.voucher:
                    payment.voucher.status  = 'available'
                    payment.voucher.sold_at = None
                    payment.voucher.save()

        return Response({'received': True})


class PaymentStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, payment_id):
        try:
            payment = Payment.objects.select_related('router', 'voucher', 'package').get(id=payment_id)
        except Payment.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        data = {
            'status':  payment.status,
            'package': payment.package.name,
            'amount':  str(payment.amount_ghs),
        }

        if payment.status == 'success' and payment.voucher:
            code = payment.voucher.code
            data['login_url'] = (
                f'http://{payment.router.router_ip}/login'
                f'?username={code}&password={code}&dst=http://google.com'
            )
            data['code'] = code

        return Response(data)


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from wallet.models import ISPWallet, WalletTransaction
        routers  = Router.objects.filter(isp=request.user)
        payments = Payment.objects.filter(router__in=routers, status='success')

        today         = timezone.now().date()
        total_revenue = sum(p.isp_amount for p in payments)
        today_revenue = sum(
            p.isp_amount for p in payments
            if p.completed_at and p.completed_at.date() == today
        )

        wallet_balance = Decimal('0')
        try:
            wallet_balance = request.user.wallet.balance
        except Exception:
            pass

        return Response({
            'total_revenue':  float(total_revenue),
            'today_revenue':  float(today_revenue),
            'total_sales':    payments.count(),
            'today_sales':    payments.filter(completed_at__date=today).count(),
            'routers':        routers.count(),
            'wallet_balance': float(wallet_balance),
        })
