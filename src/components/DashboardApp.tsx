"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  FileCheck,
  TrendingUp,
  RefreshCcw,
  Download,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import DashboardFilters from '@/components/DashboardFilters';
import DesplieguesTable from '@/components/DesplieguesTable';
import GobernanzaPanel from '@/components/GobernanzaPanel';
import {
  type DashboardData,
  type FiltrosDashboard,
  type VistaDashboard,
  type KpisAgregados,
  FILTROS_VACIOS,
  buildDashboardUrl,
} from '@/lib/dashboard';

const DeploymentPieChart = dynamic(() => import('@/components/DeploymentPieChart'), { ssr: false });
const AmbientBarChart = dynamic(() => import('@/components/AmbientBarChart'), { ssr: false });
const ProyectoBarChart = dynamic(() => import('@/components/ProyectoBarChart'), { ssr: false });
const TendenciaChart = dynamic(() => import('@/components/TendenciaChart'), { ssr: false });
const FailuresTable = dynamic(() => import('@/components/FailuresTable'), { ssr: false });
const EvidenciaGauge = dynamic(() => import('@/components/EvidenciaGauge'), { ssr: false });

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.45 } },
};

const TITULOS_VISTA: Record<VistaDashboard, { titulo: string; descripcion: string }> = {
  resumen: {
    titulo: 'Resumen general',
    descripcion: 'KPIs oficiales del trimestre: éxito, falla, rollback y trazabilidad.',
  },
  analiticas: {
    titulo: 'Analíticas de despliegue',
    descripcion: 'Distribución, tendencia temporal e interactividad para explorar datos.',
  },
  despliegues: {
    titulo: 'Todos los datos',
    descripcion: 'Registro detallado con commit, usuario, evidencia, aprobación y migración.',
  },
  infraestructura: {
    titulo: 'Infraestructura',
    descripcion: 'Volumen por ambiente y por servidor lógico del trimestre.',
  },
  seguridad: {
    titulo: 'Seguridad y evidencias',
    descripcion: 'Rollbacks, cobertura de evidencia y riesgos por proyecto.',
  },
  gobernanza: {
    titulo: 'Gobernanza y trazabilidad',
    descripcion: 'Commit validado, aprobaciones y cumplimiento en ambientes críticos.',
  },
};

type KpiConfig = {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  glow: string;
  iconWrap: string;
  badge: string;
};

