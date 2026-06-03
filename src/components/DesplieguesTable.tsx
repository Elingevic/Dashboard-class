'use client'

import { CheckCircle2, XCircle, AlertTriangle, GitCommit, Shield } from 'lucide-react'
import type { DespliegueDetalle } from '@/lib/dashboard'
import { claveDespliegue, etiquetaEstado } from '@/lib/dashboard'

interface Props {
  data: DespliegueDetalle[]
}

function badgeEstado(estado: string) {
  const key = estado.toLowerCase().replace(/\s+/g, '_')
  if (['exitoso', 'completado'].includes(key)) return 'badge-green'
  if (['fallido', 'error'].includes(key)) return 'badge-red'
  if (['pendiente', 'en_proceso', 'en_progreso'].includes(key)) return 'badge-orange'
  return 'badge-blue'
}

function fmtFecha(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}

export default function DesplieguesTable({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-gray-500">
        <p className="text-sm font-medium text-gray-400">No hay despliegues con estos filtros</p>
        <p className="mt-1 text-xs text-gray-600">Prueba otro trimestre o limpia los filtros.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="dashboard-table min-w-[960px]">
        <thead>
          <tr>
            <th>ID</th>
            <th>Proyecto</th>
            <th>Ambiente</th>
            <th>Usuario</th>
            <th>Estado</th>
            <th>Commit</th>
            <th>Fecha</th>
            <th>Evid.</th>
            <th>Aprob.</th>
            <th>Migr.</th>
            <th>RB</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={claveDespliegue(row, index)}>
              <td className="font-mono text-xs text-gray-400">{row.id}</td>
              <td className="font-medium">{row.proyecto}</td>
              <td>{row.ambiente}</td>
              <td className="text-sm text-gray-300">{row.usuario}</td>
              <td>
                <span className={`badge ${badgeEstado(row.estado)}`}>
                  {etiquetaEstado(row.estado)}
                </span>
              </td>
              <td className="max-w-[100px] truncate font-mono text-xs text-gray-500" title={row.commitHash ?? ''}>
                {row.commitHash ? (
                  <span className="inline-flex items-center gap-1">
                    <GitCommit className="h-3 w-3 text-blue-400" />
                    {row.commitHash.slice(0, 8)}
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="text-xs text-gray-400">{fmtFecha(row.fechaSolicitud)}</td>
              <td>
                {row.tieneEvidencia ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Con evidencia" />
                ) : (
                  <XCircle className="h-4 w-4 text-amber-500" aria-label="Sin evidencia" />
                )}
              </td>
              <td>
                {row.tieneAprobacion ? (
                  <Shield className="h-4 w-4 text-blue-400" aria-label="Aprobado" />
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </td>
              <td>
                {row.migracionConcluida ? (
                  <span className="text-xs text-cyan-400">Sí</span>
                ) : (
                  <span className="text-xs text-gray-600">No</span>
                )}
              </td>
              <td>
                {row.rollbacks > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {row.rollbacks}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">0</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
