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
  X,
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
  scrollContainerRef?: React.RefObject<HTMLElement | null>
  /** Panel lateral móvil abierto */
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({
  vistaActiva,
  onVistaChange,
  onNuevoDespliegue,
  scrollContainerRef,
  mobileOpen = false,
  onMobileClose,
}: Props) {
  const [sidebarScrolled, setSidebarScrolled] = useState(false)
  const [mainScrolled, setMainScrolled] = useState(false)

  useEffect(() => {
    const panel = document.querySelector<HTMLElement>('.sidebar-panel--desktop')
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

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  const handleNav = (vista: VistaDashboard) => {
    onVistaChange(vista)
    scrollContainerRef?.current?.scrollTo({ top: 0, behavior: 'smooth' })
    onMobileClose?.()
  }

  const panelContent = (
    <>
      <div className="sidebar-panel__head">
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Centro Gestión de despliegue
        </p>
        <button
          type="button"
          onClick={onNuevoDespliegue}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500 active:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo despliegue
        </button>
      </div>

      <div className="sidebar-panel__body">
        <nav className="flex flex-col gap-1" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => {
            const activo = vistaActiva === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
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

        <div className="sidebar-hint mt-4 hidden rounded-xl p-4 lg:block">
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
    </>
  )

  return (
    <>
      {/* Escritorio: barra fija */}
      <aside
        className={`sidebar-panel sidebar-panel--desktop hidden lg:flex lg:flex-col ${sidebarScrolled || mainScrolled ? 'is-scrolled' : ''}`}
      >
        {panelContent}
      </aside>

      {/* Móvil: drawer */}
      {mobileOpen && (
        <div className="mobile-drawer-root lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button
            type="button"
            className="mobile-drawer-overlay"
            onClick={onMobileClose}
            aria-label="Cerrar menú"
          />
          <aside className="sidebar-panel sidebar-panel--drawer flex flex-col">
            {panelContent}
          </aside>
        </div>
      )}
    </>
  )
}
