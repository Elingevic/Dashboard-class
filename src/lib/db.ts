import { Pool } from 'pg'
import { getPgPoolConfig } from '@/lib/pg-config'
import { normalizeForSearch, sqlNormalizeField } from '@/lib/search-normalize'

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

function sqlNormalizeEstado(): string {
  return `REPLACE(${sqlNormalizeField('f.estado_despliegue')}, ' ', '_')`
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
    const estadoNorm = normalizeForSearch(filtros.estado).replace(/\s+/g, '_')
    conditions.push(`${sqlNormalizeEstado()} = $${i++}`)
    params.push(estadoNorm)
  }
  if (filtros.ambiente) {
    conditions.push(`${sqlNormalizeField('a.ambiente')} = $${i++}`)
    params.push(normalizeForSearch(filtros.ambiente))
  }
  if (filtros.proyecto) {
    conditions.push(`${sqlNormalizeField('p.proyecto')} = $${i++}`)
    params.push(normalizeForSearch(filtros.proyecto))
  }
  if (filtros.busqueda) {
    const term = `%${normalizeForSearch(filtros.busqueda)}%`
    conditions.push(
      `(${sqlNormalizeField('p.proyecto')} LIKE $${i} OR ${sqlNormalizeEstado()} LIKE $${i} OR ${sqlNormalizeField('a.ambiente')} LIKE $${i} OR ${sqlNormalizeField('u.responsable')} LIKE $${i})`
    )
    params.push(term)
    i++
  }

  return { clause: `WHERE ${conditions.join(' AND ')}`, params }
}
