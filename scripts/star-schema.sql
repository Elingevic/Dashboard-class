-- =============================================================================
-- Esquema en estrella (Star Schema) — BI_DESPLIEGUES
-- Dimensiones + Fact_Despliegue para dashboard multidimensional
-- =============================================================================

BEGIN;

DROP TABLE IF EXISTS fact_despliegue CASCADE;
DROP TABLE IF EXISTS dim_tiempo CASCADE;
DROP TABLE IF EXISTS dim_ambiente CASCADE;
DROP TABLE IF EXISTS dim_servidor CASCADE;
DROP TABLE IF EXISTS dim_usuario CASCADE;
DROP TABLE IF EXISTS dim_proyecto CASCADE;

-- ── Dimensiones ───────────────────────────────────────────────────────────────

CREATE TABLE dim_proyecto (
  id_proyecto      VARCHAR(20) PRIMARY KEY,
  proyecto         VARCHAR(150) NOT NULL,
  repositorio      VARCHAR(255),
  rama             VARCHAR(80),
  estado_proyecto  VARCHAR(40)
);

CREATE TABLE dim_usuario (
  id_usuario     VARCHAR(20) PRIMARY KEY,
  responsable    VARCHAR(120) NOT NULL,
  area           VARCHAR(120),
  cargo          VARCHAR(120),
  rol_asignado   VARCHAR(80)
);

CREATE TABLE dim_ambiente (
  id_ambiente          VARCHAR(20) PRIMARY KEY,
  ambiente             VARCHAR(80) NOT NULL,
  criticidad           VARCHAR(20),
  requiere_aprobacion  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE dim_servidor (
  id_servidor       VARCHAR(20) PRIMARY KEY,
  servidor          VARCHAR(150) NOT NULL,
  tipo_servidor     VARCHAR(80),
  ruta_espacio      VARCHAR(255),
  administrado_por  VARCHAR(120)
);

CREATE TABLE dim_tiempo (
  id_tiempo   DATE PRIMARY KEY,
  mes         VARCHAR(20),
  semana      SMALLINT,
  trimestre   VARCHAR(5),
  anio        SMALLINT
);

COMMENT ON TABLE dim_tiempo IS
  'Dimensión temporal: id_tiempo = fecha de solicitud (grano día). '
  'Para agregaciones use mes, semana, trimestre y anio sin recalcular.';

-- ── Tabla de hechos ───────────────────────────────────────────────────────────

CREATE TABLE fact_despliegue (
  id_despliegue              VARCHAR(20) PRIMARY KEY,
  id_proyecto                VARCHAR(20) NOT NULL REFERENCES dim_proyecto (id_proyecto),
  id_usuario                 VARCHAR(20) NOT NULL REFERENCES dim_usuario (id_usuario),
  id_servidor                VARCHAR(20) NOT NULL REFERENCES dim_servidor (id_servidor),
  id_ambiente                VARCHAR(20) NOT NULL REFERENCES dim_ambiente (id_ambiente),
  id_tiempo                  DATE REFERENCES dim_tiempo (id_tiempo),
  fecha_solicitud            TIMESTAMP NOT NULL,
  fecha_inicio               TIMESTAMP,
  fecha_fin                  TIMESTAMP,
  commit_hash                VARCHAR(64),
  estado_despliegue          VARCHAR(40) NOT NULL,
  resultado_final            VARCHAR(80),
  observacion                TEXT,
  validaciones_total         INTEGER NOT NULL DEFAULT 0,
  validaciones_aprobadas     INTEGER NOT NULL DEFAULT 0,
  validaciones_fallidas      INTEGER NOT NULL DEFAULT 0,
  aprobaciones_total         INTEGER NOT NULL DEFAULT 0,
  migraciones_total          INTEGER NOT NULL DEFAULT 0,
  migraciones_fallidas       INTEGER NOT NULL DEFAULT 0,
  evidencias_total           INTEGER NOT NULL DEFAULT 0,
  duracion_minutos           INTEGER,
  tiempo_aprobacion_horas    NUMERIC(10, 2),
  despliegue_exitoso_flag    SMALLINT NOT NULL DEFAULT 0,
  despliegue_fallido_flag    SMALLINT NOT NULL DEFAULT 0,
  rollback_flag              SMALLINT NOT NULL DEFAULT 0,
  evidencia_completa_flag    SMALLINT NOT NULL DEFAULT 0,
  control_completo_flag      SMALLINT NOT NULL DEFAULT 0,
  ultima_decision_aprobacion VARCHAR(40),
  evidencia_completa         VARCHAR(5),
  rollback_realizado         VARCHAR(5),
  motivo_rollback            TEXT
);

CREATE INDEX idx_fact_despliegue_tiempo ON fact_despliegue (id_tiempo);
CREATE INDEX idx_fact_despliegue_estado ON fact_despliegue (estado_despliegue);
CREATE INDEX idx_fact_despliegue_ambiente ON fact_despliegue (id_ambiente);
CREATE INDEX idx_fact_despliegue_proyecto ON fact_despliegue (id_proyecto);

COMMIT;
