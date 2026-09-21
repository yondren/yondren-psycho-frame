import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { runRelease } from '../../../scripts/release.mjs'
import { gitFixture, gitIn, tempDir, write, taskText } from './helpers.mjs'

const source = fileURLToPath(new URL('../../..', import.meta.url))
const core = 'yondren-psycho-frame', shim = 'create-yondren-psycho-frame'
const files = ['packages/psycho-frame/package.json', 'packages/create-yondren-psycho-frame/package.json', 'packages/psycho-frame/template/package.json']
const digest = p => 'sha512-' + createHash('sha512').update(fs.readFileSync(p)).digest('base64')
function fixture() {
  const root = gitFixture(), remote = path.join(tempDir(), 'origin.git')
  write(root, 'package.json', JSON.stringify({ name: 'yondren-psycho-frame-workspace', private: true }))
  for (const file of files) {
    const pkg = JSON.parse(fs.readFileSync(path.join(source, file), 'utf8'))
    if (file.includes('/template/')) pkg.devDependencies[core] = '^0.5.0'; else pkg.version = '0.5.0'
    write(root, file, JSON.stringify(pkg))
  }
  write(root, 'tasks/2026-01-01-release-test.md', taskText({ key: 'release-test', status: 'IN_PROGRESS', report: '../reports/release-test.md' }))
  write(root, 'reports/release-test.md', '# Release test\n')
  gitIn(root, 'add', '-A'); gitIn(root, 'commit', '-qm', 'release fixture [release-test]')
  gitIn(root, 'init', '--bare', '-q', remote)
  gitIn(root, 'remote', 'add', 'origin', remote)
  gitIn(root, 'push', '-qu', 'origin', 'main')
  const published = new Map(), calls = []
  const controls = { failShim: false, failTests: false, failMirror: false, authError: false }
  const ok = stdout => ({ status: 0, stdout: stdout ?? '', stderr: '' })
  const execute = (cmd, args, opts) => {
    calls.push([cmd, ...args])
    if (cmd === 'git' && args[0] === 'push' && args.includes('codeup') && controls.failMirror) return { status: 1, stdout: '', stderr: 'mirror unavailable' }
    if (cmd === 'pnpm') {
      if (args[0] === 'test' && controls.failTests) return { status: 1, stdout: '', stderr: 'test failure' }
      if (args.includes('pack')) {
        const name = args[1], folder = name === core ? 'psycho-frame' : 'create-yondren-psycho-frame'
        const pkg = JSON.parse(fs.readFileSync(path.join(root, 'packages', folder, 'package.json'), 'utf8'))
        const dest = args[args.indexOf('--pack-destination') + 1], staging = tempDir()
        if (name === shim) pkg.dependencies[core] = '^' + pkg.version
        write(staging, 'package/package.json', JSON.stringify(pkg))
        if (name === core) write(staging, 'package/template/package.json', fs.readFileSync(path.join(root, files[2])))
        execFileSync('tar', ['-czf', path.join(dest, name + '-' + pkg.version + '.tgz'), '-C', staging, 'package'])
      }
      return ok()
    }
    if (cmd === process.execPath) return ok() // Checks are tested separately; here isolate release state transitions.
    if (cmd === 'npm') {
      if (args[0] === 'config') return ok('https://registry.example.test/\n')
      if (args[0] === 'view') {
        if (controls.authError) return { status: 1, stdout: JSON.stringify({ error: { code: 'E401' } }), stderr: '' }
        const name = args[1].split('@')[0]
        return published.has(name) ? ok(JSON.stringify(published.get(name))) : { status: 1, stdout: JSON.stringify({ error: { code: 'E404' } }), stderr: '' }
      }
      if (args[0] === 'publish') {
        const file = args[1], name = path.basename(file).startsWith('create-') ? shim : core
        if (name === shim && controls.failShim) return { status: 1, stdout: '', stderr: 'simulated failure' }
        published.set(name, digest(file)); return ok()
      }
      throw new Error('Unexpected npm command')
    }
    return spawnSync(cmd, args, opts)
  }
  const release = args => runRelease({ args, cwd: root, execute, log: () => {} })
  const prepare = () => release(['patch', '--prepare', '--task-key=release-test'])
  return { root, remote, release, prepare, calls, published, controls }
}

