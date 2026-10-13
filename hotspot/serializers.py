from rest_framework import serializers
from .models import Router, Package


class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Package
        fields = ['id', 'name', 'duration', 'price_ghs', 'speed_mbps', 'mikrotik_profile', 'is_active']


class RouterSerializer(serializers.ModelSerializer):
    packages = PackageSerializer(many=True, read_only=True)

    class Meta:
        model  = Router
        fields = ['id', 'name', 'location', 'router_ip', 'api_port', 'ssh_user', 'is_active', 'created_at', 'packages']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['isp'] = self.context['request'].user
        return super().create(validated_data)


class RouterWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Router
        fields = ['name', 'location', 'router_ip', 'api_port', 'ssh_user', 'ssh_password', 'is_active']
