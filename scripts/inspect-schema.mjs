import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ host: '127.0.0.1', port: 5432, database: 'postgres', user: 'postgres' })
const client = await pool.connect()
try {
  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY 1`
  )
  console.log('TABLES:', tables.rows.map((r) => r.table_name).join(', '))
  for (const { table_name } of tables.rows) {
    const cols = await client.query(
      `SELECT column_name, data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
      [table_name]
    )
    console.log(`\n${table_name}:`)
    for (const c of cols.rows) console.log(`  - ${c.column_name} (${c.data_type})`)
  }
} finally {
  client.release()
  await pool.end()
}