test('release: second package failure resumes same version using exact validated tarballs', () => {
  const f = fixture(), prepared = f.prepare(), { version, artifacts } = prepared.state
  assert.equal(prepared.state.phase, 'prepared')
  assert.equal(f.published.size, 0)
  assert.equal(f.calls.filter(c => c[0] === 'pnpm' && c.includes('pack')).length, 2)
  const smoke = f.calls.find(c => c[1] === 'scripts/smoke-package.mjs')
  assert.equal(smoke[2], path.dirname(prepared.stateFile))
  f.controls.failShim = true
  assert.throws(() => f.release(['--resume=' + version, '--publish']), /保留恢复记录/)
  assert.equal(f.published.get(core), artifacts[0].integrity)
  f.controls.failShim = false
  const done = f.release(['--resume=' + version, '--publish'])
  assert.equal(done.state.phase, 'published')
  assert.equal(f.published.get(shim), artifacts[1].integrity)
  assert.equal(f.calls.filter(c => c[0] === 'npm' && c[1] === 'publish' && !path.basename(c[2]).startsWith('create-')).length, 1)
  assert.equal(f.calls.filter(c => c[0] === 'pnpm' && c.includes('pack')).length, 2)
  for (const c of f.calls.filter(c => c[0] === 'npm' && c[1] === 'publish')) assert.ok(c[2].startsWith(path.dirname(prepared.stateFile)))
})

test('release: stale remote HEAD and tag conflicts stop before changes or publication', () => {
  for (const cause of ['local-tag', 'remote-tag', 'behind']) {
    const f = fixture(), before = fs.readFileSync(path.join(f.root, files[0]), 'utf8')
    if (cause === 'local-tag') gitIn(f.root, 'tag', 'v0.5.1')
    if (cause === 'remote-tag') { gitIn(f.root, 'tag', 'v0.5.1'); gitIn(f.root, 'push', '-q', 'origin', 'v0.5.1'); gitIn(f.root, 'tag', '-d', 'v0.5.1') }
    if (cause === 'behind') {
      gitIn(f.root, 'commit', '--allow-empty', '-qm', 'remote advance')
      gitIn(f.root, 'push', '-q', 'origin', 'main')
      gitIn(f.root, 'reset', '--hard', 'HEAD^')
    }
    assert.throws(f.prepare, /tag|精确 OID/, cause)
    assert.equal(fs.readFileSync(path.join(f.root, files[0]), 'utf8'), before)
    assert.equal(f.calls.some(c => c[0] === 'pnpm'), false)
  }
})

test('release: modified artifact, mismatching registry integrity and remote movement block resume', () => {
  for (const cause of ['artifact', 'registry', 'remote', 'head']) {
    const f = fixture(), { state, stateFile } = f.prepare()
    if (cause === 'artifact') fs.appendFileSync(path.join(path.dirname(stateFile), state.artifacts[0].file), 'tamper')
    if (cause === 'registry') f.published.set(core, 'sha512-wrong')
    if (cause === 'remote') {
      gitIn(f.root, 'commit', '--allow-empty', '-qm', 'remote advance')
      gitIn(f.root, 'push', '-q', 'origin', 'main')
      gitIn(f.root, 'reset', '--hard', 'HEAD^')
    }
    if (cause === 'head') gitIn(f.root, 'commit', '--allow-empty', '-qm', 'head advance')
    assert.throws(() => f.release(['--resume=' + state.version, '--publish']), /摘要|变化|HEAD/, cause)
    assert.equal(f.calls.some(c => c[0] === 'npm' && c[1] === 'publish'), false)
  }
})

