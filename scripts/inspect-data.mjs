import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ host: '127.0.0.1', port: 5432, database: 'postgres', user: 'postgres' })
const client = await pool.connect()
try {
  const q = await client.query(`
    SELECT COUNT(*)::int AS total,
           MIN(fecha_solicitud) AS min_f,
           MAX(fecha_solicitud) AS max_f,
           COUNT(DISTINCT estado) AS estados
    FROM despliegue
  `)
  console.log('despliegue', q.rows[0])
  const est = await client.query(`SELECT estado, COUNT(*)::int c FROM despliegue GROUP BY estado ORDER BY c DESC`)
  console.log('estados', est.rows)
  const ap = await client.query(`SELECT COUNT(DISTINCT id_despliegue)::int c FROM aprobacion`)
  console.log('aprobaciones despliegues', ap.rows[0])
  const ev = await client.query(`SELECT COUNT(DISTINCT id_despliegue)::int c FROM evidencia`)
  console.log('evidencia despliegues', ev.rows[0])
  const rf = await client.query(`SELECT DISTINCT resultado_final, COUNT(*)::int c FROM despliegue GROUP BY 1`)
  console.log('resultado_final', rf.rows)
  const dec = await client.query(`SELECT decision, COUNT(*)::int c FROM aprobacion GROUP BY 1`)
  console.log('aprobacion decision', dec.rows)
} finally {
  client.release()
  await pool.end()
}
