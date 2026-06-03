import { Pool } from 'pg'
import { getPgPoolConfig } from '@/lib/pg-config'

export const pool = new Pool(getPgPoolConfig())

/** Esquema en estrella: hecho central + dimensiones. */
export const JOIN_BASE = `
  FROM fact_despliegue f
  JOIN dim_proyecto p ON f.id_proyecto = p.id_proyecto
  JOIN dim_usuario u ON f.id_usuario = u.id_usuario
  JOIN dim_servidor s ON f.id_servidor = s.id_servidor
  JOIN dim_ambiente a ON f.id_ambiente = a.id_ambiente
  LEFT JOIN dim_tiempo t ON f.id_tiempo = t.id_tiempo
`

export const FECHA_DESPLIEGUE = `COALESCE(f.fecha_fin, f.fecha_inicio, f.fecha_solicitud)`

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
    conditions.push(
      `LOWER(REPLACE(f.estado_despliegue, ' ', '_')) = LOWER(REPLACE($${i++}::text, ' ', '_'))`
    )
    params.push(filtros.estado)
  }
  if (filtros.ambiente) {
    conditions.push(`LOWER(a.ambiente) = LOWER($${i++})`)
    params.push(filtros.ambiente)
  }
  if (filtros.proyecto) {
    conditions.push(`LOWER(p.proyecto) = LOWER($${i++})`)
    params.push(filtros.proyecto)
  }
  if (filtros.busqueda) {
    conditions.push(
      `(LOWER(p.proyecto) LIKE LOWER($${i}) OR LOWER(REPLACE(f.estado_despliegue, ' ', '_')) LIKE LOWER(REPLACE($${i}::text, ' ', '_')) OR LOWER(a.ambiente) LIKE LOWER($${i}) OR LOWER(COALESCE(u.responsable, '')) LIKE LOWER($${i}))`
    )
    params.push(`%${filtros.busqueda}%`)
    i++
  }

  return { clause: `WHERE ${conditions.join(' AND ')}`, params }
}
