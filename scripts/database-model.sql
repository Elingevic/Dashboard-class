-- =============================================================================
-- Modelo de datos: Control de despliegue de software
-- PostgreSQL 14+ (local)
--
-- Uso:
--   psql -U postgres -d postgres -f scripts/database-model.sql
--   o:  pnpm db:setup
--
-- Recrea tablas del dashboard + datos de prueba (trimestre T2 2026).
-- No incluye tablas Django ni otros proyectos en la misma BD.
-- =============================================================================

BEGIN;

-- ── Limpieza (orden inverso a dependencias) ───────────────────────────────────
DROP TABLE IF EXISTS evidencia CASCADE;
DROP TABLE IF EXISTS rollback CASCADE;
DROP TABLE IF EXISTS aprobacion CASCADE;
DROP TABLE IF EXISTS despliegue CASCADE;
DROP TABLE IF EXISTS servidor CASCADE;
DROP TABLE IF EXISTS ambiente CASCADE;
DROP TABLE IF EXISTS proyecto CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

-- ── Dimensiones ───────────────────────────────────────────────────────────────

CREATE TABLE usuario (
  id_usuario      INTEGER PRIMARY KEY,
  nombre_completo VARCHAR(120) NOT NULL,
  correo          VARCHAR(120) NOT NULL UNIQUE,
  area            VARCHAR(80),
  cargo           VARCHAR(80),
  rol_asignado    VARCHAR(60),
  activo          BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE usuario IS 'Usuarios responsables de solicitar o ejecutar despliegues.';

CREATE TABLE proyecto (
  id_proyecto     VARCHAR(20) PRIMARY KEY,
  nombre          VARCHAR(120) NOT NULL,
  descripcion     TEXT,
  repositorio     VARCHAR(255),
  rama_principal  VARCHAR(80),
  estado          VARCHAR(40),
  version_actual  VARCHAR(40)
);

COMMENT ON TABLE proyecto IS 'Proyectos de software desplegables.';

CREATE TABLE ambiente (
  id_ambiente          VARCHAR(20) PRIMARY KEY,
  nombre               VARCHAR(80) NOT NULL UNIQUE,
  descripcion          TEXT,
  criticidad           VARCHAR(20),
  requiere_aprobacion  BOOLEAN NOT NULL DEFAULT FALSE
);

COMMENT ON TABLE ambiente IS 'Ambientes de infraestructura (Producción, QA, etc.).';

CREATE TABLE servidor (
  id_servidor       VARCHAR(20) PRIMARY KEY,
  id_ambiente       VARCHAR(20) NOT NULL REFERENCES ambiente (id_ambiente),
  nombre_host       VARCHAR(150) NOT NULL,
  ruta_espacio      VARCHAR(255),
  tipo_servidor     VARCHAR(80),
  administrado_por  VARCHAR(120),
  estado_servidor   VARCHAR(40)
);

COMMENT ON TABLE servidor IS 'Servidores asociados a un ambiente.';

-- ── Hecho central: DESPLIEGUE ─────────────────────────────────────────────────

CREATE TABLE despliegue (
  id_despliegue    VARCHAR(20) PRIMARY KEY,
  id_usuario       INTEGER NOT NULL REFERENCES usuario (id_usuario),
  id_proyecto      VARCHAR(20) NOT NULL REFERENCES proyecto (id_proyecto),
  id_servidor      VARCHAR(20) NOT NULL REFERENCES servidor (id_servidor),
  commit_hash      VARCHAR(64),
  fecha_solicitud  TIMESTAMP NOT NULL,
  fecha_inicio     TIMESTAMP,
  fecha_fin        TIMESTAMP,
  estado           VARCHAR(40) NOT NULL,
  resultado_final  VARCHAR(80),
  observacion      TEXT,
  CONSTRAINT chk_despliegue_fechas CHECK (
    fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio
  )
);

COMMENT ON TABLE despliegue IS 'Evento de despliegue a partir de un commit validado.';
COMMENT ON COLUMN despliegue.commit_hash IS 'Proxy de validación de commit en el modelo lógico.';

CREATE INDEX idx_despliegue_estado ON despliegue (estado);
CREATE INDEX idx_despliegue_fechas ON despliegue (fecha_solicitud, fecha_fin);

-- ── Entidades de control / trazabilidad ─────────────────────────────────────

CREATE TABLE aprobacion (
  id_despliegue   VARCHAR(20) NOT NULL REFERENCES despliegue (id_despliegue) ON DELETE CASCADE,
  nro_aprobacion  INTEGER NOT NULL,
  aprobador       VARCHAR(120) NOT NULL,
  decision        VARCHAR(40) NOT NULL,
  fecha_decision  TIMESTAMP NOT NULL,
  comentario      TEXT,
  PRIMARY KEY (id_despliegue, nro_aprobacion)
);

COMMENT ON TABLE aprobacion IS 'Gobernanza: aprobación previa al despliegue en ambientes críticos.';

CREATE TABLE rollback (
  id_despliegue    VARCHAR(20) NOT NULL REFERENCES despliegue (id_despliegue) ON DELETE CASCADE,
  nro_rollback     INTEGER NOT NULL,
  commit_anterior  VARCHAR(64),
  motivo           TEXT NOT NULL,
  fecha_rollback   TIMESTAMP NOT NULL,
  resultado        VARCHAR(40),
  responsable      VARCHAR(120),
  PRIMARY KEY (id_despliegue, nro_rollback)
);

COMMENT ON TABLE rollback IS 'Reversión de un despliegue fallido o de riesgo.';

CREATE TABLE evidencia (
  id_despliegue     VARCHAR(20) NOT NULL REFERENCES despliegue (id_despliegue) ON DELETE CASCADE,
  nro_evidencia     INTEGER NOT NULL,
  tipo_evidencia    VARCHAR(60) NOT NULL,
  ruta_archivo      VARCHAR(255),
  hash_archivo      VARCHAR(64),
  fecha_registro    TIMESTAMP NOT NULL,
  descripcion       TEXT,
  PRIMARY KEY (id_despliegue, nro_evidencia)
);

COMMENT ON TABLE evidencia IS 'Archivos y registros que respaldan la trazabilidad del despliegue.';

-- =============================================================================
-- Datos de prueba — Trimestre T2 2026 (abr–jun 2026)
-- =============================================================================

INSERT INTO usuario (id_usuario, nombre_completo, correo, area, cargo, rol_asignado, activo) VALUES
  (1, 'Juan Pérez', 'juan.perez@empresa.com', 'TI', 'DevOps Engineer', 'Administrador', TRUE),
  (2, 'Ana Gómez', 'ana.gomez@empresa.com', 'TI', 'Backend Developer', 'Desarrollador', TRUE),
  (3, 'Carlos Ruiz', 'carlos.ruiz@empresa.com', 'QA', 'QA Engineer', 'Aprobador', TRUE),
  (4, 'Sofía Castro', 'sofia.castro@empresa.com', 'TI', 'Frontend Developer', 'Desarrollador', TRUE),
  (5, 'Luis Martinez', 'luis.martinez@empresa.com', 'Operaciones', 'SysAdmin', 'Administrador', TRUE);

INSERT INTO proyecto (id_proyecto, nombre, descripcion, repositorio, rama_principal, estado, version_actual) VALUES
  ('PRJ-PAY', 'API de Pagos', 'Servicio de integración con pasarelas de pago', 'git@github.com:empresa/api-pagos.git', 'main', 'Activo', 'v2.4.1'),
  ('PRJ-WEB', 'Frontend Web', 'Portal de cara al cliente principal', 'git@github.com:empresa/frontend-web.git', 'main', 'Activo', 'v1.12.0'),
  ('PRJ-PROV', 'Portal Proveedores', 'Plataforma para gestión de proveedores', 'git@github.com:empresa/portal-proveedores.git', 'master', 'Mantenimiento', 'v0.8.5'),
  ('PRJ-MOB', 'App Móvil', 'Aplicación nativa iOS y Android', 'git@github.com:empresa/app-movil.git', 'develop', 'Activo', 'v3.2.0');

INSERT INTO ambiente (id_ambiente, nombre, descripcion, criticidad, requiere_aprobacion) VALUES
  ('ENV-PROD', 'Producción', 'Ambiente de producción principal', 'Alta', TRUE),
  ('ENV-STAGE', 'Staging', 'Ambiente de pre-producción staging', 'Alta', TRUE),
  ('ENV-QA', 'QA', 'Ambiente de pruebas y control de calidad', 'Media', FALSE),
  ('ENV-DEV', 'Desarrollo', 'Ambiente de desarrollo y sandbox', 'Baja', FALSE);

INSERT INTO servidor (id_servidor, id_ambiente, nombre_host, ruta_espacio, tipo_servidor, administrado_por, estado_servidor) VALUES
  ('SRV-PROD-01', 'ENV-PROD', 'prod-server-01.empresa.internal', '/var/www/html/prod', 'Linux VPS', 'Luis Martinez', 'Online'),
  ('SRV-STAGE-01', 'ENV-STAGE', 'stage-server-01.empresa.internal', '/var/www/html/stage', 'Linux VPS', 'Juan Pérez', 'Online'),
  ('SRV-QA-01', 'ENV-QA', 'qa-server-01.empresa.internal', '/var/www/html/qa', 'Docker Host', 'Carlos Ruiz', 'Online'),
  ('SRV-DEV-01', 'ENV-DEV', 'dev-server-01.empresa.internal', '/var/www/html/dev', 'Docker Host', 'Juan Pérez', 'Online');

INSERT INTO despliegue (id_despliegue, id_usuario, id_proyecto, id_servidor, commit_hash, fecha_solicitud, fecha_inicio, fecha_fin, estado, resultado_final, observacion) VALUES
  ('DEP-001', 1, 'PRJ-PAY', 'SRV-PROD-01', 'a1b2c3d', '2026-05-20 10:00:00', '2026-05-20 10:05:00', '2026-05-20 10:15:00', 'Fallido', 'Error de conexión a BD', 'Despliegue revertido automáticamente.'),
  ('DEP-002', 2, 'PRJ-PAY', 'SRV-DEV-01', 'e4f5g6h', '2026-05-21 09:00:00', '2026-05-21 09:02:00', '2026-05-21 09:05:00', 'Exitoso', 'Completado', 'Pruebas unitarias pasaron correctamente.'),
  ('DEP-003', 4, 'PRJ-WEB', 'SRV-STAGE-01', '789abcd', '2026-05-22 14:00:00', '2026-05-22 14:05:00', '2026-05-22 14:12:00', 'Exitoso', 'Completado', 'Verificado en staging.'),
  ('DEP-004', 2, 'PRJ-PROV', 'SRV-QA-01', 'f3e2d1c', '2026-05-23 11:00:00', '2026-05-23 11:02:00', '2026-05-23 11:08:00', 'Exitoso', 'Completado', 'Pruebas de regresión exitosas.'),
  ('DEP-005', 1, 'PRJ-PAY', 'SRV-PROD-01', 'c8d7e6f', '2026-05-24 16:00:00', '2026-05-24 16:05:00', '2026-05-24 16:20:00', 'Fallido', 'NullPointerException', 'Rollback ejecutado a la versión v2.4.0.'),
  ('DEP-006', 4, 'PRJ-WEB', 'SRV-DEV-01', '9b8a7c6', '2026-05-25 08:30:00', '2026-05-25 08:31:00', '2026-05-25 08:34:00', 'Exitoso', 'Completado', 'Cambios menores de CSS.'),
  ('DEP-007', 2, 'PRJ-PROV', 'SRV-STAGE-01', '1a2b3c4', '2026-05-26 15:00:00', NULL, NULL, 'Cancelado', 'Cancelado por dev', 'Se detectó bug antes de iniciar la instalación.'),
  ('DEP-008', 4, 'PRJ-MOB', 'SRV-QA-01', '5e6f7g8', '2026-05-27 10:00:00', '2026-05-27 10:02:00', '2026-05-27 10:15:00', 'Exitoso', 'Completado', 'Build de Android e iOS generado y firmado.'),
  ('DEP-009', 2, 'PRJ-PAY', 'SRV-PROD-01', 'd4c3b2a', '2026-05-28 17:00:00', '2026-05-28 17:05:00', '2026-05-28 17:15:00', 'Fallido', 'Error de migración de BD', 'Se revirtió la migración mediante rollback.'),
  ('DEP-010', 4, 'PRJ-WEB', 'SRV-PROD-01', 'z1y2x3w', '2026-05-29 11:00:00', '2026-05-29 11:04:00', '2026-05-29 11:18:00', 'Fallido', 'Alto consumo de CPU', 'Se detectó fuga de memoria. Rollback de emergencia.'),
  ('DEP-011', 5, 'PRJ-PROV', 'SRV-DEV-01', '4v3u2t1', '2026-05-30 09:00:00', '2026-05-30 09:02:00', '2026-05-30 09:05:00', 'Exitoso', 'Completado', 'Despliegue rápido de hotfix.'),
  ('DEP-012', 4, 'PRJ-MOB', 'SRV-STAGE-01', '8m7n6b5', '2026-05-31 13:00:00', '2026-05-31 13:04:00', '2026-05-31 13:20:00', 'Exitoso', 'Completado', 'Disponible en TestFlight y Play Console interno.'),
  ('DEP-013', 1, 'PRJ-PAY', 'SRV-STAGE-01', 'p9o8i7u', '2026-06-01 10:00:00', '2026-06-01 10:05:00', '2026-06-01 10:14:00', 'Exitoso', 'Completado', 'Pruebas de carga OK.'),
  ('DEP-014', 2, 'PRJ-WEB', 'SRV-DEV-01', 'q1w2e3r', '2026-06-02 14:00:00', '2026-06-02 14:02:00', NULL, 'En Progreso', NULL, 'Copiando archivos estáticos a servidor de desarrollo.'),
  ('DEP-015', 4, 'PRJ-MOB', 'SRV-STAGE-01', 't5y6u7i', '2026-06-02 14:15:00', '2026-06-02 14:17:00', NULL, 'En Progreso', NULL, 'Ejecutando build en Jenkins.');

INSERT INTO aprobacion (id_despliegue, nro_aprobacion, aprobador, decision, fecha_decision, comentario) VALUES
  ('DEP-001', 1, 'Carlos Ruiz', 'Aprobado', '2026-05-20 09:50:00', 'Listo para producción.'),
  ('DEP-003', 1, 'Carlos Ruiz', 'Aprobado', '2026-05-22 13:45:00', 'Staging validado.'),
  ('DEP-005', 1, 'Carlos Ruiz', 'Aprobado', '2026-05-24 15:55:00', 'Aprobado para despliegue.'),
  ('DEP-010', 1, 'Carlos Ruiz', 'Aprobado', '2026-05-29 10:45:00', 'Despliegue urgente autorizado.');

INSERT INTO rollback (id_despliegue, nro_rollback, commit_anterior, motivo, fecha_rollback, resultado, responsable) VALUES
  ('DEP-001', 1, 'v2.4.0-prod', 'Error grave de conectividad con la BD de producción en el arranque.', '2026-05-20 10:16:00', 'Exitoso', 'Juan Pérez'),
  ('DEP-005', 1, 'v2.4.0-prod', 'NullPointerException persistente al resolver dependencias.', '2026-05-24 16:22:00', 'Exitoso', 'Juan Pérez'),
  ('DEP-009', 1, 'v2.4.1', 'Migración corrupta de la tabla de facturación.', '2026-05-28 17:16:00', 'Exitoso', 'Ana Gómez'),
  ('DEP-010', 1, 'v1.11.2', 'Fuga de memoria severa tras 5 minutos de tráfico.', '2026-05-29 11:20:00', 'Exitoso', 'Sofía Castro');

INSERT INTO evidencia (id_despliegue, nro_evidencia, tipo_evidencia, ruta_archivo, hash_archivo, fecha_registro, descripcion) VALUES
  ('DEP-001', 1, 'Log de Error', '/logs/dep-001-error.log', 'hash123456', '2026-05-20 10:15:00', 'Log de error de base de datos'),
  ('DEP-002', 1, 'Reporte de Pruebas', '/reports/unit-tests-dep-002.pdf', 'hash234567', '2026-05-21 09:06:00', 'Reporte exitoso de Jest'),
  ('DEP-003', 1, 'Captura de Pantalla', '/screenshots/stage-dep-003.png', 'hash345678', '2026-05-22 14:15:00', 'Pantalla principal de home verificada'),
  ('DEP-004', 1, 'Reporte de QA', '/reports/regression-dep-004.pdf', 'hash456789', '2026-05-23 11:10:00', 'Aprobación de QA manual'),
  ('DEP-005', 1, 'Log de Excepción', '/logs/dep-005-exception.txt', 'hash567890', '2026-05-24 16:21:00', 'Stacktrace de Java NPE'),
  ('DEP-006', 1, 'Reporte de Linter', '/reports/eslint-dep-006.json', 'hash678901', '2026-05-25 08:35:00', 'Análisis estático sin errores'),
  ('DEP-008', 1, 'Enlace a Store', '/apk/app-dep-008.apk', 'hash890123', '2026-05-27 10:20:00', 'APK firmado de versión de pruebas'),
  ('DEP-009', 1, 'Log de DDL', '/logs/migration-error-dep-009.sql', 'hash901234', '2026-05-28 17:16:00', 'Fallo de migración de schema en columna facturas'),
  ('DEP-011', 1, 'Reporte de Cobertura', '/reports/coverage-dep-011.html', 'hash112233', '2026-05-30 09:06:00', 'Cobertura de código al 85%'),
  ('DEP-012', 1, 'Captura de TestFlight', '/images/testflight-dep-012.png', 'hash223344', '2026-05-31 13:25:00', 'Confirmación de subida a App Store Connect'),
  ('DEP-013', 1, 'Reporte de JMeter', '/reports/performance-dep-013.jtl', 'hash334455', '2026-06-01 10:15:00', 'Tiempos de respuesta menores a 200ms');

COMMIT;

-- Verificación rápida
SELECT 'usuario' AS tabla, COUNT(*)::int AS filas FROM usuario
UNION ALL SELECT 'proyecto', COUNT(*) FROM proyecto
UNION ALL SELECT 'ambiente', COUNT(*) FROM ambiente
UNION ALL SELECT 'servidor', COUNT(*) FROM servidor
UNION ALL SELECT 'despliegue', COUNT(*) FROM despliegue
UNION ALL SELECT 'aprobacion', COUNT(*) FROM aprobacion
UNION ALL SELECT 'rollback', COUNT(*) FROM rollback
UNION ALL SELECT 'evidencia', COUNT(*) FROM evidencia;
