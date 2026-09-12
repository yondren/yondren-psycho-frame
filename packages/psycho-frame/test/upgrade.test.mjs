import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { run } from '../src/upgrade.mjs'
import { scaffold } from '../src/init.mjs'
import { tempDir, write, noop } from './helpers.mjs'

const templateRoot = fileURLToPath(new URL('../template', import.meta.url))

function skeleton() {
  const cwd = tempDir()
  scaffold({ cwd, target: 'proj', mode: 'init', stdout: noop, stderr: noop })
  return { cwd, root: path.join(cwd, 'proj') }
}

test('upgrade：非骨架目录中止', () => {
  const cwd = tempDir()
  const r = run({ cwd, target: '.', stdout: noop })
  assert.equal(r.errors, true)
  assert.equal(r.changed, 0)
})

test('upgrade：目录不存在中止', () => {
  const r = run({ cwd: tempDir(), target: 'nope' })
  assert.equal(r.errors, true)
})

test('upgrade：框架源码仓库（root package 名）中止', () => {
  const cwd = tempDir()
  write(cwd, 'repo/package.json', JSON.stringify({ name: 'yondren-psycho-frame-workspace', private: true }))
  write(cwd, 'repo/AGENTS.md', '# AGENTS\n')
  const r = run({ cwd, target: 'repo' })
  assert.equal(r.errors, true)
  assert.equal(r.changed, 0)
  assert.equal(fs.existsSync(path.join(cwd, 'repo/.psycho-frame-upgrade')), false)
})

test('upgrade：框架源码仓库（包内模板目录）中止', () => {
  const cwd = tempDir()
  write(cwd, 'repo/AGENTS.md', '# AGENTS\n')
  write(cwd, 'repo/packages/psycho-frame/template/package.json', '{}')
  const r = run({ cwd, target: 'repo' })
  assert.equal(r.errors, true)
  assert.equal(r.changed, 0)
})

test('upgrade：模板优先 + 本地备份 + 配置增量合并', () => {
  const { cwd, root } = skeleton()
  const localAgents = '# 本地改过的 AGENTS\n\n自定义。\n'
  write(root, 'AGENTS.md', localAgents)
  fs.rmSync(path.join(root, 'docs/architecture.md'))
  write(root, 'README.md', '# 本地 README\n')
  const cfg = JSON.parse(fs.readFileSync(path.join(root, '.psycho-frame.json'), 'utf8'))
  delete cfg.budgets
  cfg.customKey = true
  write(root, '.psycho-frame.json', JSON.stringify(cfg, null, 2))
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  delete pkg.scripts['change-scope']
  pkg.scripts.custom = 'echo hi'
  write(root, 'package.json', JSON.stringify(pkg, null, 2))
  fs.appendFileSync(path.join(root, '.gitignore'), '# 本地自定义\n')

  const r = run({ cwd, target: 'proj' })
  assert.equal(r.errors, false)
  assert.ok(r.changed >= 4, `期望多处变更，实际 ${r.changed}`)

  // 模板优先：AGENTS.md 被模板版覆盖，本地版本进备份
  const expected = fs.readFileSync(path.join(templateRoot, 'AGENTS.md'), 'utf8').replaceAll('{{PROJECT_NAME}}', 'proj')
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), expected)
  const backupRoot = path.join(root, '.psycho-frame-upgrade')
  const stamps = fs.readdirSync(backupRoot)
  assert.equal(stamps.length, 1)
  assert.equal(fs.readFileSync(path.join(backupRoot, stamps[0], 'AGENTS.md'), 'utf8'), localAgents)

  // 缺文件补齐
  assert.ok(fs.existsSync(path.join(root, 'docs/architecture.md')))

  // 配置合并：补模板键，保留用户键
  const merged = JSON.parse(fs.readFileSync(path.join(root, '.psycho-frame.json'), 'utf8'))
  assert.ok(merged.budgets !== undefined)
  assert.equal(merged.customKey, true)

  // package.json 只补脚本
  const mergedPkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  assert.ok(mergedPkg.scripts['change-scope'] !== undefined)
  assert.equal(mergedPkg.scripts.custom, 'echo hi')

  // gitignore 保留本地行并补模板行
  const gi = fs.readFileSync(path.join(root, '.gitignore'), 'utf8')
  assert.ok(gi.includes('# 本地自定义'))
  assert.ok(gi.includes('node_modules'))
  assert.ok(gi.includes('.worktrees/'))

  // README 属用户内容，保留本地
  assert.equal(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), '# 本地 README\n')
})

test('upgrade：--dry-run 不落盘', () => {
  const { cwd, root } = skeleton()
  write(root, 'AGENTS.md', '# 本地改过的 AGENTS\n')
  const r = run({ cwd, target: 'proj', dryRun: true })
  assert.ok(r.changed > 0)
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), '# 本地改过的 AGENTS\n')
  assert.equal(fs.existsSync(path.join(root, '.psycho-frame-upgrade')), false)
})

test('upgrade：已是最新时零变更', () => {
  const { cwd } = skeleton()
  const r = run({ cwd, target: 'proj' })
  assert.equal(r.changed, 0)
  assert.equal(r.errors, false)
})

test('upgrade：配置损坏时跳过合并并报错，不写坏文件', () => {
  const { cwd, root } = skeleton()
  write(root, '.psycho-frame.json', '{ nope')
  const r = run({ cwd, target: 'proj' })
  assert.equal(r.errors, true)
  assert.equal(fs.readFileSync(path.join(root, '.psycho-frame.json'), 'utf8'), '{ nope')
})
