'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  LayoutGrid,
  BarChart3,
  Rocket,
  Server,
  Shield,
  Scale,
  Plus,
  Table2,
} from 'lucide-react'
import type { VistaDashboard } from '@/lib/dashboard'

interface NavItem {
  id: VistaDashboard
  label: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'resumen', label: 'Resumen', icon: <LayoutGrid className="h-5 w-5" /> },
  { id: 'analiticas', label: 'Analíticas', icon: <BarChart3 className="h-5 w-5" /> },
  { id: 'despliegues', label: 'Todos los datos', icon: <Table2 className="h-5 w-5" /> },
  { id: 'infraestructura', label: 'Infraestructura', icon: <Server className="h-5 w-5" /> },
  { id: 'seguridad', label: 'Seguridad', icon: <Shield className="h-5 w-5" /> },
  { id: 'gobernanza', label: 'Gobernanza', icon: <Scale className="h-5 w-5" /> },
]

interface Props {
  vistaActiva: VistaDashboard
  onVistaChange: (vista: VistaDashboard) => void
  onNuevoDespliegue?: () => void
  /** Ref del contenedor con scroll del panel principal */
  scrollContainerRef?: React.RefObject<HTMLElement | null>
}

export default function Sidebar({
  vistaActiva,
  onVistaChange,
  onNuevoDespliegue,
  scrollContainerRef,
}: Props) {
  const [sidebarScrolled, setSidebarScrolled] = useState(false)
  const [mainScrolled, setMainScrolled] = useState(false)

  useEffect(() => {
    const panel = document.querySelector<HTMLElement>('.sidebar-panel')
    if (!panel) return

    const onSidebarScroll = () => setSidebarScrolled(panel.scrollTop > 8)
    panel.addEventListener('scroll', onSidebarScroll, { passive: true })
    return () => panel.removeEventListener('scroll', onSidebarScroll)
  }, [])

  useEffect(() => {
    const main = scrollContainerRef?.current
    if (!main) return

    const onMainScroll = () => setMainScrolled(main.scrollTop > 8)
    onMainScroll()
    main.addEventListener('scroll', onMainScroll, { passive: true })
    return () => main.removeEventListener('scroll', onMainScroll)
  }, [scrollContainerRef])

  const handleNav = (vista: VistaDashboard) => {
    onVistaChange(vista)
    scrollContainerRef?.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <aside
      className={`sidebar-panel flex w-full shrink-0 flex-col ${sidebarScrolled || mainScrolled ? 'is-scrolled' : ''}`}
    >
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0f1012]/95 px-4 py-4 backdrop-blur-md sm:px-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Centro DevOps
        </p>
        <button
          type="button"
          onClick={onNuevoDespliegue}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500"
        >
          <Plus className="h-4 w-4" />
          Nuevo despliegue
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pb-5 sm:px-5">
        <nav className="mt-2 flex flex-col gap-1" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => {
            const activo = vistaActiva === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  activo
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
                aria-current={activo ? 'page' : undefined}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-hint mt-4 rounded-xl p-4 lg:block">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            <Rocket className="h-3.5 w-3.5" />
            Despliegues
          </div>
          <p className="text-xs leading-relaxed text-gray-500">
            El menú permanece visible al desplazarte. Usa{' '}
            <strong className="text-gray-300">Todos los datos</strong> para el registro completo.
          </p>
        </div>
      </div>
    </aside>
  )
}
