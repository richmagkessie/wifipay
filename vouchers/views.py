from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import VoucherBatch, Voucher
from hotspot.models import Router, Package


class VoucherBatchListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        batches = VoucherBatch.objects.filter(router__isp=request.user).select_related('router', 'package').order_by('-created_at')
        data = []
        for b in batches:
            qs = b.vouchers
            data.append({
                'id':           str(b.id),
                'router_name':  b.router.name,
                'package_name': b.package.name,
                'count':        b.count,
                'available':    qs.filter(status='available').count(),
                'sold':         qs.filter(status='sold').count(),
                'used':         qs.filter(status='used').count(),
                'created_at':   b.created_at,
            })
        return Response(data)

    def post(self, request):
        router_id  = request.data.get('router_id')
        package_id = request.data.get('package_id')
        codes      = request.data.get('codes', [])

        if not codes:
            return Response({'error': 'No codes provided'}, status=400)

        try:
            router  = Router.objects.get(id=router_id, isp=request.user)
            package = Package.objects.get(id=package_id, router=router)
        except (Router.DoesNotExist, Package.DoesNotExist):
            return Response({'error': 'Invalid router or package'}, status=400)

        # Deduplicate against existing codes
        existing = set(Voucher.objects.filter(code__in=codes).values_list('code', flat=True))
        new_codes = [c for c in codes if c not in existing]

        if not new_codes:
            return Response({'error': 'All codes already exist in the system'}, status=400)

        batch = VoucherBatch.objects.create(
            router=router,
            package=package,
            created_by=request.user,
            count=len(new_codes),
        )
        Voucher.objects.bulk_create([
            Voucher(batch=batch, code=code) for code in new_codes
        ])

        return Response({
            'id':        str(batch.id),
            'uploaded':  len(new_codes),
            'skipped':   len(codes) - len(new_codes),
        }, status=201)
