import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { tempDir, write } from './helpers.mjs'

const cli = fileURLToPath(new URL('../src/cli.mjs', import.meta.url))
const runCli = (cwd, args) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' })
const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

function gitRepo() {
  const root = tempDir()
  git(root, ['init', '-q'])
  write(root, 'a.md', 'x\n')
  git(root, ['add', '-A'])
  git(root, ['-c', 'user.email=t@example.com', '-c', 'user.name=t', 'commit', '-m', 'init'])
  return root
}

test('scope：base 必须显式提供', () => {
  const r = runCli(gitRepo(), ['scope'])
  assert.equal(r.status, 1)
  assert.match(r.stderr, /必须显式提供 --base/)
})

test('scope：拒绝位置参数', () => {
  const r = runCli(gitRepo(), ['scope', 'main'])
  assert.equal(r.status, 1)
  assert.match(r.stderr, /change-scope:/)
})

test('scope：无法解析的 base 报错', () => {
  const r = runCli(gitRepo(), ['scope', '--base', 'no-such-ref'])
  assert.equal(r.status, 1)
  assert.match(r.stderr, /无法解析为 commit/)
})

test('change-scope 别名与 scope 等价', () => {
  const root = gitRepo()
  const a = runCli(root, ['scope', '--base', 'HEAD'])
  const b = runCli(root, ['change-scope', '--base', 'HEAD'])
  assert.equal(a.status, 0)
  assert.equal(b.status, 0)
  assert.equal(a.stdout, b.stdout)
})

test('scope：输出四层路径集合', () => {
  const root = gitRepo()
  write(root, 'untracked.md', 'x\n')
  const r = runCli(root, ['scope', '--base', 'HEAD'])
  assert.equal(r.status, 0)
  const report = JSON.parse(r.stdout)
  assert.equal(report.formatVersion, 1)
  assert.equal(fs.realpathSync(report.repositoryRoot), fs.realpathSync(root))
  assert.deepEqual(report.input, { base: 'HEAD', head: 'HEAD' })
  assert.ok(report.resolved.baseSha.length > 0)
  assert.deepEqual(report.paths.committed, [])
  assert.deepEqual(report.paths.untracked, ['untracked.md'])
})

test('scope：未跟踪文件尊重 gitignore', () => {
  const root = gitRepo()
  write(root, '.gitignore', 'ignored.md\n')
  write(root, 'ignored.md', 'x\n')
  write(root, 'kept.md', 'x\n')
  const r = runCli(root, ['scope', '--base', 'HEAD'])
  const report = JSON.parse(r.stdout)
  assert.ok(report.paths.untracked.includes('kept.md'))
  assert.ok(!report.paths.untracked.includes('ignored.md'))
})
