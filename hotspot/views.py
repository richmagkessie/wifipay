from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Router, Package
from .serializers import RouterSerializer, RouterWriteSerializer, PackageSerializer


class RouterListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = RouterSerializer

    def get_queryset(self):
        return Router.objects.filter(isp=self.request.user).prefetch_related('packages')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RouterWriteSerializer
        return RouterSerializer

    def perform_create(self, serializer):
        serializer.save(isp=self.request.user)


class RouterDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = RouterSerializer

    def get_queryset(self):
        return Router.objects.filter(isp=self.request.user)


class PackageListCreateView(generics.ListCreateAPIView):
    serializer_class = PackageSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        router_id = self.kwargs.get('router_pk')
        return Package.objects.filter(router__id=router_id, is_active=True)

    def perform_create(self, serializer):
        router = Router.objects.get(pk=self.kwargs['router_pk'], isp=self.request.user)
        serializer.save(router=router)


class PackageDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = PackageSerializer

    def get_queryset(self):
        return Package.objects.filter(router__isp=self.request.user)
