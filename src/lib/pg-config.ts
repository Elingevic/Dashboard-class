import type { PoolConfig } from 'pg'

function isSupabaseHost(value: string): boolean {
  return /supabase\.(co|com)/i.test(value)
}

function useSsl(connectionTarget: string): boolean {
  return (
    isSupabaseHost(connectionTarget) ||
    process.env.PG_SSL === 'true' ||
    process.env.PGSSLMODE === 'require'
  )
}

/** Opciones compartidas por el pool de la app y scripts de setup. */
export function getPgPoolConfig(): PoolConfig {
  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (databaseUrl) {
    const ssl = useSsl(databaseUrl)
    const serverless = Boolean(process.env.VERCEL)
    return {
      connectionString: databaseUrl,
      ...(ssl ? { ssl: { rejectUnauthorized: false } } : {}),
      max: serverless ? 1 : 10,
      idleTimeoutMillis: serverless ? 10_000 : 30_000,
    }
  }

  const host = (process.env.PGHOST ?? process.env.PG_HOST ?? '127.0.0.1').replace(
    /^localhost$/i,
    '127.0.0.1'
  )
  const password = process.env.PGPASSWORD ?? process.env.PG_PASSWORD
  const ssl = useSsl(host)

  return {
    host,
    port: Number(process.env.PGPORT ?? process.env.PG_PORT ?? 5432),
    database: process.env.PGDATABASE ?? process.env.PG_DATABASE ?? 'postgres',
    user: process.env.PGUSER ?? process.env.PG_USER ?? 'postgres',
    ...(password !== undefined && password !== '' ? { password } : {}),
    ...(ssl ? { ssl: { rejectUnauthorized: false } } : {}),
    max: process.env.VERCEL ? 1 : 10,
  }
}
