import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import {
  compareVersions,
  defaultCacheFile,
  registryUrl,
  readUpdateCache,
  writeUpdateCache,
  notifyUpdate,
  fetchLatest,
} from '../src/self-update.mjs'
import { tempDir, noop } from './helpers.mjs'

const DAY = 24 * 60 * 60 * 1000

test('compareVersions：数字段比较，忽略 prerelease/build', () => {
  assert.equal(compareVersions('1.0.0', '1.0.0'), 0)
  assert.equal(compareVersions('1.2', '1.2.0'), 0)
  assert.equal(compareVersions('1.0.1', '1.0.0'), 1)
  assert.equal(compareVersions('0.9.9', '1.0.0'), -1)
  assert.equal(compareVersions('1.0.0-rc.1', '1.0.0'), 0)
  assert.equal(compareVersions('2.0.0+build', '1.9.9'), 1)
})

test('defaultCacheFile：环境变量优先，其次 XDG', () => {
  assert.equal(defaultCacheFile({ PSYCHO_FRAME_UPDATE_CACHE_FILE: '/tmp/x.json' }), '/tmp/x.json')
  assert.equal(defaultCacheFile({ XDG_CACHE_HOME: '/tmp/cache' }), '/tmp/cache/psycho-frame/update-check.json')
})

test('registryUrl：去尾斜杠并可覆盖', () => {
  assert.equal(registryUrl({ PSYCHO_FRAME_REGISTRY_URL: 'https://mirror.example/' }), 'https://mirror.example')
  assert.equal(registryUrl({}), 'https://registry.npmjs.org')
})

test('缓存：写入后可读，过期或损坏返回 null', () => {
  const cacheFile = path.join(tempDir(), 'nested', 'update-check.json')
  assert.equal(writeUpdateCache(cacheFile, { checkedAt: 1000, latest: '1.2.3' }), true)
  assert.equal(readUpdateCache(cacheFile, 1000 + DAY / 2).latest, '1.2.3')
  assert.equal(readUpdateCache(cacheFile, 1000 + DAY * 2), null)
  fs.writeFileSync(cacheFile, 'not json')
  assert.equal(readUpdateCache(cacheFile, 1000), null)
  assert.equal(readUpdateCache(path.join(tempDir(), 'missing.json'), 1000), null)
})

test('notifyUpdate：关闭或非 TTY 时静默', () => {
  const cacheFile = path.join(tempDir(), 'c.json')
  writeUpdateCache(cacheFile, { checkedAt: Date.now(), latest: '9.9.9' })
  assert.deepEqual(notifyUpdate({ name: 'x', currentVersion: '1.0.0', cacheFile, disabled: true, isTTY: true }), { notified: false, stale: false })
  assert.deepEqual(notifyUpdate({ name: 'x', currentVersion: '1.0.0', cacheFile, isTTY: false }), { notified: false, stale: false })
})

test('notifyUpdate：缓存缺失时标记 stale，命中新版时提示', () => {
  const cacheFile = path.join(tempDir(), 'c.json')
  assert.deepEqual(notifyUpdate({ name: 'x', currentVersion: '1.0.0', cacheFile, isTTY: true }), { notified: false, stale: true })
  writeUpdateCache(cacheFile, { checkedAt: Date.now(), latest: '1.1.0' })
  const lines = []
  const r = notifyUpdate({ name: 'x', currentVersion: '1.0.0', cacheFile, isTTY: true, printer: m => lines.push(m) })
  assert.deepEqual(r, { notified: true, stale: false })
  assert.match(lines[0], /新版本 v1\.1\.0/)
})

test('notifyUpdate：已是最新不提示', () => {
  const cacheFile = path.join(tempDir(), 'c.json')
  writeUpdateCache(cacheFile, { checkedAt: Date.now(), latest: '1.0.0' })
  assert.deepEqual(notifyUpdate({ name: 'x', currentVersion: '1.0.0', cacheFile, isTTY: true, printer: noop }), { notified: false, stale: false })
})

test('fetchLatest：成功、非 200 与不可达都返回 null 而不抛错', async t => {
  let mode = 'ok'
  const server = http.createServer((req, res) => {
    if (mode === 'ok') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ latest: '9.9.9' }))
    } else {
      res.writeHead(500)
      res.end('boom')
    }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => server.close())
  const base = `http://127.0.0.1:${server.address().port}`

  assert.equal(await fetchLatest({ registryUrl: base, name: 'yondren-psycho-frame' }), '9.9.9')
  mode = 'fail'
  assert.equal(await fetchLatest({ registryUrl: base, name: 'yondren-psycho-frame' }), null)

  const closed = server.address().port
  await new Promise(resolve => server.close(resolve))
  assert.equal(await fetchLatest({ registryUrl: `http://127.0.0.1:${closed}`, name: 'x', timeoutMs: 200 }), null)
})
