'use client'

import type { ReactNode } from 'react'
import { LayoutGrid, BarChart3, Table2, Menu } from 'lucide-react'
import type { VistaDashboard } from '@/lib/dashboard'

const TABS: { id: VistaDashboard; label: string; icon: ReactNode }[] = [
  { id: 'resumen', label: 'Resumen', icon: <LayoutGrid className="h-5 w-5" /> },
  { id: 'analiticas', label: 'Analíticas', icon: <BarChart3 className="h-5 w-5" /> },
  { id: 'despliegues', label: 'Datos', icon: <Table2 className="h-5 w-5" /> },
]

const VISTAS_EN_MENU = new Set<VistaDashboard>(['infraestructura', 'seguridad', 'gobernanza'])

interface Props {
  vistaActiva: VistaDashboard
  onVistaChange: (vista: VistaDashboard) => void
  onAbrirMenu: () => void
}

export default function MobileNav({ vistaActiva, onVistaChange, onAbrirMenu }: Props) {
  const menuActivo = VISTAS_EN_MENU.has(vistaActiva)

  return (
    <nav
      className="mobile-bottom-nav lg:hidden"
      aria-label="Navegación principal móvil"
    >
      {TABS.map((tab) => {
        const activo = vistaActiva === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onVistaChange(tab.id)}
            className={`mobile-nav-btn ${activo ? 'mobile-nav-btn--active' : ''}`}
            aria-current={activo ? 'page' : undefined}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        )
      })}
      <button
        type="button"
        onClick={onAbrirMenu}
        className={`mobile-nav-btn ${menuActivo ? 'mobile-nav-btn--active' : ''}`}
        aria-label="Más secciones"
        aria-expanded={menuActivo}
      >
        <Menu className="h-5 w-5" />
        <span>Más</span>
      </button>
    </nav>
  )
}
