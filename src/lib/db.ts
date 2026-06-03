import { Pool } from 'pg'

function pgConfig() {
  const password = process.env.PGPASSWORD ?? process.env.PG_PASSWORD
  return {
    host: (process.env.PGHOST ?? process.env.PG_HOST ?? '127.0.0.1').replace(/^localhost$/i, '127.0.0.1'),
    port: Number(process.env.PGPORT ?? process.env.PG_PORT ?? 5432),
    database: process.env.PGDATABASE ?? process.env.PG_DATABASE ?? 'postgres',
    user: process.env.PGUSER ?? process.env.PG_USER ?? 'postgres',
    ...(password !== undefined && password !== '' ? { password } : {}),
  }
}

export const pool = new Pool(pgConfig())

export const JOIN_BASE = `
  FROM despliegue d
  JOIN proyecto p ON d.id_proyecto = p.id_proyecto
  JOIN servidor s ON d.id_servidor = s.id_servidor
  JOIN ambiente a ON s.id_ambiente = a.id_ambiente
  LEFT JOIN usuario u ON d.id_usuario = u.id_usuario
`

export const FECHA_DESPLIEGUE = `COALESCE(d.fecha_fin, d.fecha_inicio, d.fecha_solicitud)`

export type FiltrosQuery = {
  trimestreDesde: string
  trimestreHasta: string
  estado: string | null
  ambiente: string | null
  proyecto: string | null
  busqueda: string | null
}

export function buildWhere(
  filtros: FiltrosQuery,
  startIdx: number
): { clause: string; params: (string | number)[] } {
  const conditions: string[] = [
    `${FECHA_DESPLIEGUE} >= $${startIdx}::timestamp`,
    `${FECHA_DESPLIEGUE} < $${startIdx + 1}::timestamp`,
  ]
  const params: (string | number)[] = [filtros.trimestreDesde, filtros.trimestreHasta]
  let i = startIdx + 2

  if (filtros.estado) {
    conditions.push(`LOWER(REPLACE(d.estado, ' ', '_')) = LOWER(REPLACE($${i++}::text, ' ', '_'))`)
    params.push(filtros.estado)
  }
  if (filtros.ambiente) {
    conditions.push(`LOWER(a.nombre) = LOWER($${i++})`)
    params.push(filtros.ambiente)
  }
  if (filtros.proyecto) {
    conditions.push(`LOWER(p.nombre) = LOWER($${i++})`)
    params.push(filtros.proyecto)
  }
  if (filtros.busqueda) {
    conditions.push(
      `(LOWER(p.nombre) LIKE LOWER($${i}) OR LOWER(REPLACE(d.estado, ' ', '_')) LIKE LOWER(REPLACE($${i}::text, ' ', '_')) OR LOWER(a.nombre) LIKE LOWER($${i}) OR LOWER(COALESCE(u.nombre_completo, '')) LIKE LOWER($${i}))`
    )
    params.push(`%${filtros.busqueda}%`)
    i++
  }

  return { clause: `WHERE ${conditions.join(' AND ')}`, params }
}
