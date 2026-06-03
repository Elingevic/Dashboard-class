"""
Serializador desnormalizado para el frontend (gráficos / tablas).
Usa select_related sobre las FK del esquema en estrella para un solo JOIN por dimensión.
"""

from rest_framework import serializers

from .models import FactDespliegue


class FactDespliegueDenormalizadoSerializer(serializers.ModelSerializer):
    """JSON plano tipo sábana BI: dimensiones aplanadas + métricas del hecho."""

    id_proyecto = serializers.CharField(source='proyecto_id', read_only=True)
    proyecto = serializers.CharField(source='proyecto.proyecto', read_only=True)
    repositorio = serializers.CharField(source='proyecto.repositorio', read_only=True)
    rama = serializers.CharField(source='proyecto.rama', read_only=True)
    estado_proyecto = serializers.CharField(source='proyecto.estado_proyecto', read_only=True)

    id_usuario = serializers.CharField(source='usuario_id', read_only=True)
    responsable = serializers.CharField(source='usuario.responsable', read_only=True)
    area = serializers.CharField(source='usuario.area', read_only=True)
    cargo = serializers.CharField(source='usuario.cargo', read_only=True)
    rol_asignado = serializers.CharField(source='usuario.rol_asignado', read_only=True)

    id_servidor = serializers.CharField(source='servidor_id', read_only=True)
    servidor = serializers.CharField(source='servidor.servidor', read_only=True)
    tipo_servidor = serializers.CharField(source='servidor.tipo_servidor', read_only=True)
    ruta_espacio = serializers.CharField(source='servidor.ruta_espacio', read_only=True)
    administrado_por = serializers.CharField(
        source='servidor.administrado_por', read_only=True
    )

    id_ambiente = serializers.CharField(source='ambiente_id', read_only=True)
    ambiente = serializers.CharField(source='ambiente.ambiente', read_only=True)
    criticidad = serializers.CharField(source='ambiente.criticidad', read_only=True)
    requiere_aprobacion = serializers.BooleanField(
        source='ambiente.requiere_aprobacion', read_only=True
    )

    mes = serializers.CharField(source='tiempo.mes', read_only=True, allow_null=True)
    semana = serializers.IntegerField(source='tiempo.semana', read_only=True, allow_null=True)
    trimestre = serializers.CharField(
        source='tiempo.trimestre', read_only=True, allow_null=True
    )
    anio = serializers.IntegerField(source='tiempo.anio', read_only=True, allow_null=True)

    class Meta:
        model = FactDespliegue
        fields = [
            'id_despliegue',
            'id_proyecto',
            'proyecto',
            'repositorio',
            'rama',
            'estado_proyecto',
            'id_usuario',
            'responsable',
            'area',
            'cargo',
            'rol_asignado',
            'id_servidor',
            'servidor',
            'tipo_servidor',
            'ruta_espacio',
            'administrado_por',
            'id_ambiente',
            'ambiente',
            'criticidad',
            'requiere_aprobacion',
            'mes',
            'semana',
            'trimestre',
            'anio',
            'fecha_solicitud',
            'fecha_inicio',
            'fecha_fin',
            'commit_hash',
            'estado_despliegue',
            'resultado_final',
            'observacion',
            'validaciones_total',
            'validaciones_aprobadas',
            'validaciones_fallidas',
            'aprobaciones_total',
            'migraciones_total',
            'migraciones_fallidas',
            'evidencias_total',
            'duracion_minutos',
            'tiempo_aprobacion_horas',
            'despliegue_exitoso_flag',
            'despliegue_fallido_flag',
            'rollback_flag',
            'evidencia_completa_flag',
            'control_completo_flag',
            'ultima_decision_aprobacion',
            'evidencia_completa',
            'rollback_realizado',
            'motivo_rollback',
        ]


def queryset_hechos_desnormalizados():
    """
    QuerySet recomendado: un JOIN por dimensión (select_related), sin N+1.
    """
    return FactDespliegue.objects.select_related(
        'proyecto', 'usuario', 'servidor', 'ambiente', 'tiempo'
    ).order_by('-fecha_solicitud')
