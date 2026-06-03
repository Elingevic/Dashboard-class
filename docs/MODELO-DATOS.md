# Modelo de datos — Diagrama ER

> Documentación completa (tablas, columnas, relaciones, instalación):  
> **[README-BASE-DE-DATOS.md](./README-BASE-DE-DATOS.md)**

## Diagrama entidad-relación

```mermaid
erDiagram
  USUARIO ||--o{ DESPLIEGUE : ejecuta
  PROYECTO ||--o{ DESPLIEGUE : tiene
  SERVIDOR ||--o{ DESPLIEGUE : hospeda
  AMBIENTE ||--o{ SERVIDOR : contiene
  DESPLIEGUE ||--o{ APROBACION : requiere
  DESPLIEGUE ||--o{ ROLLBACK : sufre
  DESPLIEGUE ||--o{ EVIDENCIA : documenta

  USUARIO {
    int id_usuario PK
    varchar nombre_completo
    varchar correo UK
    varchar area
    varchar cargo
    varchar rol_asignado
    boolean activo
  }

  PROYECTO {
    varchar id_proyecto PK
    varchar nombre
    text descripcion
    varchar repositorio
    varchar rama_principal
    varchar estado
    varchar version_actual
  }

  AMBIENTE {
    varchar id_ambiente PK
    varchar nombre UK
    text descripcion
    varchar criticidad
    boolean requiere_aprobacion
  }

  SERVIDOR {
    varchar id_servidor PK
    varchar id_ambiente FK
    varchar nombre_host
    varchar ruta_espacio
    varchar tipo_servidor
    varchar administrado_por
    varchar estado_servidor
  }

  DESPLIEGUE {
    varchar id_despliegue PK
    int id_usuario FK
    varchar id_proyecto FK
    varchar id_servidor FK
    varchar commit_hash
    timestamp fecha_solicitud
    timestamp fecha_inicio
    timestamp fecha_fin
    varchar estado
    varchar resultado_final
    text observacion
  }

  APROBACION {
    varchar id_despliegue PK_FK
    int nro_aprobacion PK
    varchar aprobador
    varchar decision
    timestamp fecha_decision
    text comentario
  }

  ROLLBACK {
    varchar id_despliegue PK_FK
    int nro_rollback PK
    varchar commit_anterior
    text motivo
    timestamp fecha_rollback
    varchar resultado
    varchar responsable
  }

  EVIDENCIA {
    varchar id_despliegue PK_FK
    int nro_evidencia PK
    varchar tipo_evidencia
    varchar ruta_archivo
    varchar hash_archivo
    timestamp fecha_registro
    text descripcion
  }
```

Ver el mapeo al diseño del curso y el script SQL en [README-BASE-DE-DATOS.md](./README-BASE-DE-DATOS.md).
