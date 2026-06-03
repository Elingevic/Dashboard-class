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
  if (['pendiente', 'en_proceso', 'en_progreso', 'pendiente_aprobacion'].includes(key))
    return 'badge-orange'
  if (['revertido'].includes(key)) return 'badge-purple'
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

function Indicadores({ row }: { row: DespliegueDetalle }) {
  return (
    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
      <span className="inline-flex items-center gap-1">
        Evid.{' '}
        {row.tieneEvidencia ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-amber-500" />
        )}
      </span>
      <span className="inline-flex items-center gap-1">
        Aprob.{' '}
        {row.tieneAprobacion ? (
          <Shield className="h-3.5 w-3.5 text-blue-400" />
        ) : (
          '—'
        )}
      </span>
      <span>Migr. {row.migracionConcluida ? 'Sí' : 'No'}</span>
      {row.rollbacks > 0 && (
        <span className="inline-flex items-center gap-1 font-bold text-red-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          RB {row.rollbacks}
        </span>
      )}
    </div>
  )
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
    <>
      {/* Móvil: tarjetas */}
      <ul className="space-y-3 p-3 md:hidden">
        {data.map((row, index) => (
          <li key={claveDespliegue(row, index)} className="despliegue-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] text-gray-500">{row.id}</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-white">{row.proyecto}</p>
              </div>
              <span className={`badge shrink-0 ${badgeEstado(row.estado)}`}>
                {etiquetaEstado(row.estado)}
              </span>
            </div>
            <div className="despliegue-card__row">
              <span>{row.ambiente}</span>
              <span>{fmtFecha(row.fechaSolicitud)}</span>
            </div>
            <div className="despliegue-card__row">
              <span className="truncate">{row.usuario}</span>
              {row.commitHash && (
                <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px]">
                  <GitCommit className="h-3 w-3 text-blue-400" />
                  {row.commitHash.slice(0, 8)}
                </span>
              )}
            </div>
            <Indicadores row={row} />
          </li>
        ))}
      </ul>

      {/* Escritorio: tabla */}
      <div className="hidden overflow-x-auto md:block">
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
                <td
                  className="max-w-[100px] truncate font-mono text-xs text-gray-500"
                  title={row.commitHash ?? ''}
                >
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
    </>
  )
}
