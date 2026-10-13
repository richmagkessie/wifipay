from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction as db_transaction
from decimal import Decimal
import uuid

from .models import ISPWallet, WithdrawalRequest
from .serializers import WalletSerializer, WithdrawalRequestSerializer
from payments.hubtel import disburse_to_momo

MIN_WITHDRAWAL = Decimal('5.00')


class WalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = ISPWallet.objects.get_or_create(isp=request.user)
        return Response(WalletSerializer(wallet).data)


class WithdrawView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount      = Decimal(str(request.data.get('amount', 0)))
        momo_number = request.data.get('momo_number', '').strip()
        momo_name   = request.data.get('momo_name', '').strip()

        if amount < MIN_WITHDRAWAL:
            return Response({'error': f'Minimum withdrawal is GHS {MIN_WITHDRAWAL}'}, status=400)

        if not momo_number or not momo_name:
            return Response({'error': 'MoMo number and account name are required'}, status=400)

        wallet, _ = ISPWallet.objects.get_or_create(isp=request.user)

        if wallet.balance < amount:
            return Response({'error': f'Insufficient balance. Available: GHS {wallet.balance}'}, status=400)

        ref = str(uuid.uuid4()).replace('-', '')[:20]

        with db_transaction.atomic():
            withdrawal = WithdrawalRequest.objects.create(
                wallet=wallet,
                amount=amount,
                momo_number=momo_number,
                momo_name=momo_name,
                status='processing',
                hubtel_ref=ref,
            )
            wallet.debit(
                amount=amount,
                description=f'Withdrawal to {momo_number} ({momo_name})',
            )

        try:
            disburse_to_momo(
                phone=momo_number,
                amount=amount,
                reference=ref,
                description=f'WifiPay withdrawal — {request.user.business_name}',
            )
            withdrawal.status = 'completed'
            withdrawal.save(update_fields=['status'])
            return Response({'message': f'GHS {amount} sent to {momo_number}', 'reference': ref})
        except Exception as e:
            # Disbursal failed — reverse the debit
            with db_transaction.atomic():
                wallet.credit(
                    amount=amount,
                    description=f'Withdrawal reversal — disbursement failed',
                )
                withdrawal.status      = 'failed'
                withdrawal.failure_msg = str(e)[:300]
                withdrawal.save(update_fields=['status', 'failure_msg'])
            return Response({'error': 'Disbursement failed. Your balance has been restored.'}, status=502)


class WithdrawalHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = ISPWallet.objects.get_or_create(isp=request.user)
        withdrawals = wallet.withdrawals.all()[:50]
        return Response(WithdrawalRequestSerializer(withdrawals, many=True).data)
