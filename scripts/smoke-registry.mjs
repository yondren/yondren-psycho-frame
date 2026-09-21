// Local read-only registry fixture; serves only the two tarballs produced by this checkout.
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
const entries = fs.readdirSync(process.argv[2]).filter(n => n.endsWith('.tgz')).map(n => {
  const file = path.join(process.argv[2], n)
  const pkg = JSON.parse(execFileSync('tar', ['-xzOf', file, 'package/package.json'], { encoding: 'utf8' }))
  const bytes = fs.readFileSync(file)
  return { pkg, bytes, integrity: 'sha512-' + createHash('sha512').update(bytes).digest('base64') }
})
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  const item = entries.find(e => pathname === '/' + e.pkg.name || pathname === '/' + e.pkg.name + '.tgz')
  if (!item) { res.writeHead(404); res.end(); return }
  if (pathname.endsWith('.tgz')) { res.end(item.bytes); return }
  const metadata = { ...item.pkg, dist: { integrity: item.integrity, tarball: 'http://127.0.0.1:' + server.address().port + '/' + item.pkg.name + '.tgz' } }
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify({ name: item.pkg.name, 'dist-tags': { latest: item.pkg.version }, versions: { [item.pkg.version]: metadata } }))
})
server.listen(0, '127.0.0.1', () => process.send({ port: server.address().port }))
