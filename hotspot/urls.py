from django.urls import path
from . import views

urlpatterns = [
    path('routers/',                                   views.RouterListCreateView.as_view()),
    path('routers/<uuid:pk>/',                         views.RouterDetailView.as_view()),
    path('routers/<uuid:router_pk>/packages/',         views.PackageListCreateView.as_view()),
    path('routers/<uuid:router_pk>/packages/<uuid:pk>/', views.PackageDetailView.as_view()),
]
