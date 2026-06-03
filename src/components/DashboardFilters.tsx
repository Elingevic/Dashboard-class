'use client'

import { useState } from 'react'
import { Search, Filter, X, Calendar, ChevronDown } from 'lucide-react'
import type { FiltrosDashboard, OpcionesFiltro } from '@/lib/dashboard'
import { etiquetaEstado } from '@/lib/dashboard'

interface Props {
  filtros: FiltrosDashboard
  opciones: OpcionesFiltro | null
  trimestreEtiqueta?: string
  onChange: (filtros: FiltrosDashboard) => void
  onLimpiar: () => void
  totalResultados?: number
}

export default function DashboardFilters({
  filtros,
  opciones,
  trimestreEtiqueta,
  onChange,
  onLimpiar,
  totalResultados,
}: Props) {
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const hayFiltros =
    filtros.estado || filtros.ambiente || filtros.proyecto || filtros.busqueda

  const set = (key: keyof FiltrosDashboard, value: string) =>
    onChange({ ...filtros, [key]: value })

  const gridFiltros = (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-500">Trimestre</span>
        <select
          value={filtros.trimestre}
          onChange={(e) => set('trimestre', e.target.value)}
          className="filter-input min-h-[44px]"
        >
          {opciones?.trimestres.map((t) => (
            <option key={t.id} value={t.id}>
              {t.etiqueta}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-500">Estado</span>
        <select
          value={filtros.estado}
          onChange={(e) => set('estado', e.target.value)}
          className="filter-input min-h-[44px]"
        >
          <option value="">Todos los estados</option>
          {opciones?.estados.map((e) => (
            <option key={e} value={e}>
              {etiquetaEstado(e)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-500">Ambiente</span>
        <select
          value={filtros.ambiente}
          onChange={(e) => set('ambiente', e.target.value)}
          className="filter-input min-h-[44px]"
        >
          <option value="">Todos los ambientes</option>
          {opciones?.ambientes.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-gray-500">Proyecto</span>
        <select
          value={filtros.proyecto}
          onChange={(e) => set('proyecto', e.target.value)}
          className="filter-input min-h-[44px]"
        >
          <option value="">Todos los proyectos</option>
          {opciones?.proyectos.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 sm:col-span-2 xl:col-span-1">
        <span className="text-xs font-medium text-gray-500">Búsqueda</span>
        <div className="filter-input-search min-h-[44px]">
          <Search className="filter-input-search__icon" aria-hidden />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={filtros.busqueda}
            onChange={(e) => set('busqueda', e.target.value)}
              placeholder="Buscar por proyecto, usuario o estado"
            className="filter-input-search__field"
            aria-label="Buscar por proyecto, usuario o estado"
          />
        </div>
      </label>
    </div>
  )

  return (
    <section className="dashboard-card dashboard-card-body" aria-label="Filtros del panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 shrink-0 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Filtros analíticos</h3>
          {trimestreEtiqueta && (
            <span className="flex max-w-full items-center gap-1 truncate rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">{trimestreEtiqueta}</span>
            </span>
          )}
          {totalResultados !== undefined && (
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-gray-400">
              {totalResultados} resultado{totalResultados !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {hayFiltros && (
          <button
            type="button"
            onClick={onLimpiar}
            className="flex min-h-[44px] items-center gap-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      <button
        type="button"
        className="filters-toggle md:hidden"
        onClick={() => setFiltrosAbiertos((o) => !o)}
        aria-expanded={filtrosAbiertos}
      >
        <span>{filtrosAbiertos ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${filtrosAbiertos ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`filters-panel--mobile md:!block ${filtrosAbiertos ? 'is-open' : ''}`}
      >
        {gridFiltros}
      </div>

      <p className="mt-3 hidden text-[11px] text-gray-600 sm:block">
        Clic en gráficos de estado, ambiente o proyecto para filtrar. Datos acotados al trimestre
        seleccionado.
      </p>
    </section>
  )
}
