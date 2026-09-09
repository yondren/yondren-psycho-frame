// CLI 自升级与自动版本检查：零依赖（仅 Node ≥ 18.20 内置模块）。
// - notifyUpdate：同步读缓存，命中"有新版本"且交互终端时打印升级提示。
// - spawnUpdateCheck：缓存缺失/过期时后台 detached 子进程静默查询 registry 并写缓存，
//   不阻塞命令、不改变退出码；提示在下次运行出现（update-notifier 同款节奏）。
// - selfUpgrade：self-upgrade 命令实现——查询 registry，npm 全局安装自动 npm install -g，
//   其余安装方式打印对应指引；--check 只查询。
// 开关：PSYCHO_FRAME_NO_UPDATE_CHECK=1 关闭；PSYCHO_FRAME_REGISTRY_URL 覆盖 registry
// （测试用）；PSYCHO_FRAME_UPDATE_CACHE_FILE 覆盖缓存路径（测试用）。
// 用法: import { notifyUpdate, spawnUpdateCheck, selfUpgrade } from './self-update.mjs'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import http from 'node:http'
import https from 'node:https'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const DEFAULT_REGISTRY_URL = 'https://registry.npmjs.org'
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000
const DEFAULT_TIMEOUT_MS = 3000

/** semver 数字比较：忽略 prerelease/build 段；返回 -1 / 0 / 1。 */
export function compareVersions(a, b) {
  const pa = a.split(/[-+]/)[0].split('.').map(n => parseInt(n, 10) || 0)
  const pb = b.split(/[-+]/)[0].split('.').map(n => parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d !== 0) return d < 0 ? -1 : 1
  }
  return 0
}

export function defaultCacheFile(env = process.env) {
  if (env.PSYCHO_FRAME_UPDATE_CACHE_FILE) return env.PSYCHO_FRAME_UPDATE_CACHE_FILE
  const base = env.XDG_CACHE_HOME
    ?? (process.platform === 'win32' ? (env.LOCALAPPDATA || os.tmpdir()) : path.join(os.homedir(), '.cache'))
  return path.join(base, 'psycho-frame', 'update-check.json')
}

export function registryUrl(env = process.env) {
  return (env.PSYCHO_FRAME_REGISTRY_URL || DEFAULT_REGISTRY_URL).replace(/\/+$/, '')
}

export function readUpdateCache(cacheFile, now = Date.now(), ttlMs = DEFAULT_TTL_MS) {
  try {
    const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'))
    if (typeof data.checkedAt === 'number' && typeof data.latest === 'string' && now - data.checkedAt < ttlMs) {
      return data
    }
  } catch {}
  return null
}

export function writeUpdateCache(cacheFile, data) {
  try {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true })
    const tmp = `${cacheFile}.tmp-${process.pid}`
    fs.writeFileSync(tmp, JSON.stringify(data))
    fs.renameSync(tmp, cacheFile)
    return true
  } catch {
    return false
  }
}

