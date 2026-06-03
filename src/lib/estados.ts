/** Normaliza etiquetas de estado desde la BD (p. ej. "En Progreso" → "en_progreso"). */
export function normalizarEstado(estado: string): string {
  return estado.toLowerCase().trim().replace(/\s+/g, '_')
}

export const ESTADOS_EXITO = ['exitoso', 'completado']
export const ESTADOS_FALLO = ['fallido', 'error']
export const ESTADOS_PENDIENTE = ['pendiente', 'en_progreso', 'pendiente_aprobacion']
export const ESTADOS_TERMINALES = [
  ...ESTADOS_EXITO,
  ...ESTADOS_FALLO,
  'cancelado',
  'revertido',
]

export function esExito(estado: string): boolean {
  return ESTADOS_EXITO.includes(normalizarEstado(estado))
}

export function esFallo(estado: string): boolean {
  return ESTADOS_FALLO.includes(normalizarEstado(estado))
}

export function esTerminal(estado: string): boolean {
  return ESTADOS_TERMINALES.includes(normalizarEstado(estado))
}

const COL = `LOWER(REPLACE(f.estado_despliegue, ' ', '_'))`

/** Condiciones SQL reutilizables (tabla de hechos fact_despliegue). */
export const SQL_ESTADO_EXITO = `(${COL} IN ('exitoso', 'completado') OR f.despliegue_exitoso_flag = 1)`
export const SQL_ESTADO_FALLO = `(${COL} IN ('fallido', 'error') OR f.despliegue_fallido_flag = 1)`
export const SQL_ESTADO_TERMINAL = `(${COL} IN ('exitoso', 'completado', 'fallido', 'error', 'cancelado', 'revertido'))`
