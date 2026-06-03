import { NextRequest, NextResponse } from 'next/server'
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
  const client = await pool.connect()

  try {
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
        COUNT(DISTINCT d.id_despliegue) AS total,
        COUNT(DISTINCT d.id_despliegue) FILTER (WHERE ${SQL_ESTADO_TERMINAL}) AS terminales,
        COUNT(DISTINCT d.id_despliegue) FILTER (WHERE ${SQL_ESTADO_EXITO}) AS exitos,
        COUNT(DISTINCT d.id_despliegue) FILTER (WHERE ${SQL_ESTADO_FALLO}) AS fallos,
        COUNT(DISTINCT r.id_despliegue) AS con_rollback,
        COUNT(DISTINCT e.id_despliegue) AS con_evidencia,
        COUNT(DISTINCT d.id_despliegue) FILTER (
          WHERE d.commit_hash IS NOT NULL AND TRIM(d.commit_hash) <> ''
        ) AS con_commit,
        COUNT(DISTINCT ap.id_despliegue) AS con_aprobacion,
        COUNT(DISTINCT d.id_despliegue) FILTER (
          WHERE d.fecha_fin IS NOT NULL AND ${SQL_ESTADO_EXITO}
        ) AS migracion_ok,
        COUNT(DISTINCT d.id_despliegue) FILTER (WHERE d.fecha_fin IS NOT NULL) AS migracion_total
      ${JOIN_BASE}
      LEFT JOIN rollback r ON r.id_despliegue = d.id_despliegue
      LEFT JOIN evidencia e ON e.id_despliegue = d.id_despliegue
      LEFT JOIN aprobacion ap ON ap.id_despliegue = d.id_despliegue
        AND LOWER(ap.decision) = 'aprobado'
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
          `SELECT d.estado, COUNT(*) AS total ${JOIN_BASE} ${whereClause} GROUP BY d.estado ORDER BY total DESC`,
          whereParams
        ),
        client.query<{ ambiente: string; total: string }>(
          `SELECT a.nombre AS ambiente, COUNT(d.id_despliegue) AS total ${JOIN_BASE} ${whereClause} GROUP BY a.nombre ORDER BY total DESC`,
          whereParams
        ),
        client.query<{ proyecto: string; total: string }>(
          `SELECT p.nombre AS proyecto, COUNT(d.id_despliegue) AS total ${JOIN_BASE} ${whereClause} GROUP BY p.nombre ORDER BY total DESC`,
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
          SELECT COALESCE(u.nombre_completo, 'Sin asignar') AS usuario, COUNT(*) AS total
          ${JOIN_BASE}
          ${whereClause}
          GROUP BY u.nombre_completo
          ORDER BY total DESC
          LIMIT 8
        `,
          whereParams
        ),
        client.query<{ proyecto: string; rollbacks: string; despliegues: string }>(
          `
          SELECT p.nombre AS proyecto, COUNT(r.nro_rollback) AS rollbacks,
                 COUNT(DISTINCT d.id_despliegue) AS despliegues
          ${JOIN_BASE}
          LEFT JOIN rollback r ON r.id_despliegue = d.id_despliegue
          ${whereClause}
          GROUP BY p.nombre
          HAVING COUNT(r.nro_rollback) > 0
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
            d.id_despliegue AS id,
            d.estado,
            p.nombre AS proyecto,
            a.nombre AS ambiente,
            u.nombre_completo AS usuario,
            d.commit_hash,
            d.fecha_solicitud,
            d.fecha_fin,
            d.resultado_final,
            EXISTS (SELECT 1 FROM evidencia ev WHERE ev.id_despliegue = d.id_despliegue) AS tiene_evidencia,
            EXISTS (
              SELECT 1 FROM aprobacion ap
              WHERE ap.id_despliegue = d.id_despliegue AND LOWER(ap.decision) = 'aprobado'
            ) AS tiene_aprobacion,
            (d.commit_hash IS NOT NULL AND TRIM(d.commit_hash) <> '') AS tiene_validacion_commit,
            (d.fecha_fin IS NOT NULL) AS migracion_concluida,
            (SELECT COUNT(*)::int FROM rollback rb WHERE rb.id_despliegue = d.id_despliegue) AS rollbacks
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
            COUNT(DISTINCT d.id_despliegue) FILTER (
              WHERE a.requiere_aprobacion = true
                AND NOT EXISTS (
                  SELECT 1 FROM aprobacion ap
                  WHERE ap.id_despliegue = d.id_despliegue AND LOWER(ap.decision) = 'aprobado'
                )
            ) AS sin_aprobacion_critico
          ${JOIN_BASE}
          ${whereClause}
        `,
          whereParams
        ),
      ])

    const [estadosOpt, ambientesOpt, proyectosOpt] = await Promise.all([
      client.query<{ valor: string }>(
        `SELECT DISTINCT estado AS valor FROM despliegue ORDER BY valor`
      ),
      client.query<{ valor: string }>(`SELECT DISTINCT nombre AS valor FROM ambiente ORDER BY valor`),
      client.query<{ valor: string }>(`SELECT DISTINCT nombre AS valor FROM proyecto ORDER BY valor`),
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
    client.release()
  }
}
