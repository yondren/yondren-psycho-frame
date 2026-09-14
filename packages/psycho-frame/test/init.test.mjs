import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { scaffold, doctor, sanitizeName, walkFiles } from '../src/init.mjs'
import { tempDir, write, noop } from './helpers.mjs'

/** 在 root 建一个含 main 与一个领先分支的 git 仓库，用于 doctor 的分支可见性。 */
function gitRepoWithAheadBranch() {
  const root = tempDir()
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
  git('init', '-q')
  git('config', 'user.email', 'test@example.com')
  git('config', 'user.name', 'test')
  scaffold({ cwd: root, target: '.', mode: 'adopt', stdout: noop, stderr: noop })
  git('add', '-A')
  git('commit', '-q', '-m', 'init')
  git('branch', '-m', 'main')
  git('checkout', '-q', '-b', 'task-branch')
  write(root, 'work.txt', 'x')
  git('add', 'work.txt')
  git('commit', '-q', '-m', 'work [task-branch]')
  return root
}

test('sanitizeName：规整为 npm 名', () => {
  assert.equal(sanitizeName('My Project!'), 'my-project')
  assert.equal(sanitizeName('中文项目'), 'my-project')
  assert.equal(sanitizeName(''), 'my-project')
  assert.equal(sanitizeName('a.b_c-d'), 'a.b_c-d')
})

test('walkFiles：返回相对 POSIX 路径', () => {
  const root = tempDir()
  write(root, 'a/b.md', 'x')
  write(root, 'c.md', 'x')
  assert.deepEqual(walkFiles(root).sort(), ['a/b.md', 'c.md'])
})

test('init：空目录生成骨架，gitignore 改名为 .gitignore，占位符替换', () => {
  const cwd = tempDir()
  const r = scaffold({ cwd, target: 'proj', mode: 'init', stdout: noop, stderr: noop })
  assert.equal(r.exitCode, 0)
  assert.ok(r.written.length > 0)
  assert.ok(fs.existsSync(path.join(cwd, 'proj/AGENTS.md')))
  assert.ok(fs.existsSync(path.join(cwd, 'proj/.gitignore')))
  assert.ok(fs.existsSync(path.join(cwd, 'proj/.psycho-frame.json')))
  const cfg = JSON.parse(fs.readFileSync(path.join(cwd, 'proj/.psycho-frame.json'), 'utf8'))
  assert.equal(cfg.workMode.fleet, 'off')
  assert.equal(cfg.workMode.merge, 'ask')
  const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'proj/package.json'), 'utf8'))
  assert.equal(pkg.name, 'proj')
  assert.equal(pkg.private, true)
  assert.ok(String(pkg.scripts['verify:docs']).includes('psycho-frame'))
  assert.ok(fs.readFileSync(path.join(cwd, 'proj/README.md'), 'utf8').includes('proj'))
})

test('init：目标目录非空时拒绝且不写文件', () => {
  const cwd = tempDir()
  const target = path.join(cwd, 'proj')
  write(target, 'existing.txt', 'x')
  const errs = []
  const r = scaffold({ cwd, target: 'proj', mode: 'init', stdout: noop, stderr: m => errs.push(m) })
  assert.equal(r.exitCode, 1)
  assert.match(errs.join('\n'), /目标目录非空/)
  assert.equal(fs.existsSync(path.join(target, 'AGENTS.md')), false)
})

test('adopt：只增不改，既有文件跳过', () => {
  const cwd = tempDir()
  write(cwd, 'proj/AGENTS.md', '# 本地既有指令\n')
  const r = scaffold({ cwd, target: 'proj', mode: 'adopt', stdout: noop, stderr: noop })
  assert.equal(r.exitCode, 0)
  assert.ok(r.skipped.includes('AGENTS.md'))
  assert.equal(fs.readFileSync(path.join(cwd, 'proj/AGENTS.md'), 'utf8'), '# 本地既有指令\n')
  assert.ok(fs.existsSync(path.join(cwd, 'proj/docs/AGENTS.md')))
})