test('release: tests run after bump, failure preserves originals and produces no tag/publish', () => {
  const f = fixture()
  f.controls.failTests = true
  assert.throws(f.prepare, /pnpm test 失败/)
  const state = JSON.parse(fs.readFileSync(path.join(f.root, '.git/releases/0.5.1/state.json'), 'utf8'))
  assert.equal(state.phase, 'preparing')
  assert.equal(JSON.parse(state.originals[files[0]]).version, '0.5.0')
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.root, files[0]))).version, '0.5.1')
  assert.equal(f.calls.some(c => c[0] === 'npm' && c[1] === 'publish'), false)
  assert.equal(gitIn(f.root, 'tag', '--list'), '')
})

test('release: preview is read-only and invalid task status cannot prepare', () => {
  const f = fixture()
  f.release(['patch', '--preview', '--task-key=release-test'])
  assert.equal(fs.existsSync(path.join(f.root, '.git/releases')), false)
  write(f.root, 'tasks/2026-01-01-release-test.md', taskText({ key: 'release-test', status: 'DONE', report: '../reports/release-test.md' }))
  gitIn(f.root, 'add', '-A'); gitIn(f.root, 'commit', '-qm', 'done'); gitIn(f.root, 'push', '-q', 'origin', 'main')
  assert.throws(f.prepare, /IN_PROGRESS/)
})

test('release: mirror failure resumes after origin push, with no republishing', () => {
  const f = fixture(), mirror = path.join(tempDir(), 'mirror.git')
  gitIn(f.root, 'init', '--bare', '-q', mirror)
  gitIn(f.root, 'remote', 'add', 'codeup', mirror)
  gitIn(f.root, 'push', '-q', 'codeup', 'main:mirror')
  const { state } = f.prepare()
  f.controls.failMirror = true
  assert.throws(() => f.release(['--resume=' + state.version, '--publish', '--push']), /保留恢复记录/)
  const publications = f.calls.filter(c => c[0] === 'npm' && c[1] === 'publish').length
  f.controls.failMirror = false
  const done = f.release(['--resume=' + state.version, '--publish', '--push'])
  assert.equal(done.state.phase, 'complete')
  assert.equal(f.calls.filter(c => c[0] === 'npm' && c[1] === 'publish').length, publications)
  assert.match(gitIn(f.root, 'ls-remote', 'codeup', 'refs/heads/mirror'), new RegExp(state.head))
})

test('release: registry authentication error is never treated as an absent package', () => {
  const f = fixture(), { state } = f.prepare()
  f.controls.authError = true
  assert.throws(() => f.release(['--resume=' + state.version, '--publish']), /认证/)
  assert.equal(f.calls.some(c => c[0] === 'npm' && c[1] === 'publish'), false)
})

test('release: a hook changing the tested tree prevents publication; tag-write interruption recovers', () => {
  const f = fixture()
  write(f.root, '.git/hooks/pre-commit', '#!/bin/sh\nprintf "\\nchanged by hook\\n" >> README.md\ngit add README.md\n')
  fs.chmodSync(path.join(f.root, '.git/hooks/pre-commit'), 0o755)
  assert.throws(f.prepare, /受测暂存树/)
  assert.equal(f.calls.some(c => c[0] === 'npm' && c[1] === 'publish'), false)

  const clean = fixture(), { state, stateFile } = clean.prepare()
  const tagOid = state.tagOid
  state.phase = 'committed'; delete state.tagOid
  fs.writeFileSync(stateFile, JSON.stringify(state))
  const recovered = clean.release(['--resume=' + state.version])
  assert.equal(recovered.state.phase, 'prepared')
  assert.equal(recovered.state.tagOid, tagOid)
  assert.ok(recovered.state.validation.some(v => v.name === 'exact tarball consumer lifecycle'))
  gitIn(clean.root, 'tag', '-f', '-a', 'v' + state.version, '-m', 'replacement tag')
  assert.throws(() => clean.release(['--resume=' + state.version, '--publish']), /本地 tag/)
})
