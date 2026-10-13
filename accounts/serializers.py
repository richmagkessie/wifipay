from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import ISPUser


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = ISPUser
        fields = ['email', 'password', 'business_name', 'phone', 'country']

    def create(self, validated_data):
        return ISPUser.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid credentials')
        data['user'] = user
        return data


class ISPUserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ISPUser
        fields = ['id', 'email', 'business_name', 'phone', 'country', 'created_at']
        read_only_fields = ['id', 'created_at']
