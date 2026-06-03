/** Normaliza etiquetas de estado desde la BD (p. ej. "En Progreso" → "en_progreso"). */
export function normalizarEstado(estado: string): string {
  return estado.toLowerCase().trim().replace(/\s+/g, '_')
}

export const ESTADOS_EXITO = ['exitoso', 'completado']
export const ESTADOS_FALLO = ['fallido', 'error']
export const ESTADOS_PENDIENTE = ['pendiente', 'en_progreso']
export const ESTADOS_TERMINALES = [...ESTADOS_EXITO, ...ESTADOS_FALLO, 'cancelado']

export function esExito(estado: string): boolean {
  return ESTADOS_EXITO.includes(normalizarEstado(estado))
}

export function esFallo(estado: string): boolean {
  return ESTADOS_FALLO.includes(normalizarEstado(estado))
}

export function esTerminal(estado: string): boolean {
  return ESTADOS_TERMINALES.includes(normalizarEstado(estado))
}

/** Condiciones SQL reutilizables (sobre columna d.estado). */
export const SQL_ESTADO_EXITO = `(LOWER(REPLACE(d.estado, ' ', '_')) IN ('exitoso', 'completado'))`
export const SQL_ESTADO_FALLO = `(LOWER(REPLACE(d.estado, ' ', '_')) IN ('fallido', 'error'))`
export const SQL_ESTADO_TERMINAL = `(LOWER(REPLACE(d.estado, ' ', '_')) IN ('exitoso', 'completado', 'fallido', 'error', 'cancelado'))`
