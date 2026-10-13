from django.urls import path
from . import views

urlpatterns = [
    path('batches/', views.VoucherBatchListCreateView.as_view()),
]
