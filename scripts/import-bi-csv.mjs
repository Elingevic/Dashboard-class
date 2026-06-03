/**
 * Crea el esquema en estrella e importa BI_DESPLIEGUES_Q1_2024.csv
 * Uso: node scripts/import-bi-csv.mjs
 *      pnpm db:import
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'csv-parse/sync'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function loadEnvLocal() {
  const envPath = path.join(root, '.env.local')
  if (!fs.existsSync(envPath)) return {}
  const vars = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    vars[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
  }
  return vars
}

function isSupabaseHost(value) {
  return /supabase\.(co|com)/i.test(value)
}

function buildPgConfig(fromEnv) {
  const databaseUrl = fromEnv.DATABASE_URL?.trim()
  if (databaseUrl) {
    const ssl = isSupabaseHost(databaseUrl) || fromEnv.PG_SSL === 'true'
    return {
      connectionString: databaseUrl,
      ...(ssl ? { ssl: { rejectUnauthorized: false } } : {}),
    }
  }
  const password = fromEnv.PGPASSWORD ?? fromEnv.PG_PASSWORD
  const host = (fromEnv.PGHOST || fromEnv.PG_HOST || '127.0.0.1').replace(/^localhost$/i, '127.0.0.1')
  const ssl = isSupabaseHost(host) || fromEnv.PG_SSL === 'true'
  return {
    host,
    port: Number(fromEnv.PGPORT || fromEnv.PG_PORT || 5432),
    database: fromEnv.PGDATABASE || fromEnv.PG_DATABASE || 'postgres',
    user: fromEnv.PGUSER || fromEnv.PG_USER || 'postgres',
    ...(password !== undefined && password !== '' ? { password } : {}),
    ...(ssl ? { ssl: { rejectUnauthorized: false } } : {}),
  }
}

function normKey(k) {
  return k
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function rowMap(raw) {
  const m = {}
  for (const [k, v] of Object.entries(raw)) {
    m[normKey(k)] = typeof v === 'string' ? v.trim() : v
  }
  return m
}

function siNoBool(v) {
  const s = String(v ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
  return s === 'si' || s === 'yes' || s === 'true' || s === '1'
}

function intOrZero(v) {
  const n = parseInt(String(v ?? '0'), 10)
  return Number.isFinite(n) ? n : 0
}

function numOrNull(v) {
  if (v === '' || v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function parseTs(v) {
  if (!v) return null
  const d = new Date(String(v).replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? null : d
}

function dateKey(ts) {
  if (!ts) return null
  return ts.toISOString().slice(0, 10)
}

const env = { ...process.env, ...loadEnvLocal() }
const config = buildPgConfig(env)
const csvPath =
  process.env.BI_CSV_PATH ||
  path.join(root, 'data', 'BI_DESPLIEGUES_Q1_2024.csv')
const ddlPath = path.join(__dirname, 'star-schema.sql')

if (!fs.existsSync(csvPath)) {
  console.error(`No se encontró el CSV: ${csvPath}`)
  process.exit(1)
}

const csvText = fs.readFileSync(csvPath, 'utf8')
const records = parse(csvText, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  relax_quotes: true,
})

const client = new pg.Client(config)

try {
  console.log('Conectando a PostgreSQL...')
  await client.connect()
  console.log('Aplicando star-schema.sql...')
  await client.query(fs.readFileSync(ddlPath, 'utf8'))

  const proyectos = new Map()
  const usuarios = new Map()
  const ambientes = new Map()
  const servidores = new Map()
  const tiempos = new Map()
  const facts = []

  for (const raw of records) {
    const r = rowMap(raw)
    const idProyecto = r.id_proyecto
    const idUsuario = r.id_usuario
    const idServidor = r.id_servidor
    const idAmbiente = r.id_ambiente
    const fechaSolicitud = parseTs(r.fecha_solicitud)
    const idTiempo = dateKey(fechaSolicitud)

    if (!proyectos.has(idProyecto)) {
      proyectos.set(idProyecto, {
        id_proyecto: idProyecto,
        proyecto: r.proyecto,
        repositorio: r.repositorio,
        rama: r.rama,
        estado_proyecto: r.estado_proyecto,
      })
    }
    if (!usuarios.has(idUsuario)) {
      usuarios.set(idUsuario, {
        id_usuario: idUsuario,
        responsable: r.responsable,
        area: r.area,
        cargo: r.cargo,
        rol_asignado: r.rol_asignado,
      })
    }
    if (!ambientes.has(idAmbiente)) {
      ambientes.set(idAmbiente, {
        id_ambiente: idAmbiente,
        ambiente: r.ambiente,
        criticidad: r.criticidad,
        requiere_aprobacion: siNoBool(r.requiere_aprobacion),
      })
    }
    if (!servidores.has(idServidor)) {
      servidores.set(idServidor, {
        id_servidor: idServidor,
        servidor: r.servidor,
        tipo_servidor: r.tipo_servidor,
        ruta_espacio: r.ruta_espacio,
        administrado_por: r.administrado_por,
      })
    }
    if (idTiempo && !tiempos.has(idTiempo)) {
      tiempos.set(idTiempo, {
        id_tiempo: idTiempo,
        mes: r.mes,
        semana: intOrZero(r.semana),
        trimestre: r.trimestre,
        anio: intOrZero(r.anio || r.ano),
      })
    }

    facts.push({
      id_despliegue: r.id_despliegue,
      id_proyecto: idProyecto,
      id_usuario: idUsuario,
      id_servidor: idServidor,
      id_ambiente: idAmbiente,
      id_tiempo: idTiempo,
      fecha_solicitud: fechaSolicitud,
      fecha_inicio: parseTs(r.fecha_inicio),
      fecha_fin: parseTs(r.fecha_fin),
      commit_hash: r.commit_hash || null,
      estado_despliegue: r.estado_despliegue,
      resultado_final: r.resultado_final || null,
      observacion: r.observacion || null,
      validaciones_total: intOrZero(r.validaciones_total),
      validaciones_aprobadas: intOrZero(r.validaciones_aprobadas),
      validaciones_fallidas: intOrZero(r.validaciones_fallidas),
      aprobaciones_total: intOrZero(r.aprobaciones_total),
      migraciones_total: intOrZero(r.migraciones_total),
      migraciones_fallidas: intOrZero(r.migraciones_fallidas),
      evidencias_total: intOrZero(r.evidencias_total),
      duracion_minutos: numOrNull(r.duracion_minutos),
      tiempo_aprobacion_horas: numOrNull(r.tiempo_aprobacion_horas),
      despliegue_exitoso_flag: intOrZero(r.despliegue_exitoso_flag),
      despliegue_fallido_flag: intOrZero(r.despliegue_fallido_flag),
      rollback_flag: intOrZero(r.rollback_flag),
      evidencia_completa_flag: intOrZero(r.evidencia_completa_flag),
      control_completo_flag: intOrZero(r.control_completo_flag),
      ultima_decision_aprobacion: r.ultima_decision_aprobacion || null,
      evidencia_completa: r.evidencia_completa || null,
      rollback_realizado: r.rollback_realizado || null,
      motivo_rollback: r.motivo_rollback || null,
    })
  }

  async function insertRows(table, columns, rows) {
    if (!rows.length) return
    const cols = columns.join(', ')
    const placeholders = rows
      .map(
        (_, ri) =>
          `(${columns.map((_, ci) => `$${ri * columns.length + ci + 1}`).join(', ')})`
      )
      .join(', ')
    const values = rows.flatMap((row) => columns.map((c) => row[c]))
    await client.query(
      `INSERT INTO ${table} (${cols}) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
      values
    )
  }

  console.log(`Dimensiones: ${proyectos.size} proyectos, ${usuarios.size} usuarios...`)
  await insertRows('dim_proyecto', ['id_proyecto', 'proyecto', 'repositorio', 'rama', 'estado_proyecto'], [
    ...proyectos.values(),
  ])
  await insertRows('dim_usuario', ['id_usuario', 'responsable', 'area', 'cargo', 'rol_asignado'], [
    ...usuarios.values(),
  ])
  await insertRows(
    'dim_ambiente',
    ['id_ambiente', 'ambiente', 'criticidad', 'requiere_aprobacion'],
    [...ambientes.values()]
  )
  await insertRows(
    'dim_servidor',
    ['id_servidor', 'servidor', 'tipo_servidor', 'ruta_espacio', 'administrado_por'],
    [...servidores.values()]
  )
  await insertRows('dim_tiempo', ['id_tiempo', 'mes', 'semana', 'trimestre', 'anio'], [...tiempos.values()])

  console.log(`Insertando ${facts.length} hechos en fact_despliegue...`)
  const factCols = Object.keys(facts[0])
  const batchSize = 25
  for (let i = 0; i < facts.length; i += batchSize) {
    const batch = facts.slice(i, i + batchSize)
    const placeholders = batch
      .map(
        (_, ri) =>
          `(${factCols.map((_, ci) => `$${ri * factCols.length + ci + 1}`).join(', ')})`
      )
      .join(', ')
    const values = batch.flatMap((row) => factCols.map((c) => row[c]))
    await client.query(
      `INSERT INTO fact_despliegue (${factCols.join(', ')}) VALUES ${placeholders}`,
      values
    )
  }

  const check = await client.query(`
    SELECT 'fact_despliegue' AS tabla, COUNT(*)::int AS filas FROM fact_despliegue
    UNION ALL SELECT 'dim_proyecto', COUNT(*)::int FROM dim_proyecto
    UNION ALL SELECT 'dim_usuario', COUNT(*)::int FROM dim_usuario
    UNION ALL SELECT 'dim_ambiente', COUNT(*)::int FROM dim_ambiente
    UNION ALL SELECT 'dim_servidor', COUNT(*)::int FROM dim_servidor
    UNION ALL SELECT 'dim_tiempo', COUNT(*)::int FROM dim_tiempo
  `)
  console.table(check.rows)
  console.log('Importación BI Q1 2024 completada.')
} catch (err) {
  console.error('Error:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
