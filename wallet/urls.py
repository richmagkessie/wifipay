from django.urls import path
from . import views

urlpatterns = [
    path('',            views.WalletView.as_view()),
    path('withdraw/',   views.WithdrawView.as_view()),
    path('history/',    views.WithdrawalHistoryView.as_view()),
]
