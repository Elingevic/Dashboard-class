"""
Esquema en estrella (Star Schema) para BI de despliegues.

El modelo dimensional separa atributos descriptivos (dimensiones) de las métricas
transaccionales (hechos). Cumple el estándar académico de bases multidimensionales:
consultas OLAP por GROUP BY en dimensiones, agregación SUM/COUNT en hechos, y un solo
punto de verdad (fact_despliegue) alimentado desde la sábana BI_DESPLIEGUES.
"""

from django.db import models


class DimProyecto(models.Model):
    id_proyecto = models.CharField(max_length=20, primary_key=True)
    proyecto = models.CharField(max_length=150)
    repositorio = models.CharField(max_length=255, blank=True, null=True)
    rama = models.CharField(max_length=80, blank=True, null=True)
    estado_proyecto = models.CharField(max_length=40, blank=True, null=True)

    class Meta:
        db_table = 'dim_proyecto'
        managed = False
        verbose_name = 'Dimensión Proyecto'
        verbose_name_plural = 'Dimensiones Proyecto'

    def __str__(self) -> str:
        return self.proyecto


class DimUsuario(models.Model):
    id_usuario = models.CharField(max_length=20, primary_key=True)
    responsable = models.CharField(max_length=120)
    area = models.CharField(max_length=120, blank=True, null=True)
    cargo = models.CharField(max_length=120, blank=True, null=True)
    rol_asignado = models.CharField(max_length=80, blank=True, null=True)

    class Meta:
        db_table = 'dim_usuario'
        managed = False
        verbose_name = 'Dimensión Usuario'

    def __str__(self) -> str:
        return self.responsable


class DimAmbiente(models.Model):
    id_ambiente = models.CharField(max_length=20, primary_key=True)
    ambiente = models.CharField(max_length=80)
    criticidad = models.CharField(max_length=20, blank=True, null=True)
    requiere_aprobacion = models.BooleanField(default=False)

    class Meta:
        db_table = 'dim_ambiente'
        managed = False
        verbose_name = 'Dimensión Ambiente'

    def __str__(self) -> str:
        return self.ambiente


class DimServidor(models.Model):
    id_servidor = models.CharField(max_length=20, primary_key=True)
    servidor = models.CharField(max_length=150)
    tipo_servidor = models.CharField(max_length=80, blank=True, null=True)
    ruta_espacio = models.CharField(max_length=255, blank=True, null=True)
    administrado_por = models.CharField(max_length=120, blank=True, null=True)

    class Meta:
        db_table = 'dim_servidor'
        managed = False
        verbose_name = 'Dimensión Servidor'

    def __str__(self) -> str:
        return self.servidor


class DimTiempo(models.Model):
    """
    Dimensión de tiempo con grano día (id_tiempo = fecha de solicitud).
    Atributos mes, semana, trimestre y anio evitan funciones de fecha en cada reporte.
    """

    id_tiempo = models.DateField(primary_key=True)
    mes = models.CharField(max_length=20, blank=True, null=True)
    semana = models.SmallIntegerField(blank=True, null=True)
    trimestre = models.CharField(max_length=5, blank=True, null=True)
    anio = models.SmallIntegerField(blank=True, null=True)

    class Meta:
        db_table = 'dim_tiempo'
        managed = False
        verbose_name = 'Dimensión Tiempo'

    def __str__(self) -> str:
        return str(self.id_tiempo)


class FactDespliegue(models.Model):
    """Tabla de hechos central: FK a dimensiones + métricas e indicadores."""

    id_despliegue = models.CharField(max_length=20, primary_key=True)
    proyecto = models.ForeignKey(
        DimProyecto,
        on_delete=models.DO_NOTHING,
        db_column='id_proyecto',
        related_name='hechos',
    )
    usuario = models.ForeignKey(
        DimUsuario,
        on_delete=models.DO_NOTHING,
        db_column='id_usuario',
        related_name='hechos',
    )
    servidor = models.ForeignKey(
        DimServidor,
        on_delete=models.DO_NOTHING,
        db_column='id_servidor',
        related_name='hechos',
    )
    ambiente = models.ForeignKey(
        DimAmbiente,
        on_delete=models.DO_NOTHING,
        db_column='id_ambiente',
        related_name='hechos',
    )
    tiempo = models.ForeignKey(
        DimTiempo,
        on_delete=models.DO_NOTHING,
        db_column='id_tiempo',
        related_name='hechos',
        blank=True,
        null=True,
    )

    fecha_solicitud = models.DateTimeField()
    fecha_inicio = models.DateTimeField(blank=True, null=True)
    fecha_fin = models.DateTimeField(blank=True, null=True)
    commit_hash = models.CharField(max_length=64, blank=True, null=True)
    estado_despliegue = models.CharField(max_length=40)
    resultado_final = models.CharField(max_length=80, blank=True, null=True)
    observacion = models.TextField(blank=True, null=True)

    validaciones_total = models.IntegerField(default=0)
    validaciones_aprobadas = models.IntegerField(default=0)
    validaciones_fallidas = models.IntegerField(default=0)
    aprobaciones_total = models.IntegerField(default=0)
    migraciones_total = models.IntegerField(default=0)
    migraciones_fallidas = models.IntegerField(default=0)
    evidencias_total = models.IntegerField(default=0)

    duracion_minutos = models.IntegerField(blank=True, null=True)
    tiempo_aprobacion_horas = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True
    )

    despliegue_exitoso_flag = models.SmallIntegerField(default=0)
    despliegue_fallido_flag = models.SmallIntegerField(default=0)
    rollback_flag = models.SmallIntegerField(default=0)
    evidencia_completa_flag = models.SmallIntegerField(default=0)
    control_completo_flag = models.SmallIntegerField(default=0)

    ultima_decision_aprobacion = models.CharField(max_length=40, blank=True, null=True)
    evidencia_completa = models.CharField(max_length=5, blank=True, null=True)
    rollback_realizado = models.CharField(max_length=5, blank=True, null=True)
    motivo_rollback = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'fact_despliegue'
        managed = False
        verbose_name = 'Hecho Despliegue'
        verbose_name_plural = 'Hechos Despliegue'

    def __str__(self) -> str:
        return self.id_despliegue
