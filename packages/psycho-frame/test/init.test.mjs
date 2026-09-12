import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { scaffold, doctor, sanitizeName, walkFiles } from '../src/init.mjs'
import { tempDir, write, noop } from './helpers.mjs'

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
