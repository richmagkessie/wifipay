from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.utils import timezone
from django.conf import settings
from .models import Payment
from .hubtel import initiate_payment
from vouchers.models import Voucher
from hotspot.models import Package, Router
import uuid


class InitiatePaymentView(APIView):
    """Called from captive portal — no auth needed."""
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

        # Reserve a voucher
        voucher = Voucher.objects.filter(
            batch__router=router,
            batch__package=package,
            status='available'
        ).select_for_update().first()

        if not voucher:
            return Response({'error': 'No vouchers available for this package'}, status=503)

        ref = str(uuid.uuid4()).replace('-', '')[:20]

        payment = Payment.objects.create(
            router=router,
            package=package,
            voucher=voucher,
            amount_ghs=package.price_ghs,
            phone_number=phone,
            device_mac=device_mac,
            device_ip=device_ip,
            hubtel_ref=ref,
        )

        voucher.status = 'sold'
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
            return Response({
                'payment_id':   str(payment.id),
                'reference':    ref,
                'hubtel':       hubtel_resp,
            })
        except Exception as e:
            # Roll back voucher reservation on Hubtel failure
            voucher.status = 'available'
            voucher.sold_at = None
            voucher.save()
            payment.delete()
            return Response({'error': str(e)}, status=502)


class HubtelWebhookView(APIView):
    """Hubtel calls this after payment completes."""
    permission_classes = [AllowAny]

    def post(self, request):
        data      = request.data
        ref       = data.get('ClientReference') or data.get('clientReference', '')
        status_   = data.get('Status') or data.get('status', '')

        try:
            payment = Payment.objects.get(hubtel_ref=ref)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=404)

        if status_ in ('Success', 'success', 'Successful'):
            payment.status       = 'success'
            payment.completed_at = timezone.now()
            payment.save()
        else:
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
            payment = Payment.objects.get(id=payment_id)
        except Payment.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        data = {
            'status':  payment.status,
            'package': payment.package.name,
            'amount':  str(payment.amount_ghs),
        }

        if payment.status == 'success' and payment.voucher:
            # Return auto-login URL — user's browser is still on the hotspot network
            code = payment.voucher.code
            data['login_url'] = f'http://{payment.router.router_ip}/login?username={code}&password={code}&dst=http://google.com'
            data['code'] = code

        return Response(data)


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        routers  = Router.objects.filter(isp=request.user)
        payments = Payment.objects.filter(router__in=routers, status='success')

        total_revenue = sum(p.amount_ghs for p in payments)
        today = timezone.now().date()
        today_revenue = sum(
            p.amount_ghs for p in payments
            if p.completed_at and p.completed_at.date() == today
        )

        return Response({
            'total_revenue':  float(total_revenue),
            'today_revenue':  float(today_revenue),
            'total_sales':    payments.count(),
            'today_sales':    payments.filter(completed_at__date=today).count(),
            'routers':        routers.count(),
        })