test('doctor：骨架齐全时通过', () => {
  const cwd = tempDir()
  scaffold({ cwd, target: 'proj', mode: 'init', stdout: noop, stderr: noop })
  const r = doctor({ cwd, target: 'proj', stdout: noop, stderr: noop })
  assert.equal(r.exitCode, 0)
  assert.deepEqual(r.issues, [])
})

test('doctor：缺必需文件时报 issue 并返回 1', () => {
  const cwd = tempDir()
  fs.mkdirSync(path.join(cwd, 'empty'), { recursive: true })
  const r = doctor({ cwd, target: 'empty', stdout: noop, stderr: noop })
  assert.equal(r.exitCode, 1)
  assert.ok(r.issues.some(i => i.includes('缺少必需文件')))
})

test('doctor：无 package.json 只记 note，不失败', () => {
  const cwd = tempDir()
  scaffold({ cwd, target: 'proj', mode: 'init', stdout: noop, stderr: noop })
  fs.rmSync(path.join(cwd, 'proj/package.json'))
  const r = doctor({ cwd, target: 'proj', stdout: noop, stderr: noop })
  assert.equal(r.exitCode, 0)
  assert.ok(r.notes.some(n => n.includes('无 package.json')))
})

test('doctor：缺少脚本只记 note，不失败', () => {
  const cwd = tempDir()
  scaffold({ cwd, target: 'proj', mode: 'init', stdout: noop, stderr: noop })
  write(cwd, 'proj/package.json', JSON.stringify({ name: 'proj', private: true }))
  const r = doctor({ cwd, target: 'proj', stdout: noop, stderr: noop })
  assert.equal(r.exitCode, 0)
  assert.ok(r.notes.some(n => n.includes('verify:docs')))
  assert.ok(r.notes.some(n => n.includes('change-scope')))
})

test('doctor：配置 JSON 损坏时失败', () => {
  const cwd = tempDir()
  scaffold({ cwd, target: 'proj', mode: 'init', stdout: noop, stderr: noop })
  write(cwd, 'proj/.psycho-frame.json', '{ nope')
  const r = doctor({ cwd, target: 'proj', stdout: noop, stderr: noop })
  assert.equal(r.exitCode, 1)
  assert.ok(r.issues.some(i => i.includes('JSON 解析失败')))
})

test('模板门禁入口：只用 pnpm，不再宣称 npm/yarn 亦可', () => {
  const cwd = tempDir()
  const out = []
  scaffold({ cwd, target: 'proj', mode: 'init', stdout: m => out.push(String(m)), stderr: noop })
  const dev = fs.readFileSync(path.join(cwd, 'proj/docs/development.md'), 'utf8')
  assert.ok(!dev.includes('npm/yarn 亦可'), '模板环境段不得再宣称 npm/yarn 亦可')
  assert.ok(dev.includes('pnpm verify:docs'))
  assert.ok(dev.includes('门禁接入'))
  assert.match(out.join('\n'), /pnpm verify:docs/)
  assert.doesNotMatch(out.join('\n'), /pnpm install && pnpm verify:docs/)
})

test('模板：舰队模式文档与预算随模板落地', () => {
  const cwd = tempDir()
  scaffold({ cwd, target: 'proj', mode: 'init', stdout: noop, stderr: noop })
  const dev = fs.readFileSync(path.join(cwd, 'proj/docs/development.md'), 'utf8')
  assert.ok(dev.includes('fleet=on') && dev.includes('cookbook/fleet-mode.md'))
  const index = fs.readFileSync(path.join(cwd, 'proj/docs/cookbook/README.md'), 'utf8')
  assert.ok(index.includes('fleet-mode.md'))
  assert.ok(fs.existsSync(path.join(cwd, 'proj/docs/cookbook/fleet-mode.md')))
})

