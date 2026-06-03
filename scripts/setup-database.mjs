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

/** En Windows, "localhost" suele usar IPv6 (::1) con SCRAM; 127.0.0.1 usa trust en pg_hba local. */
const password = env.PGPASSWORD ?? env.PG_PASSWORD
const config = {
  host: (env.PGHOST || env.PG_HOST || env.DB_HOST || '127.0.0.1').replace(/^localhost$/i, '127.0.0.1'),
  port: Number(env.PGPORT || env.PG_PORT || env.DB_PORT || 5432),
  database: env.PGDATABASE || env.PG_DATABASE || env.DB_NAME || 'postgres',
  user: env.PGUSER || env.PG_USER || env.DB_USER || 'postgres',
  ...(password !== undefined && password !== '' ? { password } : {}),
}

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
