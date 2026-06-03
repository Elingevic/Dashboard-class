'use client'

import { AlertTriangle, AlertCircle } from 'lucide-react'

interface RollbackEntry {
  proyecto: string
  rollbacks: number
  despliegues: number
}

interface Props {
  data: RollbackEntry[]
}

export default function FailuresTable({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 text-gray-500">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
          <AlertCircle className="h-6 w-6 text-emerald-500/50" />
        </div>
        <p className="text-sm font-medium text-emerald-400">Sin fallos críticos</p>
        <p className="mt-1 text-xs text-gray-500">Los sistemas operan de forma óptima.</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-white/5">
      {data.map((row, index) => {
        const successRate =
          row.despliegues > 0
            ? Math.round(((row.despliegues - row.rollbacks) / row.despliegues) * 100)
            : 0

        const isCritical = successRate < 70
        const statusText = isCritical ? 'Riesgo crítico' : 'Advertencia'
        const bgClass = isCritical ? 'bg-red-500/10' : 'bg-amber-500/10'
        const borderClass = isCritical ? 'border-red-500/20' : 'border-amber-500/20'
        const textClass = isCritical ? 'text-red-400' : 'text-amber-400'
        const barWidth = Math.max(10, Math.min(100, successRate))

        return (
          <li
            key={`${row.proyecto}-${index}`}
            className="px-4 py-5 transition-colors hover:bg-white/[0.02] sm:px-6"
          >
            <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6 lg:grid-cols-[minmax(0,1.4fr)_auto_auto_minmax(120px,0.8fr)]">
              {/* Project */}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-gray-200">{row.proyecto}</p>
                <p className="mt-0.5 text-xs font-medium text-gray-500">
                  {row.despliegues} despliegues totales
                </p>
              </div>

              {/* Rollbacks + badge */}
              <div className="flex flex-wrap items-center gap-4 sm:contents">
                <div className="flex flex-col sm:items-end">
                  <span className="text-sm font-bold text-gray-300">{row.rollbacks}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Rollbacks
                  </span>
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${bgClass} ${borderClass} ${textClass}`}
                >
                  {isCritical ? (
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3 w-3 shrink-0" />
                  )}
                  {statusText}
                </span>
              </div>

              {/* Success rate */}
              <div className="flex flex-col gap-1.5 sm:items-end">
                <span
                  className={`text-sm font-bold ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}
                >
                  {successRate}%
                </span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10 sm:max-w-[140px]">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
