/**
 * Crea el modelo y datos de prueba en PostgreSQL local.
 * Lee variables de .env.local o usa valores por defecto.
 *
 * Uso: node scripts/setup-database.mjs
 *      pnpm db:setup
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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

const env = loadEnvLocal()

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
  const host = (fromEnv.PGHOST || fromEnv.PG_HOST || fromEnv.DB_HOST || '127.0.0.1').replace(
    /^localhost$/i,
    '127.0.0.1'
  )
  const ssl = isSupabaseHost(host) || fromEnv.PG_SSL === 'true'
  return {
    host,
    port: Number(fromEnv.PGPORT || fromEnv.PG_PORT || fromEnv.DB_PORT || 5432),
    database: fromEnv.PGDATABASE || fromEnv.PG_DATABASE || fromEnv.DB_NAME || 'postgres',
    user: fromEnv.PGUSER || fromEnv.PG_USER || fromEnv.DB_USER || 'postgres',
    ...(password !== undefined && password !== '' ? { password } : {}),
    ...(ssl ? { ssl: { rejectUnauthorized: false } } : {}),
  }
}

const config = buildPgConfig(env)

const sqlPath = path.join(__dirname, 'database-model.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')

const client = new pg.Client(config)

try {
  console.log(`Conectando a ${config.user}@${config.host}:${config.port}/${config.database}...`)
  await client.connect()
  console.log('Ejecutando scripts/database-model.sql ...')
  await client.query(sql)
  console.log('Base de datos lista. Puedes iniciar el dashboard con: pnpm dev')
} catch (err) {
  console.error('Error al configurar la base de datos:', err.message)
  process.exit(1)
} finally {
  await client.end()
}
