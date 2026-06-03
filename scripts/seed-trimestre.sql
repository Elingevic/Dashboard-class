-- Datos de referencia para el dashboard (trimestre T2 2026).
-- Ejecutar solo si necesitas ampliar el dataset de prueba.
-- El proyecto ya incluye ~15 despliegues entre 2026-04-01 y 2026-06-30.

-- Verificar cobertura del trimestre activo por defecto (2026-Q2):
SELECT COUNT(*) AS total_q2
FROM despliegue d
WHERE COALESCE(d.fecha_fin, d.fecha_inicio, d.fecha_solicitud) >= '2026-04-01'
  AND COALESCE(d.fecha_fin, d.fecha_inicio, d.fecha_solicitud) < '2026-07-01';
