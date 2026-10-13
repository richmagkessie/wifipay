from django.urls import path
from .views import InitiatePaymentView, HubtelWebhookView, PaymentStatusView, DashboardStatsView

urlpatterns = [
    path('initiate/',        InitiatePaymentView.as_view()),
    path('webhook/',         HubtelWebhookView.as_view()),
    path('<uuid:payment_id>/status/', PaymentStatusView.as_view()),
    path('dashboard/stats/', DashboardStatsView.as_view()),
]
