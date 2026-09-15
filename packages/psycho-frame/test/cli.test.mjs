import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { scaffold } from '../src/init.mjs'
import { fixtureRepo, tempDir, write, noop } from './helpers.mjs'

const cli = fileURLToPath(new URL('../src/cli.mjs', import.meta.url))
const runCli = (cwd, args) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' })

test('verify --json：通过时输出 ok=true', () => {
  const r = runCli(fixtureRepo(), ['verify', '--json'])
  assert.equal(r.status, 0)
  const out = JSON.parse(r.stdout)
  assert.equal(out.formatVersion, 1)
  assert.equal(out.ok, true)
  assert.deepEqual(out.errors, [])
  assert.ok(out.count > 0)
})

test('verify --json：失败时 ok=false 且带 errors', () => {
  const root = fixtureRepo({ config: '{ not json' })
  const r = runCli(root, ['verify', '--json'])
  assert.equal(r.status, 1)
  const out = JSON.parse(r.stdout)
  assert.equal(out.ok, false)
  assert.match(out.errors[0], /JSON 解析失败/)
})

test('verify：未知参数退出码 2', () => {
  const r = runCli(fixtureRepo(), ['verify', '--np'])
  assert.equal(r.status, 2)
  assert.match(r.stderr, /未知参数/)
})

test('mode CLI：默认回显六项，set fleet=on 与 merge=auto 落盘', () => {
  const root = fixtureRepo()
  const shown = runCli(root, ['mode'])
  assert.equal(shown.status, 0)
  assert.match(
    shown.stdout,
    /plan=on，confirmAmbiguous=true，fleet=off，merge=ask，audience=expert，engineering=off/,
  )
  const set = runCli(root, ['mode', 'set', 'fleet=on'])
  assert.equal(set.status, 0)
  assert.match(set.stdout, /fleet=on/)
  const cfg = JSON.parse(fs.readFileSync(path.join(root, '.psycho-frame.json'), 'utf8'))
  assert.equal(cfg.workMode.fleet, 'on')
  const merge = runCli(root, ['mode', 'set', 'merge=auto'])
  assert.equal(merge.status, 0)
  assert.match(merge.stdout, /merge=auto/)
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, '.psycho-frame.json'), 'utf8')).workMode.merge, 'auto')
})

test('mode CLI：一次设置两条新轴并落盘', () => {
  const root = fixtureRepo()
  const r = runCli(root, ['mode', 'set', 'audience=product', 'engineering=on'])
  assert.equal(r.status, 0)
  assert.match(r.stdout, /audience=product/)
  assert.match(r.stdout, /engineering=on/)
  const cfg = JSON.parse(fs.readFileSync(path.join(root, '.psycho-frame.json'), 'utf8'))
  assert.equal(cfg.workMode.audience, 'product')
  assert.equal(cfg.workMode.engineering, 'on')
  const reset = runCli(root, ['mode', 'reset'])
  assert.equal(reset.status, 0)
  assert.match(reset.stdout, /audience=expert，engineering=off/)
})

test('mode CLI：fleet 与 merge 非法取值退出码 1，未知键退出码 2', () => {
  const root = fixtureRepo()
  const bad = runCli(root, ['mode', 'set', 'fleet=maybe'])
  assert.equal(bad.status, 1)
  assert.match(bad.stderr, /workMode\.fleet 必须为/)
  const badMerge = runCli(root, ['mode', 'set', 'merge=always'])
  assert.equal(badMerge.status, 1)
  assert.match(badMerge.stderr, /workMode\.merge 必须为/)
  const badAudience = runCli(root, ['mode', 'set', 'audience=manager'])
  assert.equal(badAudience.status, 1)
  assert.match(badAudience.stderr, /workMode\.audience 必须为 expert \/ product \/ novice/)
  const badEngineering = runCli(root, ['mode', 'set', 'engineering=yes'])
  assert.equal(badEngineering.status, 1)
  assert.match(badEngineering.stderr, /workMode\.engineering 必须为/)
  const unknown = runCli(root, ['mode', 'set', 'merges=on'])
  assert.equal(unknown.status, 2)
  assert.match(unknown.stderr, /无法解析/)
})

test('mode help：展示 merge 取值、不含推送与两条新轴', () => {
  const r = runCli(fixtureRepo(), ['help', 'mode'])
  assert.equal(r.status, 0)
  assert.match(r.stdout, /merge=off\|ask\|auto/)
  assert.match(r.stdout, /不含推送/)
  assert.match(r.stdout, /audience=expert\|product\|novice/)
  assert.match(r.stdout, /docs\/modes\.md/)
})

test('upgrade CLI：--dry-run 默认退出码 0，--exit-code 时为 1', () => {
  const cwd = tempDir()
  scaffold({ cwd, target: 'proj', mode: 'init', stdout: noop, stderr: noop })
  write(cwd, 'proj/AGENTS.md', '# 本地改过\n')
  const plain = runCli(cwd, ['upgrade', 'proj', '--dry-run'])
  assert.equal(plain.status, 0)
  const strict = runCli(cwd, ['upgrade', 'proj', '--dry-run', '--exit-code'])
  assert.equal(strict.status, 1)
})

test('upgrade CLI：未知参数与多目录都退出码 2', () => {
  const cwd = tempDir()
  assert.equal(runCli(cwd, ['upgrade', '--bogus']).status, 2)
  assert.match(runCli(cwd, ['upgrade', '--bogus']).stderr, /未知参数/)
  assert.equal(runCli(cwd, ['upgrade', 'a', 'b']).status, 2)
})