function KpiCard({ config, variants }: { config: KpiConfig; variants: typeof fadeInUp }) {
  return (
    <motion.article variants={variants} className="dashboard-card dashboard-card-body relative group">
      <div
        className={`pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full blur-3xl opacity-60 ${config.glow}`}
        aria-hidden
      />
      <div className="relative flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${config.iconWrap}`}>
            {config.icon}
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${config.badge}`}>KPI</span>
        </div>
        <div>
          <p className="mb-0.5 text-sm font-medium text-gray-400">{config.label}</p>
          <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{config.value}</p>
          <p className="mt-1 text-xs text-gray-500">{config.sub}</p>
        </div>
      </div>
    </motion.article>
  );
}

function CardHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-4 shrink-0">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-0.5 text-xs text-gray-500">{description}</p>
    </header>
  );
}

function buildKpiCards(kpis: KpisAgregados): KpiConfig[] {
  return [
    {
      label: 'Tasa de éxito',
      value: `${kpis.tasaExito}%`,
      sub: `${kpis.desplieguesTerminales} despliegues terminales en el periodo`,
      icon: <CheckCircle className="h-5 w-5 text-emerald-400" />,
      glow: 'bg-emerald-500/10',
      iconWrap: 'border-emerald-500/20 bg-emerald-500/10',
      badge: 'bg-emerald-500/10 text-emerald-400',
    },
    {
      label: 'Tasa de falla',
      value: `${kpis.tasaFalla}%`,
      sub: 'Sobre despliegues en estado terminal',
      icon: <AlertCircle className="h-5 w-5 text-red-400" />,
      glow: 'bg-red-500/10',
      iconWrap: 'border-red-500/20 bg-red-500/10',
      badge: 'bg-red-500/10 text-red-400',
    },
    {
      label: 'Tasa de rollback',
      value: `${kpis.tasaRollback}%`,
      sub: 'Despliegues con al menos un rollback',
      icon: <RotateCcw className="h-5 w-5 text-amber-400" />,
      glow: 'bg-amber-500/10',
      iconWrap: 'border-amber-500/20 bg-amber-500/10',
      badge: 'bg-amber-500/10 text-amber-400',
    },
    {
      label: 'Cobertura de evidencia',
      value: `${kpis.coberturaEvidencia}%`,
      sub: 'Índice de trazabilidad documental',
      icon: <FileCheck className="h-5 w-5 text-blue-400" />,
      glow: 'bg-blue-500/10',
      iconWrap: 'border-blue-500/20 bg-blue-500/10',
      badge: 'bg-blue-500/10 text-blue-400',
    },
    {
      label: 'Validación commit',
      value: `${kpis.tasaValidacionCommit}%`,
      sub: 'Despliegues con commit_hash registrado',
      icon: <TrendingUp className="h-5 w-5 text-violet-400" />,
      glow: 'bg-violet-500/10',
      iconWrap: 'border-violet-500/20 bg-violet-500/10',
      badge: 'bg-violet-500/10 text-violet-400',
    },
    {
      label: 'Tasa de aprobación',
      value: `${kpis.tasaAprobacion}%`,
      sub: 'Con registro en tabla aprobacion',
      icon: <CheckCircle className="h-5 w-5 text-cyan-400" />,
      glow: 'bg-cyan-500/10',
      iconWrap: 'border-cyan-500/20 bg-cyan-500/10',
      badge: 'bg-cyan-500/10 text-cyan-400',
    },
  ];
}

function escaparCeldaCsv(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

function exportarCsv(despliegues: DashboardData['despliegues']) {
  const headers = [
    'id', 'proyecto', 'ambiente', 'usuario', 'estado', 'commit', 'fecha',
    'evidencia', 'aprobacion', 'migracion', 'rollbacks',
  ];
  const rows = despliegues.map((d) => [
    d.id,
    d.proyecto,
    d.ambiente,
    d.usuario,
    d.estado,
    d.commitHash ?? '',
    d.fechaSolicitud ?? '',
    d.tieneEvidencia ? 'si' : 'no',
    d.tieneAprobacion ? 'si' : 'no',
    d.migracionConcluida ? 'si' : 'no',
    String(d.rollbacks),
  ]);
  const lineas = [
    headers.join(','),
    ...rows.map((r) => r.map((c) => escaparCeldaCsv(c)).join(',')),
  ].join('\r\n');
  // BOM UTF-8: Excel en Windows reconoce tildes (Gestión, Víctor, Trámites)
  const csv = `\uFEFF${lineas}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'despliegues-trimestre.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardApp() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<VistaDashboard>('analiticas');
  const [filtros, setFiltros] = useState<FiltrosDashboard>(FILTROS_VACIOS);
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const mainScrollRef = useRef<HTMLDivElement>(null);

  const cambiarVista = (v: VistaDashboard) => {
    setVista(v);
    setMenuMovilAbierto(false);
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounced(filtros.busqueda), 350);
    return () => clearTimeout(t);
  }, [filtros.busqueda]);

  const filtrosActivos = useMemo(
    () => ({ ...filtros, busqueda: busquedaDebounced }),
    [filtros.trimestre, filtros.estado, filtros.ambiente, filtros.proyecto, busquedaDebounced]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildDashboardUrl(filtrosActivos), { cache: 'no-store' });
      const raw = await res.text();
      let json: { error?: string } | DashboardData = {};
      try {
        json = raw ? (JSON.parse(raw) as typeof json) : {};
      } catch {
        setError(
          res.ok
            ? 'La API devolvió una respuesta inválida'
            : `Error del servidor (${res.status}). Revisa DATABASE_URL en Vercel y que el SQL esté aplicado en Supabase.`
        );
        setData(null);
        return;
      }
      if (!res.ok || ('error' in json && json.error)) {
        setError(('error' in json && json.error) || 'Error al cargar el dashboard');
        setData(null);
      } else {
        setData(json as DashboardData);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de conexión');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filtrosActivos]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const aplicarFiltro = (patch: Partial<FiltrosDashboard>) => {
    setFiltros((f) => ({ ...f, ...patch }));
  };

  const limpiarFiltrosSecundarios = () => {
    setFiltros((f) => ({
      ...FILTROS_VACIOS,
      trimestre: f.trimestre,
    }));
  };

  const meta = TITULOS_VISTA[vista];
  const kpis = data?.kpis;
  const kpiCards = kpis ? buildKpiCards(kpis) : [];
  const totalRegistros = data?.despliegues.length ?? 0;
  const muestraFiltros = ['resumen', 'analiticas', 'despliegues', 'infraestructura', 'seguridad', 'gobernanza'].includes(vista);

  const kpiSection = (
    <section
      aria-label="KPIs de despliegue"
      className="dashboard-grid grid-cols-1 min-[400px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
    >
      {(loading ? Array.from({ length: 6 }) : kpiCards).map((kpi, i) =>
        loading ? (
          <div key={i} className="dashboard-card dashboard-card-body h-36 animate-pulse bg-white/5" />
        ) : (
          <KpiCard key={(kpi as KpiConfig).label} config={kpi as KpiConfig} variants={fadeInUp} />
        )
      )}
    </section>
  );

  const chartsSection = data && (
    <>
      <section className="dashboard-grid grid-cols-1 lg:grid-cols-12 lg:items-stretch">
        <motion.div variants={fadeInUp} className="dashboard-card dashboard-card-body flex min-h-[280px] flex-col sm:min-h-[320px] lg:col-span-4 lg:min-h-[360px]">
          <CardHeader title="Distribución por estado" description="Clic en un segmento para filtrar" />
          <div className="chart-area relative flex items-center justify-center">
            {loading ? (
              <div className="h-40 w-40 animate-spin rounded-full border-4 border-white/5 border-t-blue-500" />
            ) : (
              <DeploymentPieChart
                data={data.estadosDespliegue}
                total={data.kpis.totalDespliegues}
                onSliceClick={(estado) => aplicarFiltro({ estado })}
              />
            )}
          </div>
        </motion.div>
        <motion.div variants={fadeInUp} className="dashboard-card dashboard-card-body flex min-h-[280px] flex-col sm:min-h-[320px] lg:col-span-8 lg:min-h-[360px]">
          <CardHeader title="Volumen por ambiente" description="Clic en una barra para filtrar" />
          <div className="chart-area relative">
            <AmbientBarChart
              data={data.volumenPorAmbiente}
              onBarClick={(ambiente) => aplicarFiltro({ ambiente })}
            />
          </div>
        </motion.div>
      </section>

      <section className="dashboard-grid grid-cols-1 lg:grid-cols-2">
        <motion.div variants={fadeInUp} className="dashboard-card dashboard-card-body flex min-h-[260px] flex-col sm:min-h-[300px]">
          <CardHeader title="Volumen por proyecto" description="Clic en una barra para filtrar" />
          <ProyectoBarChart
            data={data.volumenPorProyecto}
            onBarClick={(proyecto) => aplicarFiltro({ proyecto })}
          />
        </motion.div>
        <motion.div variants={fadeInUp} className="dashboard-card dashboard-card-body flex min-h-[260px] flex-col sm:min-h-[300px]">
          <CardHeader title="Tendencia del trimestre" description="Despliegues por semana" />
          <TendenciaChart data={data.tendenciaTemporal} />
        </motion.div>
      </section>
    </>
  );

  const bottomSection = data && (
    <section className="dashboard-grid grid-cols-1 lg:grid-cols-12 lg:items-stretch">
      <motion.div variants={fadeInUp} className="dashboard-card flex flex-col lg:col-span-7">
        <div className="dashboard-card-body border-b border-white/5">
          <CardHeader title="Rollbacks y fallos críticos" description="Proyectos con mayor reversión" />
        </div>
        <FailuresTable data={data.topRollbacks} />
      </motion.div>
      <motion.div variants={fadeInUp} className="dashboard-card dashboard-card-body flex min-h-[260px] flex-col sm:min-h-[300px] lg:col-span-5">
        <CardHeader title="Cobertura de evidencias" description="Trazabilidad documental" />
        <div className="flex flex-1 flex-col items-center justify-center py-2">
          <EvidenciaGauge
            porcentaje={data.cobertura.porcentaje}
            conEvidencia={data.cobertura.conEvidencia}
            sinEvidencia={data.cobertura.sinEvidencia}
          />
        </div>
      </motion.div>
    </section>
  );

  const datosSection = data && (
    <motion.div variants={fadeInUp} className="dashboard-card overflow-hidden">
      <div className="dashboard-card-body flex flex-wrap items-center justify-between gap-3 border-b border-white/5">
        <CardHeader
          title="Registro completo"
          description={`${totalRegistros} despliegues · ${data.trimestreActivo.etiqueta}`}
        />
        <button
          type="button"
          onClick={() => exportarCsv(data.despliegues)}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/5"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>
      {loading ? (
        <div className="space-y-3 p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      ) : (
        <DesplieguesTable data={data.despliegues} />
      )}
    </motion.div>
  );

  const renderVista = () => {
    if (!data && !loading) return null;
    switch (vista) {
      case 'resumen':
        return kpiSection;
      case 'analiticas':
        return (
          <>
            {kpiSection}
            {chartsSection}
            {bottomSection}
          </>
        );
      case 'despliegues':
        return datosSection;
      case 'infraestructura':
        return data ? (
          <>
            <motion.div variants={fadeInUp} className="dashboard-card dashboard-card-body flex min-h-[280px] flex-col sm:min-h-[320px]">
              <CardHeader title="Volumen por ambiente" description="Infraestructura destino de los despliegues" />
              <AmbientBarChart
                data={data.volumenPorAmbiente}
                onBarClick={(ambiente) => aplicarFiltro({ ambiente })}
              />
            </motion.div>
            <motion.div variants={fadeInUp} className="dashboard-card dashboard-card-body">
              <CardHeader title="Despliegues por ambiente (detalle)" description="Registro filtrado del trimestre" />
              <DesplieguesTable data={data.despliegues} />
            </motion.div>
          </>
        ) : null;
      case 'seguridad':
        return bottomSection;
      case 'gobernanza':
        return data ? <GobernanzaPanel gobernanza={data.gobernanza} kpis={data.kpis} /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-shell bg-[#09090b] font-sans text-gray-100 selection:bg-blue-500/30">
      <div className="app-layout">
        <div className="app-sidebar">
          <Sidebar
            vistaActiva={vista}
            onVistaChange={cambiarVista}
            scrollContainerRef={mainScrollRef}
            mobileOpen={menuMovilAbierto}
            onMobileClose={() => setMenuMovilAbierto(false)}
          />
        </div>

        <div className="app-main">
          <header className="app-header z-30 shrink-0 border-b border-white/5 bg-[#09090b]/95 backdrop-blur-xl">
            <div className="dashboard-container flex min-h-14 items-center justify-between gap-2 py-2 sm:h-16 sm:py-0">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setMenuMovilAbierto(true)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-gray-300 lg:hidden"
                  aria-label="Abrir menú"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-xs font-bold uppercase tracking-widest text-gray-200 sm:text-sm">
                    Centro <span className="text-blue-500">DevOps</span>
                  </h1>
                  {data?.trimestreActivo && (
                    <p className="truncate text-[10px] text-gray-500">{data.trimestreActivo.etiqueta}</p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-sm font-medium text-gray-400 sm:gap-3">
                <span className="hidden items-center gap-2 md:flex">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  Sistema en vivo
                </span>
                <button
                  type="button"
                  onClick={fetchData}
                  className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/5 active:bg-white/10"
                  aria-label="Actualizar datos"
                >
                  <RefreshCcw className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </header>

          <div ref={mainScrollRef} className="app-main-scroll">
            <main className="dashboard-container py-6 sm:py-8">
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6 sm:mb-8"
              >
                <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl">{meta.titulo}</h2>
                <p className="mt-1 max-w-3xl text-sm text-gray-400">{meta.descripcion}</p>
              </motion.div>

              {error && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="dashboard-section"
              >
                {muestraFiltros && (
                  <motion.div variants={fadeInUp}>
                    <DashboardFilters
                      filtros={filtros}
                      opciones={data?.filtros ?? null}
                      trimestreEtiqueta={data?.trimestreActivo.etiqueta}
                      onChange={setFiltros}
                      onLimpiar={limpiarFiltrosSecundarios}
                      totalResultados={
                        vista === 'despliegues' ? totalRegistros : data?.kpis.totalDespliegues
                      }
                    />
                  </motion.div>
                )}

                {renderVista()}
              </motion.div>
            </main>
          </div>

          <MobileNav
            vistaActiva={vista}
            onVistaChange={cambiarVista}
            onAbrirMenu={() => setMenuMovilAbierto(true)}
          />
        </div>
      </div>
    </div>
  );
}
