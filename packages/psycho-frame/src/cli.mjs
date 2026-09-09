#!/usr/bin/env node
// psycho-frame CLI：verify / scope / mode / upgrade / self-upgrade / init / adopt / doctor / help / version。
// 零依赖；verify、mode 与 doctor 的仓库根 = cwd 的 git toplevel（无 git 时回退 cwd）。
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { verifyDocs } from './verify-docs.mjs'
import { run as runScope } from './change-scope.mjs'
import { scaffold, doctor } from './init.mjs'
import { run as runUpgrade } from './upgrade.mjs'
import { readWorkMode, setWorkMode } from './work-mode.mjs'
import {
  notifyUpdate,
  spawnUpdateCheck,
  selfUpgrade,
  defaultCacheFile,
  registryUrl,
} from './self-update.mjs'

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8'))
const pkgName = pkg.name
const version = pkg.version

function gitToplevel(cwd) {
  try {
    return execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

const USAGE = `psycho-frame ${version} — 见山处（Yondern）精神力骨架开发框架

用法: psycho-frame <命令> [参数]

命令:
  verify            文档门禁：链接/锚点、决策格式、任务头字段、字数预算、工作模式取值
  scope|change-scope --base <ref> [--head <ref>]
                    四层改动面报告（base 必须显式提供）
  mode              显示当前工作模式（plan、confirmAmbiguous）
  mode set <key>=<value> [<key>=<value>]
                    设置工作模式并写回配置（plan=on|off，confirmAmbiguous=true|false）
  mode reset        恢复默认工作模式（plan=on，confirmAmbiguous=true）
  upgrade [目录]     骨架一键升级：模板优先，被覆盖的本地改动自动备份到
                    .psycho-frame-upgrade/；配置增量合并；README.md 保留本地；加 --dry-run
                    只预览（有变更退出码 1）。无目录参数时定位到 git 仓库根，非骨架项目中止
  self-upgrade       CLI 自身升级：查询 npm registry，npm 全局安装自动升级到最新版，
                    其余安装方式打印对应指引；加 --check 只查询（退出码 0=最新、1=落后）
  init [目录]       新项目脚手架（目标目录须为空，默认 .）
  adopt [目录]      旧项目采纳：只增不改，绝不覆盖既有文件（默认 .）
  doctor [目录]     结构漂移检查（默认 .）
  help [命令]       无参数打印本用法总览；带命令名打印该命令专属帮助
  version           输出版本号（等价 --version / -v）

交互终端运行任意命令时会静默检查最新版本并在有新版时提示（24h 节流、离线静默）；
设 PSYCHO_FRAME_NO_UPDATE_CHECK=1 关闭。

示例:
  psycho-frame verify
  psycho-frame scope --base main
  psycho-frame mode
  psycho-frame mode set plan=off confirmAmbiguous=false
  psycho-frame upgrade --dry-run
  psycho-frame init my-project
  psycho-frame adopt .
  psycho-frame help mode
  psycho-frame version
`

const COMMAND_HELP = {
  version: `psycho-frame version

输出版本号，与 --version / -v 等价。

示例:
  psycho-frame version

退出码: 0
`,
  help: `psycho-frame help [命令]

不带命令名时打印全部命令的用法总览；带命令名时打印该命令的专属帮助。

示例:
  psycho-frame help
  psycho-frame help mode

退出码: 0（成功）；2（未知命令名）
`,
  verify: `psycho-frame verify

文档门禁：链接/锚点、决策结构与格式、任务头字段、字数预算、工作模式取值。
仓库根 = cwd 的 git toplevel（无 git 时回退 cwd）。

示例:
  psycho-frame verify

退出码: 0（通过）；1（门禁失败）
`,
  scope: `psycho-frame scope --base <ref> [--head <ref>]

四层改动面报告（committed/staged/unstaged/untracked，JSON）；base 必须显式提供。
别名: change-scope。

示例:
  psycho-frame scope --base main

退出码: 0（成功）；1（参数或 git 错误）
`,
  'change-scope': `psycho-frame change-scope --base <ref> [--head <ref>]

scope 的别名，行为完全一致。
`,
  mode: `psycho-frame mode
psycho-frame mode set <key>=<value> [<key>=<value>]
psycho-frame mode reset

查看/设置工作模式并写回 .psycho-frame.json：plan=on|off，
confirmAmbiguous=true|false；reset 恢复默认（plan=on，confirmAmbiguous=true）。

示例:
  psycho-frame mode
  psycho-frame mode set plan=off confirmAmbiguous=false
  psycho-frame mode reset

退出码: 0（成功）；1（配置写回失败）；2（参数非法）
`,
  upgrade: `psycho-frame upgrade [目录] [--dry-run]

骨架一键升级：模板优先，被覆盖的本地改动自动备份到 .psycho-frame-upgrade/；
配置增量合并；README.md 保留本地。无目录参数时定位到 git 仓库根，非骨架项目
中止；--dry-run 只预览。

示例:
  psycho-frame upgrade
  psycho-frame upgrade --dry-run
  psycho-frame upgrade my-project

退出码: 0（成功）；1（错误或 dry-run 有变更）
`,
  'self-upgrade': `psycho-frame self-upgrade [--check]

CLI 自身升级：查询 npm registry；npm 全局安装自动升级到最新版，其余安装方式
打印对应指引。--check 只查询。

示例:
  psycho-frame self-upgrade
  psycho-frame self-upgrade --check

退出码: 0（最新或成功）；1（--check 发现新版）；2（查询失败）
`,
  init: `psycho-frame init [目录]

新项目脚手架：生成知识四层 + AGENTS.md + 配置。目标目录须为空（默认 .）。

示例:
  psycho-frame init my-project

退出码: 0（成功）；1（目标目录非空）
`,
  adopt: `psycho-frame adopt [目录]

旧项目采纳：add-only，已存在的文件跳过并报告，绝不覆盖（默认 .）。

示例:
  psycho-frame adopt .

退出码: 0（成功）
`,
  doctor: `psycho-frame doctor [目录]

结构漂移检查：必需文件、配置、脚本（默认 .）。

示例:
  psycho-frame doctor

退出码: 0（健康）；1（存在漂移）
`,
}

const args = process.argv.slice(2)
const cmd = args[0]
const rest = args.slice(1)

if (args.length === 0 || cmd === '--help' || cmd === '-h') {
  console.log(USAGE)
  process.exit(0)
}
if (cmd === '--version' || cmd === '-v' || cmd === 'version') {
  console.log(version)
  process.exit(0)
}
if (cmd === 'help') {
  const topic = rest[0]
  if (topic === undefined || topic === '--help' || topic === '-h') {
    console.log(USAGE)
    process.exit(0)
  }
  const entry = COMMAND_HELP[topic]
  if (entry === undefined) {
    console.error(`psycho-frame help: 未知命令 "${topic}"\n\n${USAGE}`)
    process.exit(2)
  }
  console.log(entry)
  process.exit(0)
}

// 自动版本检查：交互终端下同步读缓存（命中新版即提示），缓存缺失/过期时后台子进程
// 静默刷新（不阻塞命令、不改变退出码）；help/version/--version/self-upgrade 不参与。
if (cmd !== 'self-upgrade') {
  const cacheFile = defaultCacheFile()
  const isTTY = Boolean(process.stderr.isTTY)
  const { stale } = notifyUpdate({
    name: pkgName,
    currentVersion: version,
    cacheFile,
    isTTY,
    disabled: process.env.PSYCHO_FRAME_NO_UPDATE_CHECK === '1',
  })
  if (stale && isTTY && process.env.PSYCHO_FRAME_NO_UPDATE_CHECK !== '1') {
    spawnUpdateCheck({ name: pkgName, cacheFile, registryUrl: registryUrl() })
  }
}

function resolveRoot() {
  return gitToplevel(process.cwd()) ?? process.cwd()
}

switch (cmd) {
  case 'verify': {
    const root = resolveRoot()
    const { errors, count } = verifyDocs(root)
    if (errors.length > 0) {
      console.error(errors.join('\n'))
      process.exit(1)
    }
    console.log(`文档门禁通过：${count} 个 Markdown 文件，链接与锚点可解析，决策结构与格式合规，任务头字段合规，预算达标，工作模式取值合规`)
    break
  }
  case 'scope':
  case 'change-scope':
    runScope(rest)
    break
  case 'mode': {
    const root = resolveRoot()
    const fail = (msg, code) => {
      console.error(msg)
      process.exit(code)
    }
    try {
      const sub = rest[0]
      if (sub === undefined) {
        const wm = readWorkMode(root)
        console.log(`工作模式：plan=${wm.plan}，confirmAmbiguous=${wm.confirmAmbiguous}`)
        break
      }
      if (sub === 'set') {
        const patch = {}
        for (const kv of rest.slice(1)) {
          const m = /^(plan|confirmAmbiguous)=(\S+)$/.exec(kv)
          if (m === null) {
            fail(`psycho-frame mode set: 无法解析 "${kv}"（用法: mode set plan=on|off confirmAmbiguous=true|false）`, 2)
          }
          const key = m[1]
          const raw = m[2]
          patch[key] = key === 'plan' ? raw : raw === 'true' ? true : raw === 'false' ? false : raw
        }
        if (Object.keys(patch).length === 0) {
          fail(`psycho-frame mode set: 至少提供一个 key=value\n\n${USAGE}`, 2)
        }
        const result = setWorkMode(root, patch)
        if (!result.ok) {
          fail(result.errors.map(e => `.psycho-frame.json: ${e}`).join('\n'), 1)
        }
        console.log(`工作模式已更新：plan=${result.workMode.plan}，confirmAmbiguous=${result.workMode.confirmAmbiguous}`)
        break
      }
      if (sub === 'reset') {
        const result = setWorkMode(root, { plan: 'on', confirmAmbiguous: true })
        if (!result.ok) {
          fail(result.errors.map(e => `.psycho-frame.json: ${e}`).join('\n'), 1)
        }
        console.log('工作模式已恢复默认：plan=on，confirmAmbiguous=true')
        break
      }
      fail(`psycho-frame mode: 未知子命令 "${sub}"\n\n${USAGE}`, 2)
    } catch (e) {
      fail(`psycho-frame mode: ${e.message}`, 1)
    }
    break
  }
  case 'upgrade': {
    const dryRun = rest.includes('--dry-run')
    const explicit = rest.filter(a => a !== '--dry-run')[0]
    try {
      const result = explicit !== undefined
        ? runUpgrade({ target: explicit, dryRun })
        : runUpgrade({ target: '.', cwd: resolveRoot(), dryRun })
      if (result.errors) process.exit(1)
      if (dryRun && result.changed > 0) process.exit(1)
    } catch (e) {
      console.error(`psycho-frame upgrade: ${e.message}`)
      process.exit(1)
    }
    break
  }
  case 'self-upgrade': {
    const unknown = rest.filter(a => a !== '--check')
    if (unknown.length > 0) {
      console.error(`psycho-frame self-upgrade: 未知参数 "${unknown[0]}"\n\n${USAGE}`)
      process.exit(2)
    }
    try {
      const code = await selfUpgrade({
        name: pkgName,
        currentVersion: version,
        pkgDir: pkgRoot,
        registryUrl: registryUrl(),
        checkOnly: rest.includes('--check'),
      })
      process.exit(code)
    } catch (e) {
      console.error(`psycho-frame self-upgrade: ${e.message}`)
      process.exit(1)
    }
  }
  case 'init':
  case 'adopt':
    scaffold({ target: rest[0] ?? '.', mode: cmd })
    break
  case 'doctor':
    doctor({ target: rest[0] ?? '.' })
    break
  default:
    console.error(`psycho-frame: 未知命令 "${cmd}"\n\n${USAGE}`)
    process.exit(2)
}
