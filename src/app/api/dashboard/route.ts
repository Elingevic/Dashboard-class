import { NextRequest, NextResponse } from 'next/server'
import type { PoolClient } from 'pg'
import {
  SQL_ESTADO_EXITO,
  SQL_ESTADO_FALLO,
  SQL_ESTADO_TERMINAL,
} from '@/lib/estados'
import { JOIN_BASE, FECHA_DESPLIEGUE, pool, buildWhere, type FiltrosQuery } from '@/lib/db'
import { TRIMESTRES, resolverTrimestre } from '@/lib/trimestre'

function parseFiltros(searchParams: URLSearchParams): FiltrosQuery {
  const trimestre = resolverTrimestre(searchParams.get('trimestre'))
  return {
    trimestreDesde: trimestre.desde,
    trimestreHasta: trimestre.hasta,
    estado: searchParams.get('estado')?.trim() || null,
    ambiente: searchParams.get('ambiente')?.trim() || null,
    proyecto: searchParams.get('proyecto')?.trim() || null,
    busqueda: searchParams.get('busqueda')?.trim() || null,
  }
}

function pct(num: number, den: number): number {
  return den > 0 ? Math.round((num / den) * 1000) / 10 : 0
}

export async function GET(request: NextRequest) {
  const filtros = parseFiltros(request.nextUrl.searchParams)
  const trimestreActivo = resolverTrimestre(request.nextUrl.searchParams.get('trimestre'))
  let client: PoolClient | undefined

  try {
    client = await pool.connect()
    const { clause: whereClause, params: whereParams } = buildWhere(filtros, 1)

    const kpisResult = await client.query<{
      total: string
      terminales: string
      exitos: string
      fallos: string
      con_rollback: string
      con_evidencia: string
      con_commit: string
      con_aprobacion: string
      migracion_ok: string
      migracion_total: string
    }>(
      `
      SELECT
        COUNT(DISTINCT f.id_despliegue) AS total,
        COUNT(DISTINCT f.id_despliegue) FILTER (WHERE ${SQL_ESTADO_TERMINAL}) AS terminales,
        COUNT(DISTINCT f.id_despliegue) FILTER (WHERE ${SQL_ESTADO_EXITO}) AS exitos,
        COUNT(DISTINCT f.id_despliegue) FILTER (WHERE ${SQL_ESTADO_FALLO}) AS fallos,
        COUNT(DISTINCT f.id_despliegue) FILTER (WHERE f.rollback_flag = 1) AS con_rollback,
        COUNT(DISTINCT f.id_despliegue) FILTER (WHERE f.evidencia_completa_flag = 1) AS con_evidencia,
        COUNT(DISTINCT f.id_despliegue) FILTER (
          WHERE f.commit_hash IS NOT NULL AND TRIM(f.commit_hash) <> ''
        ) AS con_commit,
        COUNT(DISTINCT f.id_despliegue) FILTER (
          WHERE LOWER(COALESCE(f.ultima_decision_aprobacion, '')) = 'aprobada'
        ) AS con_aprobacion,
        COUNT(DISTINCT f.id_despliegue) FILTER (
          WHERE f.migraciones_total > 0 AND f.migraciones_fallidas = 0
        ) AS migracion_ok,
        COUNT(DISTINCT f.id_despliegue) FILTER (WHERE f.migraciones_total > 0) AS migracion_total
      ${JOIN_BASE}
      ${whereClause}
    `,
      whereParams
    )

    const k = kpisResult.rows[0]
    const total = parseInt(k?.total ?? '0', 10)
    const terminales = parseInt(k?.terminales ?? '0', 10)
    const exitos = parseInt(k?.exitos ?? '0', 10)
    const fallos = parseInt(k?.fallos ?? '0', 10)
    const conRollback = parseInt(k?.con_rollback ?? '0', 10)
    const conEvidencia = parseInt(k?.con_evidencia ?? '0', 10)
    const conCommit = parseInt(k?.con_commit ?? '0', 10)
    const conAprobacion = parseInt(k?.con_aprobacion ?? '0', 10)
    const migracionOk = parseInt(k?.migracion_ok ?? '0', 10)
    const migracionTotal = parseInt(k?.migracion_total ?? '0', 10)

    const [estadosResult, porAmbienteResult, porProyectoResult, tendenciaResult, porUsuarioResult, rollbacksResult, desplieguesResult, gobernanzaResult] =
      await Promise.all([
        client.query<{ estado: string; total: string }>(
          `SELECT f.estado_despliegue AS estado, COUNT(*) AS total ${JOIN_BASE} ${whereClause} GROUP BY f.estado_despliegue ORDER BY total DESC`,
          whereParams
        ),
        client.query<{ ambiente: string; total: string }>(
          `SELECT a.ambiente, COUNT(f.id_despliegue) AS total ${JOIN_BASE} ${whereClause} GROUP BY a.ambiente ORDER BY total DESC`,
          whereParams
        ),
        client.query<{ proyecto: string; total: string }>(
          `SELECT p.proyecto, COUNT(f.id_despliegue) AS total ${JOIN_BASE} ${whereClause} GROUP BY p.proyecto ORDER BY total DESC`,
          whereParams
        ),
        client.query<{ periodo: Date; total: string; exitosos: string; fallidos: string }>(
          `
          SELECT
            DATE_TRUNC('week', ${FECHA_DESPLIEGUE}) AS periodo,
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE ${SQL_ESTADO_EXITO}) AS exitosos,
            COUNT(*) FILTER (WHERE ${SQL_ESTADO_FALLO}) AS fallidos
          ${JOIN_BASE}
          ${whereClause}
          GROUP BY 1
          ORDER BY 1
        `,
          whereParams
        ),
        client.query<{ usuario: string; total: string }>(
          `
          SELECT COALESCE(u.responsable, 'Sin asignar') AS usuario, COUNT(*) AS total
          ${JOIN_BASE}
          ${whereClause}
          GROUP BY u.responsable
          ORDER BY total DESC
          LIMIT 8
        `,
          whereParams
        ),
        client.query<{ proyecto: string; rollbacks: string; despliegues: string }>(
          `
          SELECT p.proyecto,
                 SUM(f.rollback_flag)::int AS rollbacks,
                 COUNT(DISTINCT f.id_despliegue) AS despliegues
          ${JOIN_BASE}
          ${whereClause}
          GROUP BY p.proyecto
          HAVING SUM(f.rollback_flag) > 0
          ORDER BY rollbacks DESC
          LIMIT 10
        `,
          whereParams
        ),
        client.query<{
          id: string
          estado: string
          proyecto: string
          ambiente: string
          usuario: string | null
          commit_hash: string | null
          fecha_solicitud: Date | null
          fecha_fin: Date | null
          resultado_final: string | null
          tiene_evidencia: boolean
          tiene_aprobacion: boolean
          tiene_validacion_commit: boolean
          migracion_concluida: boolean
          rollbacks: string
        }>(
          `
          SELECT
            f.id_despliegue AS id,
            f.estado_despliegue AS estado,
            p.proyecto,
            a.ambiente,
            u.responsable AS usuario,
            f.commit_hash,
            f.fecha_solicitud,
            f.fecha_fin,
            f.resultado_final,
            (f.evidencia_completa_flag = 1) AS tiene_evidencia,
            (LOWER(COALESCE(f.ultima_decision_aprobacion, '')) = 'aprobada') AS tiene_aprobacion,
            (f.commit_hash IS NOT NULL AND TRIM(f.commit_hash) <> '') AS tiene_validacion_commit,
            (f.migraciones_total > 0) AS migracion_concluida,
            f.rollback_flag::int AS rollbacks
          ${JOIN_BASE}
          ${whereClause}
          ORDER BY ${FECHA_DESPLIEGUE} DESC
        `,
          whereParams
        ),
        client.query<{
          ambientes_criticos: string
          sin_aprobacion_critico: string
        }>(
          `
          SELECT
            COUNT(DISTINCT a.id_ambiente) FILTER (WHERE a.requiere_aprobacion = true) AS ambientes_criticos,
            COUNT(DISTINCT f.id_despliegue) FILTER (
              WHERE a.requiere_aprobacion = true
                AND LOWER(COALESCE(f.ultima_decision_aprobacion, '')) <> 'aprobada'
            ) AS sin_aprobacion_critico
          ${JOIN_BASE}
          ${whereClause}
        `,
          whereParams
        ),
      ])

    const [estadosOpt, ambientesOpt, proyectosOpt] = await Promise.all([
      client.query<{ valor: string }>(
        `SELECT DISTINCT estado_despliegue AS valor FROM fact_despliegue ORDER BY valor`
      ),
      client.query<{ valor: string }>(`SELECT DISTINCT ambiente AS valor FROM dim_ambiente ORDER BY valor`),
      client.query<{ valor: string }>(`SELECT DISTINCT proyecto AS valor FROM dim_proyecto ORDER BY valor`),
    ])

    const gov = gobernanzaResult.rows[0]

    const payload = {
      trimestreActivo: {
        id: trimestreActivo.id,
        etiqueta: trimestreActivo.etiqueta,
        desde: trimestreActivo.desde,
        hasta: trimestreActivo.hasta,
      },
      kpis: {
        totalDespliegues: total,
        tasaExito: pct(exitos, terminales > 0 ? terminales : total),
        tasaFalla: pct(fallos, terminales > 0 ? terminales : total),
        tasaRollback: pct(conRollback, total),
        coberturaEvidencia: pct(conEvidencia, total),
        tasaValidacionCommit: pct(conCommit, total),
        tasaAprobacion: pct(conAprobacion, total),
        tasaMigracionExitosa: pct(migracionOk, migracionTotal > 0 ? migracionTotal : total),
        desplieguesTerminales: terminales,
      },
      estadosDespliegue: estadosResult.rows.map((r) => ({
        name: r.estado,
        value: parseInt(r.total, 10),
      })),
      volumenPorAmbiente: porAmbienteResult.rows.map((r) => ({
        ambiente: r.ambiente,
        total: parseInt(r.total, 10),
      })),
      volumenPorProyecto: porProyectoResult.rows.map((r) => ({
        proyecto: r.proyecto,
        total: parseInt(r.total, 10),
      })),
      tendenciaTemporal: tendenciaResult.rows.map((r) => ({
        periodo: r.periodo.toISOString().slice(0, 10),
        total: parseInt(r.total, 10),
        exitosos: parseInt(r.exitosos, 10),
        fallidos: parseInt(r.fallidos, 10),
      })),
      volumenPorUsuario: porUsuarioResult.rows.map((r) => ({
        usuario: r.usuario,
        total: parseInt(r.total, 10),
      })),
      topRollbacks: rollbacksResult.rows.map((r) => ({
        proyecto: r.proyecto,
        rollbacks: parseInt(r.rollbacks, 10),
        despliegues: parseInt(r.despliegues, 10),
      })),
      cobertura: {
        total,
        conEvidencia,
        porcentaje: pct(conEvidencia, total),
        sinEvidencia: total - conEvidencia,
      },
      gobernanza: {
        conCommitValidado: conCommit,
        conAprobacion: conAprobacion,
        conEvidencia,
        conMigracionConcluida: migracionTotal,
        ambientesRequierenAprobacion: parseInt(gov?.ambientes_criticos ?? '0', 10),
        desplieguesSinAprobacionEnAmbienteCritico: parseInt(
          gov?.sin_aprobacion_critico ?? '0',
          10
        ),
      },
      despliegues: desplieguesResult.rows.map((r) => ({
        id: String(r.id),
        estado: r.estado,
        proyecto: r.proyecto,
        ambiente: r.ambiente,
        usuario: r.usuario ?? 'Sin asignar',
        commitHash: r.commit_hash,
        fechaSolicitud: r.fecha_solicitud?.toISOString() ?? null,
        fechaFin: r.fecha_fin?.toISOString() ?? null,
        resultadoFinal: r.resultado_final,
        tieneEvidencia: Boolean(r.tiene_evidencia),
        tieneAprobacion: Boolean(r.tiene_aprobacion),
        tieneValidacionCommit: Boolean(r.tiene_validacion_commit),
        migracionConcluida: Boolean(r.migracion_concluida),
        rollbacks: parseInt(r.rollbacks, 10) || 0,
      })),
      filtros: {
        estados: estadosOpt.rows.map((r) => r.valor),
        ambientes: ambientesOpt.rows.map((r) => r.valor),
        proyectos: proyectosOpt.rows.map((r) => r.valor),
        trimestres: TRIMESTRES.map((t) => ({ id: t.id, etiqueta: t.etiqueta })),
      },
    }

    return NextResponse.json(payload)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    client?.release()
  }
}
