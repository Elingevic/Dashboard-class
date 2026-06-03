export interface TrimestreDef {
  id: string
  etiqueta: string
  desde: string
  hasta: string
}

/** Trimestres alineados al dataset BI (Q1 2024) y extensiones futuras. */
export const TRIMESTRES: TrimestreDef[] = [
  { id: '2024-Q1', etiqueta: 'T1 2024 (Ene–Mar)', desde: '2024-01-01', hasta: '2024-04-01' },
  { id: '2024-Q2', etiqueta: 'T2 2024 (Abr–Jun)', desde: '2024-04-01', hasta: '2024-07-01' },
  { id: '2024-Q3', etiqueta: 'T3 2024 (Jul–Sep)', desde: '2024-07-01', hasta: '2024-10-01' },
  { id: '2024-Q4', etiqueta: 'T4 2024 (Oct–Dic)', desde: '2024-10-01', hasta: '2025-01-01' },
]

export const TRIMESTRE_DEFAULT = '2024-Q1'

export function resolverTrimestre(id: string | null | undefined): TrimestreDef {
  return TRIMESTRES.find((t) => t.id === id) ?? TRIMESTRES.find((t) => t.id === TRIMESTRE_DEFAULT)!
}
