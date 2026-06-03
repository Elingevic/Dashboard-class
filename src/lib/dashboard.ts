export type VistaDashboard =
  | 'resumen'
  | 'analiticas'
  | 'despliegues'
  | 'infraestructura'
  | 'seguridad'
  | 'gobernanza'

export interface FiltrosDashboard {
  trimestre: string
  estado: string
  ambiente: string
  proyecto: string
  busqueda: string
}

export const FILTROS_VACIOS: FiltrosDashboard = {
  trimestre: '2024-Q1',
  estado: '',
  ambiente: '',
  proyecto: '',
  busqueda: '',
}

export interface KpisAgregados {
  totalDespliegues: number
  tasaExito: number
  tasaFalla: number
  tasaRollback: number
  coberturaEvidencia: number
  tasaValidacionCommit: number
  tasaAprobacion: number
  tasaMigracionExitosa: number
  desplieguesTerminales: number
}

export interface EstadoItem {
  name: string
  value: number
}

export interface AmbienteItem {
  ambiente: string
  total: number
}

export interface ProyectoItem {
  proyecto: string
  total: number
}

export interface TendenciaItem {
  periodo: string
  total: number
  exitosos: number
  fallidos: number
}

export interface UsuarioItem {
  usuario: string
  total: number
}

export interface RollbackItem {
  proyecto: string
  rollbacks: number
  despliegues: number
}

export interface Cobertura {
  total: number
  conEvidencia: number
  sinEvidencia: number
  porcentaje: number
}

export interface GobernanzaResumen {
  conCommitValidado: number
  conAprobacion: number
  conEvidencia: number
  conMigracionConcluida: number
  ambientesRequierenAprobacion: number
  desplieguesSinAprobacionEnAmbienteCritico: number
}

export interface DespliegueDetalle {
  id: string
  estado: string
  proyecto: string
  ambiente: string
  usuario: string
  commitHash: string | null
  fechaSolicitud: string | null
  fechaFin: string | null
  resultadoFinal: string | null
  tieneEvidencia: boolean
  tieneAprobacion: boolean
  tieneValidacionCommit: boolean
  migracionConcluida: boolean
  rollbacks: number
}

export interface OpcionesFiltro {
  estados: string[]
  ambientes: string[]
  proyectos: string[]
  trimestres: { id: string; etiqueta: string }[]
}

export interface DashboardData {
  trimestreActivo: { id: string; etiqueta: string; desde: string; hasta: string }
  kpis: KpisAgregados
  estadosDespliegue: EstadoItem[]
  volumenPorAmbiente: AmbienteItem[]
  volumenPorProyecto: ProyectoItem[]
  tendenciaTemporal: TendenciaItem[]
  volumenPorUsuario: UsuarioItem[]
  topRollbacks: RollbackItem[]
  cobertura: Cobertura
  gobernanza: GobernanzaResumen
  despliegues: DespliegueDetalle[]
  filtros: OpcionesFiltro
}

export function buildDashboardUrl(filtros: FiltrosDashboard): string {
  const params = new URLSearchParams()
  if (filtros.trimestre) params.set('trimestre', filtros.trimestre)
  if (filtros.estado) params.set('estado', filtros.estado)
  if (filtros.ambiente) params.set('ambiente', filtros.ambiente)
  if (filtros.proyecto) params.set('proyecto', filtros.proyecto)
  if (filtros.busqueda) params.set('busqueda', filtros.busqueda)
  const qs = params.toString()
  return qs ? `/api/dashboard?${qs}` : '/api/dashboard'
}

export function claveDespliegue(row: DespliegueDetalle, index: number): string {
  const id = row.id?.trim() ? row.id : `fila-${index}`
  return `${id}-${row.proyecto}-${row.ambiente}-${row.estado}`
}

export function etiquetaEstado(estado: string): string {
  const map: Record<string, string> = {
    exitoso: 'Exitoso',
    completado: 'Completado',
    fallido: 'Fallido',
    error: 'Error',
    pendiente: 'Pendiente',
    en_progreso: 'En progreso',
    pendiente_aprobacion: 'Pendiente de aprobación',
    cancelado: 'Cancelado',
    revertido: 'Revertido',
  }
  const key = estado.toLowerCase().replace(/\s+/g, '_')
  return map[key] ?? estado
}
