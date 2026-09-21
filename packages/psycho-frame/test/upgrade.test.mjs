import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
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

test('upgrade：配置对象键下探一层补缺，不覆盖用户值', () => {
  const { cwd, root } = skeleton()
  const cfg = JSON.parse(fs.readFileSync(path.join(root, '.psycho-frame.json'), 'utf8'))
  delete cfg.budgets['README.md']
  cfg.budgets['docs/custom.md'] = 42
  write(root, '.psycho-frame.json', JSON.stringify(cfg, null, 2))
  const r = run({ cwd, target: 'proj' })
  assert.equal(r.errors, false)
  const merged = JSON.parse(fs.readFileSync(path.join(root, '.psycho-frame.json'), 'utf8'))
  assert.equal(merged.budgets['README.md'], 400)
  assert.equal(merged.budgets['docs/custom.md'], 42)
})

test('upgrade：老配置的 workMode 补 merge 默认值，保留用户值', () => {
  const { cwd, root } = skeleton()
  write(root, '.psycho-frame.json', JSON.stringify({
    workMode: { plan: 'off', confirmAmbiguous: false, fleet: 'on' },
    customKey: true,
  }, null, 2))
  const r = run({ cwd, target: 'proj' })
  assert.equal(r.errors, false)
  const merged = JSON.parse(fs.readFileSync(path.join(root, '.psycho-frame.json'), 'utf8'))
  assert.equal(merged.workMode.merge, 'ask')
  assert.equal(merged.workMode.plan, 'off')
  assert.equal(merged.customKey, true)
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

test('upgrade：linked worktree 内中止，根 checkout 可升级', () => {
  const cwd = tempDir()
  const root = path.join(cwd, 'repo')
  scaffold({ cwd, target: 'repo', mode: 'init', stdout: noop, stderr: noop })
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
  git('init', '-q')
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'test')
  git('add', '-A')
  git('commit', '-q', '-m', 'init')
  const linked = path.join(cwd, 'linked')
  git('worktree', 'add', linked, '-b', 'task')

  write(root, 'AGENTS.md', '# 本地改过\n')
  const before = fs.readFileSync(path.join(linked, 'AGENTS.md'), 'utf8')
  const inLinked = run({ cwd, target: 'linked' })
  assert.equal(inLinked.errors, true)
  assert.equal(inLinked.changed, 0)
  assert.equal(fs.existsSync(path.join(linked, '.psycho-frame-upgrade')), false)
  assert.equal(fs.readFileSync(path.join(linked, 'AGENTS.md'), 'utf8'), before)

  const inRoot = run({ cwd, target: 'repo', dryRun: true })
  assert.equal(inRoot.errors, false)
  assert.ok(inRoot.changed > 0)
})

test('upgrade：全量路径预检拒绝目录、文件及失效链接，不写计划前部文件', () => {
  for (const kind of ['directory', 'file', 'dangling', 'backup', 'wrong-type', 'hardlink']) {
    const { root } = skeleton()
    const outside = tempDir()
    write(root, 'AGENTS.md', 'keep agents')
    write(outside, 'marker', 'outside unchanged')
    const rel = kind === 'directory' ? 'docs' : kind === 'backup' ? '.psycho-frame-upgrade' : 'docs/architecture.md'
    const dest = path.join(root, rel)
    fs.rmSync(dest, { force: true, recursive: true })
    if (kind === 'wrong-type') fs.mkdirSync(dest)
    else if (kind === 'hardlink') fs.linkSync(path.join(outside, 'marker'), dest)
    else fs.symlinkSync(kind === 'directory' || kind === 'backup' ? outside : path.join(outside, kind === 'dangling' ? 'missing' : 'marker'), dest)
    const r = run({ cwd: root })
    assert.equal(r.errors, true, kind)
    assert.equal(r.changed, 0, kind)
    assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), 'keep agents')
    assert.equal(fs.readFileSync(path.join(outside, 'marker'), 'utf8'), 'outside unchanged')
    assert.deepEqual(fs.readdirSync(outside), ['marker'])
  }
})

test('upgrade：非法配置在计划阶段拒绝，不产生部分写入', () => {
  const { root } = skeleton()
  write(root, 'AGENTS.md', 'keep agents')
  write(root, 'package.json', '{"scripts": []}')
  const r = run({ cwd: root })
  assert.equal(r.errors, true)
  assert.equal(r.changed, 0)
  assert.equal(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), 'keep agents')
  assert.equal(fs.existsSync(path.join(root, '.psycho-frame-upgrade')), false)
})

test('upgrade：自定义 cookbook 索引保持可发现、幂等且不产生 doctor 漂移', async () => {
  const { skeletonDrift } = await import('../src/init.mjs')
  const { root } = skeleton()
  write(root, 'docs/cookbook/custom.md', '# Custom\n')
  const local = '# 团队手册\n\n保留说明。\n\n- [自定义](custom.md) — 团队流程\n'
  write(root, 'docs/cookbook/README.md', local)
  const r = run({ cwd: root })
  assert.equal(r.errors, false)
  const index = fs.readFileSync(path.join(root, 'docs/cookbook/README.md'), 'utf8')
  assert.ok(index.startsWith(local))
  assert.match(index, /parallel-worktrees\.md/)
  assert.equal(skeletonDrift(root).drift.includes('docs/cookbook/README.md'), false)
  assert.equal(run({ cwd: root }).changed, 0)
  const manifest = JSON.parse(fs.readFileSync(path.join(r.backup, 'manifest.json'), 'utf8'))
  assert.equal(manifest.status, 'complete')
  assert.deepEqual(manifest.applied, ['docs/cookbook/README.md'])
  assert.equal(fs.readFileSync(path.join(r.backup, 'docs/cookbook/README.md'), 'utf8'), local)
})
