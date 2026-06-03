from django.urls import path

from despliegues.views import FactDespliegueListAPIView

urlpatterns = [
    path('api/facts/', FactDespliegueListAPIView.as_view(), name='fact-despliegue-list'),
]
