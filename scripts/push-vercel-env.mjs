/**
 * Sube DATABASE_URL a Vercel (production + preview) y redeploy.
 * Requiere: sesión `npx vercel login` y proyecto enlazado (`npx vercel link`).
 *
 * 1. En Supabase → Connect → Transaction pooler → copia la URI (con contraseña).
 * 2. En .env.local: DATABASE_URL=postgresql://...
 * 3. pnpm vercel:env
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

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

function runVercel(args, { input } = {}) {
  return spawnSync('npx', ['--yes', 'vercel@latest', ...args], {
    cwd: root,
    input,
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
    encoding: 'utf8',
  })
}

const url = loadEnvLocal().DATABASE_URL?.trim()

if (!url) {
  console.error(`
❌ Falta DATABASE_URL en .env.local

En Supabase:
  Connect → Transaction pooler → URI → copia y sustituye [YOUR-PASSWORD]

En .env.local (una sola línea):
  DATABASE_URL=postgresql://postgres.xxx:TU_CONTRASEÑA@....pooler.supabase.com:6543/postgres

Luego ejecuta: pnpm vercel:env
`)
  process.exit(1)
}

if (/localhost|127\.0\.0\.1/i.test(url)) {
  console.error(`
❌ DATABASE_URL apunta a localhost. Usa la URI del Transaction pooler de Supabase (puerto 6543).
`)
  process.exit(1)
}

console.log('→ Enlazando proyecto (si hace falta)...')
runVercel(['link', '--project', 'dashboard-class', '--yes'])

const envTargets = [
  ['production'],
  ['preview'], // sin rama = todas las ramas preview
]

for (const targetParts of envTargets) {
  const target = targetParts[0]
  console.log(`→ Añadiendo DATABASE_URL en ${target}...`)
  const r = runVercel([
    'env',
    'add',
    'DATABASE_URL',
    ...targetParts,
    '--value',
    url,
    '--yes',
    '--force',
    '--sensitive',
  ])
  if (r.status !== 0) {
    console.error(`Error al configurar ${target}.`)
    process.exit(r.status ?? 1)
  }
}

console.log('→ Redeploy a producción...')
const deploy = runVercel(['deploy', '--prod', '--yes'])
process.exit(deploy.status ?? 0)
