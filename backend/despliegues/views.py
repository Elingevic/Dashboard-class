from rest_framework.generics import ListAPIView

from .serializers import (
    FactDespliegueDenormalizadoSerializer,
    queryset_hechos_desnormalizados,
)


class FactDespliegueListAPIView(ListAPIView):
    """GET /api/facts/ — hechos con dimensiones aplanadas para el dashboard."""

    serializer_class = FactDespliegueDenormalizadoSerializer

    def get_queryset(self):
        return queryset_hechos_desnormalizados()