/** 查询 registry dist-tags 的 latest；任何失败/超时/非 200 返回 null，绝不抛错。 */
export function fetchLatest({ registryUrl: base, name, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  return new Promise(resolve => {
    let req
    try {
      const mod = base.startsWith('http://') ? http : https
      const url = `${base.replace(/\/+$/, '')}/-/package/${encodeURIComponent(name)}/dist-tags`
      req = mod.get(url, res => {
        if (res.statusCode !== 200) {
          res.resume()
          resolve(null)
          return
        }
        let body = ''
        res.setEncoding('utf8')
        res.on('data', c => {
          body += c
          if (body.length > 64 * 1024) req.destroy()
        })
        res.on('error', () => resolve(null))
        res.on('end', () => {
          try {
            const tags = JSON.parse(body)
            resolve(typeof tags.latest === 'string' ? tags.latest : null)
          } catch {
            resolve(null)
          }
        })
      })
    } catch {
      resolve(null)
      return
    }
    req.setTimeout(timeoutMs, () => req.destroy())
    req.on('error', () => resolve(null))
  })
}

/** 同步读缓存并在交互终端打印升级提示；返回 { notified, stale }。 */
export function notifyUpdate({
  name,
  currentVersion,
  cacheFile,
  ttlMs = DEFAULT_TTL_MS,
  isTTY = false,
  disabled = false,
  now = Date.now(),
  printer = console.error,
}) {
  if (disabled || !isTTY) return { notified: false, stale: false }
  const cache = readUpdateCache(cacheFile, now, ttlMs)
  if (cache === null) return { notified: false, stale: true }
  if (compareVersions(cache.latest, currentVersion) > 0) {
    printer(`[psycho-frame] 新版本 v${cache.latest} 可用（当前 v${currentVersion}），运行 psycho-frame self-upgrade 升级`)
    return { notified: true, stale: false }
  }
  return { notified: false, stale: false }
}

/** 后台 detached 子进程静默查询并写缓存（stdio 隔离、unref，不拖慢父进程退出）。 */
export function spawnUpdateCheck({
  name,
  cacheFile,
  registryUrl: base,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  nodeBin = process.execPath,
  env = process.env,
}) {
  try {
    const child = spawn(nodeBin, [fileURLToPath(import.meta.url)], {
      detached: true,
      stdio: 'ignore',
      env: {
        ...env,
        PSYCHO_FRAME_CHILD_CHECK: JSON.stringify({ name, cacheFile, registryUrl: base, timeoutMs }),
      },
    })
    child.unref()
    return true
  } catch {
    return false
  }
}

function npmGlobalRoot() {
  try {
    return execFileSync('npm', ['root', '-g'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

function isNpmGlobalInstall(pkgDir) {
  const root = npmGlobalRoot()
  if (!root) return false
  try {
    const real = fs.realpathSync(pkgDir)
    return real === root || real.startsWith(root + path.sep)
  } catch {
    return false
  }
}

/**
 * self-upgrade 命令：checkOnly 只查询（退出码 0=最新、1=落后）；否则有新版时
 * npm 全局安装自动升级，其余安装方式打印指引。返回退出码，绝不抛错。
 */
export async function selfUpgrade({
  name,
  currentVersion,
  pkgDir,
  registryUrl: base,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  checkOnly = false,
  stdout = console.log,
  stderr = console.error,
}) {
  const latestVersion = await fetchLatest({ registryUrl: base, name, timeoutMs })
  if (latestVersion === null) {
    stderr(`psycho-frame self-upgrade: 无法查询 ${base}（离线或超时），请稍后重试`)
    return 2
  }
  const newer = compareVersions(latestVersion, currentVersion) > 0
  if (checkOnly) {
    stdout(`yondern-psycho-frame：当前 v${currentVersion}，最新 v${latestVersion}`)
    return newer ? 1 : 0
  }
  if (!newer) {
    stdout(`psycho-frame 已是最新版本 v${currentVersion}`)
    return 0
  }
  if (isNpmGlobalInstall(pkgDir)) {
    stdout(`正在升级 ${name}: v${currentVersion} → v${latestVersion}（npm install -g）`)
    return runNpmInstallGlobal(name, latestVersion)
  }
  stdout(`检测到新版本 v${latestVersion}（当前 v${currentVersion}），当前非 npm 全局安装，未自动执行。请按安装方式升级：`)
  stdout(`  npm install -g ${name}@${latestVersion}        # npm 全局安装`)
  stdout(`  pnpm add -D ${name}@${latestVersion}            # 项目 devDependency`)
  return 0
}

function runNpmInstallGlobal(name, version) {
  return new Promise(resolve => {
    let child
    try {
      child = spawn('npm', ['install', '-g', `${name}@${version}`], {
        stdio: 'inherit',
        shell: process.platform === 'win32',
      })
    } catch {
      resolve(1)
      return
    }
    child.on('error', () => resolve(1))
    child.on('close', code => resolve(code === 0 ? 0 : 1))
  })
}

// 直接执行本文件 = 后台检查子进程：查询并写缓存后静默退出。
const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) {
  const cfg = JSON.parse(process.env.PSYCHO_FRAME_CHILD_CHECK || '{}')
  const latest = await fetchLatest({ registryUrl: cfg.registryUrl, name: cfg.name, timeoutMs: cfg.timeoutMs })
  if (latest !== null) writeUpdateCache(cfg.cacheFile, { checkedAt: Date.now(), latest })
  process.exit(0)
}
