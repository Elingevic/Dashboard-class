'use client'

import type { ReactNode } from 'react'
import type { GobernanzaResumen, KpisAgregados } from '@/lib/dashboard'
import { GitCommit, ShieldCheck, FileCheck, Database, AlertTriangle } from 'lucide-react'

interface Props {
  gobernanza: GobernanzaResumen
  kpis: KpisAgregados
}

function Metrica({
  icon,
  titulo,
  valor,
  detalle,
  color,
}: {
  icon: ReactNode
  titulo: string
  valor: string
  detalle: string
  color: string
}) {
  return (
    <div className="dashboard-card dashboard-card-body flex gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{titulo}</p>
        <p className="text-2xl font-bold text-white">{valor}</p>
        <p className="mt-0.5 text-xs text-gray-500">{detalle}</p>
      </div>
    </div>
  )
}

export default function GobernanzaPanel({ gobernanza, kpis }: Props) {
  return (
    <div className="dashboard-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      <Metrica
        icon={<GitCommit className="h-5 w-5 text-blue-400" />}
        titulo="Validación de commit"
        valor={`${kpis.tasaValidacionCommit}%`}
        detalle={`${gobernanza.conCommitValidado} despliegues con commit registrado`}
        color="border-blue-500/20 bg-blue-500/10"
      />
      <Metrica
        icon={<ShieldCheck className="h-5 w-5 text-emerald-400" />}
        titulo="Tasa de aprobación"
        valor={`${kpis.tasaAprobacion}%`}
        detalle={`${gobernanza.conAprobacion} despliegues aprobados`}
        color="border-emerald-500/20 bg-emerald-500/10"
      />
      <Metrica
        icon={<FileCheck className="h-5 w-5 text-violet-400" />}
        titulo="Cobertura de evidencia"
        valor={`${kpis.coberturaEvidencia}%`}
        detalle={`${gobernanza.conEvidencia} con evidencia archivada`}
        color="border-violet-500/20 bg-violet-500/10"
      />
      <Metrica
        icon={<Database className="h-5 w-5 text-cyan-400" />}
        titulo="Migración concluida"
        valor={`${kpis.tasaMigracionExitosa}%`}
        detalle={`${gobernanza.conMigracionConcluida} ejecuciones con fecha de fin`}
        color="border-cyan-500/20 bg-cyan-500/10"
      />
      <Metrica
        icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
        titulo="Riesgo en ambientes críticos"
        valor={String(gobernanza.desplieguesSinAprobacionEnAmbienteCritico)}
        detalle={`Sin aprobación en ${gobernanza.ambientesRequierenAprobacion} ambientes que la exigen`}
        color="border-amber-500/20 bg-amber-500/10"
      />
      <div className="dashboard-card dashboard-card-body sm:col-span-2 xl:col-span-1">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Nota de modelo</p>
        <p className="mt-2 text-xs leading-relaxed text-gray-400">
          <strong className="text-gray-300">Validación</strong> se infiere del{' '}
          <code className="text-blue-400">commit_hash</code>.{' '}
          <strong className="text-gray-300">Migración</strong> se representa por{' '}
          <code className="text-blue-400">fecha_fin</code> y resultado exitoso. Las tablas
          VALIDACION/MIGRACION del diseño lógico se mapean así en esta BD.
        </p>
      </div>
    </div>
  )
}
