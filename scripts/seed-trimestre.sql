-- Verificación del trimestre T2 2026 (después de cargar el modelo).
-- Para crear tablas + datos desde cero, usa:  pnpm db:setup
-- o el archivo completo: scripts/database-model.sql

SELECT COUNT(*) AS total_q2
FROM despliegue d
WHERE COALESCE(d.fecha_fin, d.fecha_inicio, d.fecha_solicitud) >= '2026-04-01'
  AND COALESCE(d.fecha_fin, d.fecha_inicio, d.fecha_solicitud) < '2026-07-01';