test('模板：合流开关文档与预算随模板落地', () => {
  const cwd = tempDir()
  scaffold({ cwd, target: 'proj', mode: 'init', stdout: noop, stderr: noop })
  const dev = fs.readFileSync(path.join(cwd, 'proj/docs/development.md'), 'utf8')
  assert.ok(dev.includes('merge=off|ask|auto') && dev.includes('cookbook/merge.md'))
  const tasks = fs.readFileSync(path.join(cwd, 'proj/tasks/README.md'), 'utf8')
  assert.ok(tasks.includes('合流'))
  const cfg = JSON.parse(fs.readFileSync(path.join(cwd, 'proj/.psycho-frame.json'), 'utf8'))
  assert.equal(cfg.budgets['docs/cookbook/merge.md'], 200)
  const index = fs.readFileSync(path.join(cwd, 'proj/docs/cookbook/README.md'), 'utf8')
  assert.ok(index.includes('merge.md'))
  assert.ok(fs.existsSync(path.join(cwd, 'proj/docs/cookbook/merge.md')))
})

test('doctor：列出领先集成分支的本地分支', () => {
  const root = gitRepoWithAheadBranch()
  const r = doctor({ cwd: root, target: '.', stdout: noop, stderr: noop })
  assert.equal(r.exitCode, 0)
  const note = r.notes.find(n => n.includes('领先 main'))
  assert.ok(note !== undefined, '未提示领先 main 的分支')
  assert.match(note, /task-branch（领先 1 个提交）/)
})

test('doctor：无领先分支时静默（git 仓库仍通过）', () => {
  const root = gitRepoWithAheadBranch()
  execFileSync('git', ['-C', root, 'checkout', '-q', 'main'], { stdio: ['ignore', 'pipe', 'ignore'] })
  execFileSync('git', ['-C', root, 'branch', '-D', 'task-branch'], { stdio: ['ignore', 'pipe', 'ignore'] })
  const r = doctor({ cwd: root, target: '.', stdout: noop, stderr: noop })
  assert.equal(r.exitCode, 0)
  assert.equal(r.notes.some(n => n.includes('领先 main')), false)
})

test('doctor：非 git 目录跳过分支检查', () => {
  const cwd = tempDir()
  scaffold({ cwd, target: 'proj', mode: 'init', stdout: noop, stderr: noop })
  const r = doctor({ cwd, target: 'proj', stdout: noop, stderr: noop })
  assert.equal(r.exitCode, 0)
  assert.equal(r.notes.some(n => n.includes('领先')), false)
})

test('doctor：缺 devDependency 时提示接入门禁', () => {
  const cwd = tempDir()
  scaffold({ cwd, target: 'proj', mode: 'init', stdout: noop, stderr: noop })
  write(cwd, 'proj/package.json', JSON.stringify({
    name: 'proj',
    private: true,
    scripts: { 'verify:docs': 'psycho-frame verify' },
  }))
  const r = doctor({ cwd, target: 'proj', stdout: noop, stderr: noop })
  assert.equal(r.exitCode, 0)
  assert.ok(r.notes.some(n => n.includes('yondren-psycho-frame')))
})

test('doctor：脚本用路径调用时不追讨 devDependency', () => {
  const cwd = tempDir()
  scaffold({ cwd, target: 'proj', mode: 'init', stdout: noop, stderr: noop })
  write(cwd, 'proj/package.json', JSON.stringify({
    name: 'proj',
    private: true,
    scripts: {
      'verify:docs': 'node packages/psycho-frame/src/cli.mjs verify',
      'change-scope': 'node packages/psycho-frame/src/cli.mjs scope',
    },
  }))
  const r = doctor({ cwd, target: 'proj', stdout: noop, stderr: noop })
  assert.equal(r.exitCode, 0)
  assert.equal(r.notes.some(n => n.includes('yondren-psycho-frame')), false)
})
