#!/usr/bin/env node
// create-yondern-psycho-frame：npm create 入口，把剩余参数原样转发给
// yondern-psycho-frame 的 init 命令（npm init yondern-psycho-frame → 本包 bin）。
import path from 'node:path'
import process from 'node:process'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

let pkgRoot
try {
  pkgRoot = path.dirname(require.resolve('yondern-psycho-frame/package.json'))
} catch {
  console.error('create-yondern-psycho-frame: 依赖 yondern-psycho-frame 未安装，请重新安装本包')
  process.exit(1)
}

const cli = path.join(pkgRoot, 'src', 'cli.mjs')
const r = spawnSync(process.execPath, [cli, 'init', ...process.argv.slice(2)], { stdio: 'inherit' })
process.exit(r.status ?? 1)
