from rest_framework import serializers
from .models import ISPWallet, WalletTransaction, WithdrawalRequest


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WalletTransaction
        fields = ['id', 'type', 'amount', 'description', 'created_at']


class WalletSerializer(serializers.ModelSerializer):
    transactions = WalletTransactionSerializer(many=True, read_only=True)

    class Meta:
        model  = ISPWallet
        fields = ['balance', 'total_earned', 'total_withdrawn', 'updated_at', 'transactions']


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WithdrawalRequest
        fields = ['id', 'amount', 'momo_number', 'momo_name', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']
