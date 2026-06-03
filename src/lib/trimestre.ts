export interface TrimestreDef {
  id: string
  etiqueta: string
  desde: string
  hasta: string
}

/** Trimestres disponibles para el dashboard (acotar datos de prueba). */
export const TRIMESTRES: TrimestreDef[] = [
  { id: '2026-Q1', etiqueta: 'T1 2026 (Ene–Mar)', desde: '2026-01-01', hasta: '2026-04-01' },
  { id: '2026-Q2', etiqueta: 'T2 2026 (Abr–Jun)', desde: '2026-04-01', hasta: '2026-07-01' },
  { id: '2026-Q3', etiqueta: 'T3 2026 (Jul–Sep)', desde: '2026-07-01', hasta: '2026-10-01' },
  { id: '2026-Q4', etiqueta: 'T4 2026 (Oct–Dic)', desde: '2026-10-01', hasta: '2027-01-01' },
]

export const TRIMESTRE_DEFAULT = '2026-Q2'

export function resolverTrimestre(id: string | null | undefined): TrimestreDef {
  return TRIMESTRES.find((t) => t.id === id) ?? TRIMESTRES.find((t) => t.id === TRIMESTRE_DEFAULT)!
}
