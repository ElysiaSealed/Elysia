// Counts the bytes a service receives from Postgres, which is what Supabase bills as database egress.
// It is a local TCP proxy: point a service at the proxy port instead of the real database and read the totals.
//
// Usage (run in ROOT), against the LOCAL development database only:
//   node scripts/measure-egress.mjs <listenPort> <targetPort> <seconds>
//   node scripts/measure-egress.mjs 55434 55433 120
// then start a service with DATABASE_URL pointing at localhost:55434 (for example the worker with LOOP_SECONDS=10).
// Every 30 seconds it prints JSON with the bytes sent back to the client and a per-day projection in MB.
//
// It only forwards bytes and never reads or prints query text or credentials. Do not point it at a production database.
import net from 'node:net'

const [listenPort, targetPort, seconds] = process.argv.slice(2).map(Number)
if (![listenPort, targetPort, seconds].every((n) => Number.isInteger(n) && n > 0)) {
  console.error('usage: node scripts/measure-egress.mjs <listenPort> <targetPort> <seconds>')
  process.exit(1)
}

let toClient = 0
let toServer = 0
let connections = 0

const server = net.createServer((client) => {
  connections += 1
  const upstream = net.connect(targetPort, '127.0.0.1')
  client.on('data', (d) => {
    toServer += d.length
    upstream.write(d)
  })
  upstream.on('data', (d) => {
    toClient += d.length
    client.write(d)
  })
  const end = () => {
    client.destroy()
    upstream.destroy()
  }
  client.on('error', end)
  upstream.on('error', end)
  client.on('close', end)
  upstream.on('close', end)
})
server.listen(listenPort, '127.0.0.1')

const start = Date.now()
const report = () => {
  const elapsed = (Date.now() - start) / 1000
  console.log(
    JSON.stringify({
      seconds: Math.round(elapsed),
      connections,
      dbToClientBytes: toClient,
      clientToDbBytes: toServer,
      projectedMBPerDay: Number((((toClient / elapsed) * 86_400) / 1e6).toFixed(1)),
    }),
  )
}
setInterval(report, 30_000)
setTimeout(() => {
  report()
  process.exit(0)
}, seconds * 1000)
