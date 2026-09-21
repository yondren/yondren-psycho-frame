#!/usr/bin/env node
// Runs the documented consumer workflow using the actual packed core and create shim.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, fork } from 'node:child_process'
const root = fileURLToPath(new URL('..', import.meta.url))
const temp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'pf-package-smoke-')))
let registry
const env = { ...process.env, CI: 'true', PSYCHO_FRAME_NO_UPDATE_CHECK: '1', GIT_AUTHOR_NAME: 'Smoke', GIT_COMMITTER_NAME: 'Smoke', GIT_AUTHOR_EMAIL: 'smoke@example.com', GIT_COMMITTER_EMAIL: 'smoke@example.com' }
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, env, stdio: 'inherit' })
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'"
try {
  const pack = process.argv[2] ? path.resolve(process.argv[2]) : path.join(temp, 'pack')
  if (!process.argv[2]) {
    fs.mkdirSync(pack)
    for (const name of ['yondren-psycho-frame', 'create-yondren-psycho-frame']) run('pnpm', ['--filter', name, 'pack', '--pack-destination', pack])
  }
  const tarballs = fs.readdirSync(pack).filter(n => n.endsWith('.tgz')).map(n => path.join(pack, n))
  if (tarballs.length !== 2) throw new Error('Expected two tarballs')
  registry = fork(path.join(root, 'scripts/smoke-registry.mjs'), [pack], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] })
  const port = await new Promise((resolve, reject) => {
    registry.once('message', m => resolve(m.port))
    registry.once('error', reject)
    registry.once('exit', code => reject(new Error('Registry exited: ' + code)))
  })
  env.npm_config_registry = 'http://127.0.0.1:' + port
  env.npm_config_store_dir = path.join(temp, 'store')
  fs.writeFileSync(path.join(temp, 'package.json'), '{"private":true}')
  const registryConfig = 'registry=' + env.npm_config_registry + '\nstore-dir=' + path.join(temp, 'store') + '\n'
  fs.writeFileSync(path.join(temp, '.npmrc'), registryConfig)
  run('pnpm', ['--registry=' + env.npm_config_registry, 'add', '--ignore-scripts', 'create-yondren-psycho-frame'], temp)
  const create = path.join(temp, 'node_modules/create-yondren-psycho-frame/bin/create.mjs')
  const tutorial = fs.readFileSync(path.join(root, 'docs/cookbook/tutorial.md'), 'utf8')
  const commands = [...tutorial.matchAll(/```sh\n([\s\S]*?)```/g)].map(m => m[1]).join('\n')
    .replace('npm create yondren-psycho-frame@latest my-project', quote(process.execPath) + ' ' + quote(create) + ' my-project')

  const isolated = commands.replace('pnpm install', 'printf %s ' + quote(registryConfig) + ' > .npmrc\npnpm install')
  run('/bin/sh', ['-eu', '-c', isolated], temp)
  const project = path.join(temp, 'my-project')
  const status = execFileSync('git', ['status', '--porcelain'], { cwd: project, encoding: 'utf8' })
  if (status.trim()) throw new Error('Tutorial left uncommitted changes')
  const trees = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: project, encoding: 'utf8' })
  if ((trees.match(/^worktree /gm) ?? []).length !== 1) throw new Error('Tutorial left a task worktree')
  console.log('Packed create + install + documented task lifecycle: passed')
} finally { registry?.kill(); fs.rmSync(temp, { recursive: true, force: true }) }
