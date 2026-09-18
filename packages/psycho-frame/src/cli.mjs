#!/usr/bin/env node
// psycho-frame CLI：verify / scope / mode / task / upgrade / self-upgrade / init / adopt / doctor / help / version。
// 零依赖；verify、mode、task 与 doctor 的仓库根 = cwd 的 git toplevel（无 git 时回退 cwd）。
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { verifyDocs } from './verify-docs.mjs'
import { run as runScope } from './change-scope.mjs'
import { destroyGate } from './destroy.mjs'
import { startTask, checkWorktrees } from './worktree.mjs'
import { scaffold, doctor } from './init.mjs'
import { run as runUpgrade } from './upgrade.mjs'
import { readWorkMode, setWorkMode, DEFAULT_WORK_MODE } from './work-mode.mjs'
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

// 工作模式的键与默认值全部来自 work-mode.mjs；mode 子命令的解析、回显与 reset 由它派生，
// 避免新增开关时在这里漏改。
const MODE_KEYS = Object.keys(DEFAULT_WORK_MODE)
const MODE_PATCH_RE = new RegExp(`^(${MODE_KEYS.join('|')})=(\\S+)$`)
const modeLine = wm => MODE_KEYS.map(k => `${k}=${wm[k]}`).join('，')

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

const USAGE = `psycho-frame ${version} — 见山处（Yondren）精神力骨架开发框架

用法: psycho-frame <命令> [参数]

命令:
  verify [--json] [--base <ref>]
                    文档门禁：链接/锚点、决策格式、任务头字段、字数预算、工作模式取值；
                    destroy=on 时追加毁灭门禁（worktree 纪律、决策记录、task_key、凭据扫描、
                    destroyChecks 全量矩阵），此时 --base 必须显式提供；--json 输出机器可读结果
  scope|change-scope --base <ref> [--head <ref>]
                    四层改动面报告（base 必须显式提供）
  mode              显示当前工作模式（plan、confirmAmbiguous、fleet、merge、destroy、audience、engineering）
  mode set <key>=<value> [<key>=<value>]
                    设置工作模式并写回配置（plan=on|off，confirmAmbiguous=true|false，
                    fleet=on|off，merge=off|ask|auto，destroy=on|off，audience=expert|product|novice，
                    engineering=on|off）
  mode reset        恢复默认工作模式（plan=on，confirmAmbiguous=true，fleet=off，merge=ask，
                    destroy=off，audience=expert，engineering=off）
  task start <task_key> [--base <ref>] [--title <标题>]
                    一条命令开任务 worktree：建分支与 .worktrees/<task_key>、登记任务卡与报告
                    占位、隔离 worktree 级 core.hooksPath；幂等，已存在则跳过
  task check [--json]
                    worktree 纪律检查：IN_PROGRESS 必须有 worktree、DONE 不留 worktree、
                    任务分支不在根 checkout 检出、各 worktree 的 core.hooksPath 互不相同
  upgrade [目录] [--dry-run] [--exit-code]
                    骨架一键升级：模板优先，被覆盖的本地改动自动备份到
                    .psycho-frame-upgrade/；配置增量合并；README.md 保留本地；加 --dry-run
                    只预览，--exit-code 让预览有变更时退出码为 1。无目录参数时定位到
                    git 仓库根，非骨架项目、框架源码仓库与 linked worktree 中止
  self-upgrade       CLI 自身升级：查询 npm registry，npm 全局安装自动升级到最新版，
                    其余安装方式打印对应指引；加 --check 只查询（退出码 0=最新、1=落后）
  init [目录]       新项目脚手架（目标目录须为空，默认 .）
  adopt [目录]      旧项目采纳：只增不改，绝不覆盖既有文件（默认 .）
  doctor [目录]     结构漂移检查（默认 .）
  help [命令]       无参数打印本用法总览；带命令名打印该命令专属帮助
  version           输出版本号（等价 --version / -v）

任意命令加 --help / -h 打印该命令的专属帮助（等价 psycho-frame help <命令>）。

交互终端运行任意命令时会静默检查最新版本并在有新版时提示（24h 节流、离线静默）；
设 PSYCHO_FRAME_NO_UPDATE_CHECK=1 关闭。

示例:
  psycho-frame verify
  psycho-frame verify --base main
  psycho-frame task start my-task
  psycho-frame task check
  psycho-frame scope --base main
  psycho-frame mode
  psycho-frame mode set plan=off fleet=on
  psycho-frame mode set destroy=on
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
  verify: `psycho-frame verify [--json] [--base <ref>]

文档门禁：链接/锚点、决策结构与格式、任务头字段、字数预算、工作模式取值。
仓库根 = cwd 的 git toplevel（无 git 时回退 cwd）。--json 输出
{ formatVersion, ok, count, destroy, checks, errors }。

workMode.destroy=on 时追加毁灭门禁：worktree 纪律（psycho-frame task check 的项）、改动面必须
带决策记录、每个提交含 task_key、凭据扫描，以及 .psycho-frame.json 的 destroyChecks 逐条执行
（本地全量矩阵）。此时 --base 必须显式提供，且微小改动豁免不适用。

示例:
  psycho-frame verify
  psycho-frame verify --json
  psycho-frame verify --base main

退出码: 0（通过）；1（门禁失败）；2（参数非法）
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

查看/设置工作模式并写回 .psycho-frame.json：plan=on|off，confirmAmbiguous=true|false，
fleet=on|off，merge=off|ask|auto，destroy=on|off，audience=expert|product|novice，
engineering=on|off；
reset 恢复默认（plan=on，confirmAmbiguous=true，fleet=off，merge=ask，destroy=off，
audience=expert，engineering=off）。

merge 只决定任务分支的本地合流（auto 合到父分支，默认 main），不含推送。
destroy=on 把 verify 拉满（见 psycho-frame help verify），默认 off，只加严不改动其他开关。
语义与耦合矩阵见项目内 docs/modes.md：audience 决定措辞与解释深度，engineering=on 时在
方案阶段逐项过工程化清单。

示例:
  psycho-frame mode
  psycho-frame mode set audience=product
  psycho-frame mode set engineering=on
  psycho-frame mode set plan=off fleet=on
  psycho-frame mode set merge=auto
  psycho-frame mode set destroy=on
  psycho-frame mode reset

退出码: 0（成功）；1（配置写回失败）；2（参数非法）
`,
  task: `psycho-frame task start <task_key> [--base <ref>] [--title <标题>]
psycho-frame task check [--json]

task start：一条命令开任务 worktree，等价于 docs/cookbook/parallel-worktrees.md 的手工三步——
建分支 <task_key> 与 .worktrees/<task_key>、登记 tasks/<日期>-<task_key>.md（IN_PROGRESS）与
reports/<task_key>.md 占位、开 extensions.worktreeConfig 并设该 worktree 的 core.hooksPath 隔离。
缺 .worktrees/ 的 .gitignore 会自动补一行；worktree 已存在且分支正确时幂等跳过。只能从主
checkout 执行（linked worktree 内中止）。
--base 缺省用 main / master；没有则必须显式提供。

task check：worktree 纪律检查——IN_PROGRESS 任务必须有对应 worktree、DONE 不留 worktree、
孤儿 worktree、根 checkout 不得检出任务分支、各 worktree 的 core.hooksPath 必须互不相同、
BLOCKED/DEFERRED 必须写原因。destroy=on 时这些项并入 psycho-frame verify。

示例:
  psycho-frame task start destroy-gate
  psycho-frame task start destroy-gate --base main --title "毁灭门禁"
  psycho-frame task check
  psycho-frame task check --json

退出码: 0（成功或纪律通过）；1（错误或存在违规）；2（参数非法）
`,
  upgrade: `psycho-frame upgrade [目录] [--dry-run] [--exit-code]

骨架一键升级：模板优先，被覆盖的本地改动自动备份到 .psycho-frame-upgrade/；
配置增量合并；README.md 保留本地。无目录参数时定位到 git 仓库根，非骨架项目
中止；框架源码仓库（模板源头）中止；linked worktree 中止（升级改的是全仓库共享的
根文件，须在根 checkout 原地执行）；--dry-run 只预览，--exit-code 让预览有变更时
退出码为 1。

示例:
  psycho-frame upgrade
  psycho-frame upgrade --dry-run
  psycho-frame upgrade --dry-run --exit-code
  psycho-frame upgrade my-project

退出码: 0（成功或 dry-run 无变更）；1（错误或 --exit-code 下有变更）；2（参数非法）
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

退出码: 0（成功）；1（目标目录非空）；2（参数非法）
`,
  adopt: `psycho-frame adopt [目录]

旧项目采纳：add-only，已存在的文件跳过并报告，绝不覆盖（默认 .）。

示例:
  psycho-frame adopt .

退出码: 0（成功）；2（参数非法）
`,
  doctor: `psycho-frame doctor [目录]

结构漂移检查：必需文件、配置、脚本（默认 .）。

示例:
  psycho-frame doctor

退出码: 0（健康）；1（存在漂移）；2（参数非法）
`,
}

const args = process.argv.slice(2)
const cmd = args[0]
const rest = args.slice(1)

if (args.length === 0 || cmd === '--help' || cmd === '-h') {
  console.log(USAGE)
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

// 任意命令带 --help/-h：只打印该命令的专属帮助并退出，绝不执行命令本身
// （否则 init --help 会把 --help 当目标目录就地脚手架）。
if (rest.includes('--help') || rest.includes('-h')) {
  const entry = COMMAND_HELP[cmd]
  if (entry === undefined) {
    console.error(`psycho-frame: 未知命令 "${cmd}"\n\n${USAGE}`)
    process.exit(2)
  }
  console.log(entry)
  process.exit(0)
}

if (cmd === '--version' || cmd === '-v' || cmd === 'version') {
  console.log(version)
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

// init/adopt/doctor 只接受至多一个目录参数：未知选项与多余参数一律退出码 2，
// 不接受以 - 开头的目标目录（需要时写 ./-dir）。
function singleTargetArg(cmdName) {
  const unknown = rest.find(a => a.startsWith('-'))
  if (unknown !== undefined) {
    console.error(`psycho-frame ${cmdName}: 未知参数 "${unknown}"\n\n${USAGE}`)
    process.exit(2)
  }
  if (rest.length > 1) {
    console.error(`psycho-frame ${cmdName}: 最多提供一个目录参数\n\n${USAGE}`)
    process.exit(2)
  }
  return rest[0] ?? '.'
}

switch (cmd) {
  case 'verify': {
    const json = rest.includes('--json')
    const baseAt = rest.indexOf('--base')
    const base = baseAt === -1 ? undefined : rest[baseAt + 1]
    if (baseAt !== -1 && (base === undefined || base.startsWith('-'))) {
      console.error(`psycho-frame verify: --base 需要一个 ref\n\n${USAGE}`)
      process.exit(2)
    }
    const consumed = new Set(['--json', '--base'])
    if (base !== undefined) consumed.add(base)
    const unknown = rest.filter(a => !consumed.has(a))
    if (unknown.length > 0) {
      console.error(`psycho-frame verify: 未知参数 "${unknown[0]}"\n\n${USAGE}`)
      process.exit(2)
    }
    const root = resolveRoot()
    let result
    try {
      result = verifyDocs(root)
    } catch (e) {
      result = { errors: [`psycho-frame verify: ${e.message}`], count: 0 }
    }
    const { errors, count } = result
    // 毁灭模式只在配置里打开：on 时把 worktree 纪律、决策记录、task_key、凭据与全量矩阵并入同一门禁。
    // 配置损坏时由文档门禁报错，这里按关闭处理，避免 verify --json 反而没有输出。
    let destroy = false
    try {
      destroy = readWorkMode(root).destroy === 'on'
    } catch {
      destroy = false
    }
    let checks = []
    let notes = []
    if (destroy) {
      try {
        const gate = destroyGate(root, { base })
        errors.push(...gate.errors)
        checks = gate.checks
        notes = gate.notes
      } catch (e) {
        errors.push(`psycho-frame verify: 毁灭门禁执行失败: ${e.message}`)
      }
    }
    if (json) {
      console.log(JSON.stringify({ formatVersion: 1, ok: errors.length === 0, count, destroy, checks, errors }, null, 2))
    } else if (errors.length > 0) {
      console.error(errors.join('\n'))
    } else {
      for (const note of notes) console.log(`[note] ${note}`)
      for (const check of checks) console.log(`[ok] ${check.command}`)
      const tail = destroy ? `；毁灭模式：矩阵 ${checks.length} 条通过` : ''
      console.log(`文档门禁通过：${count} 个 Markdown 文件，链接与锚点可解析，决策结构与格式合规，任务头字段合规，预算达标，工作模式取值合规${tail}`)
    }
    if (errors.length > 0) process.exit(1)
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
        console.log(`工作模式：${modeLine(wm)}`)
        break
      }
      if (sub === 'set') {
        const patch = {}
        for (const kv of rest.slice(1)) {
          const m = MODE_PATCH_RE.exec(kv)
          if (m === null) {
            fail(`psycho-frame mode set: 无法解析 "${kv}"（用法: mode set <key>=<value>；可用键: ${MODE_KEYS.join(' / ')}）`, 2)
          }
          const key = m[1]
          const raw = m[2]
          patch[key] = typeof DEFAULT_WORK_MODE[key] === 'boolean'
            ? raw === 'true' ? true : raw === 'false' ? false : raw
            : raw
        }
        if (Object.keys(patch).length === 0) {
          fail(`psycho-frame mode set: 至少提供一个 key=value\n\n${USAGE}`, 2)
        }
        const result = setWorkMode(root, patch)
        if (!result.ok) {
          fail(result.errors.map(e => `.psycho-frame.json: ${e}`).join('\n'), 1)
        }
        console.log(`工作模式已更新：${modeLine(result.workMode)}`)
        break
      }
      if (sub === 'reset') {
        const result = setWorkMode(root, { ...DEFAULT_WORK_MODE })
        if (!result.ok) {
          fail(result.errors.map(e => `.psycho-frame.json: ${e}`).join('\n'), 1)
        }
        console.log(`工作模式已恢复默认：${modeLine(result.workMode)}`)
        break
      }
      fail(`psycho-frame mode: 未知子命令 "${sub}"\n\n${USAGE}`, 2)
    } catch (e) {
      fail(`psycho-frame mode: ${e.message}`, 1)
    }
    break
  }
  case 'task': {
    const root = resolveRoot()
    const sub = rest[0]
    if (sub === 'start') {
      let key
      let base
      let title
      let bad = null
      for (let i = 1; i < rest.length && bad === null; i += 1) {
        const arg = rest[i]
        const takeValue = () => {
          const v = rest[i + 1]
          if (v === undefined || v.startsWith('-')) {
            bad = `${arg} 缺少取值`
            return undefined
          }
          i += 1
          return v
        }
        if (arg === '--base') base = takeValue()
        else if (arg === '--title') title = takeValue()
        else if (arg.startsWith('-')) bad = `未知参数 "${arg}"`
        else if (key === undefined) key = arg
        else bad = `最多提供一个 task_key（多余 "${arg}"）`
      }
      if (bad !== null) {
        console.error(`psycho-frame task start: ${bad}\n\n${USAGE}`)
        process.exit(2)
      }
      if (key === undefined) {
        console.error(`psycho-frame task start: 必须提供 task_key\n\n${USAGE}`)
        process.exit(2)
      }
      const result = startTask({ root, key, base, ...(title === undefined ? {} : { title }) })
      if (!result.ok) {
        console.error(`psycho-frame task start: ${result.errors.join('\n')}`)
        process.exit(result.exitCode)
      }
      break
    }
    if (sub === 'check') {
      const json = rest.includes('--json')
      const unknown = rest.slice(1).filter(a => a !== '--json')
      if (unknown.length > 0) {
        console.error(`psycho-frame task check: 未知参数 "${unknown[0]}"\n\n${USAGE}`)
        process.exit(2)
      }
      const { issues, notes } = checkWorktrees(root)
      if (json) {
        console.log(JSON.stringify({ formatVersion: 1, ok: issues.length === 0, issues, notes }, null, 2))
      } else {
        for (const note of notes) console.log(`[note] ${note}`)
        for (const issue of issues) console.error(`[issue] ${issue}`)
        if (issues.length === 0) {
          console.log('worktree 纪律通过：任务卡与 .worktrees/ 一一对应，根 checkout 干净，hooks 已隔离')
        }
      }
      if (issues.length > 0) process.exit(1)
      break
    }
    console.error(`psycho-frame task: 未知子命令 "${String(sub)}"（可用: start / check）\n\n${USAGE}`)
    process.exit(2)
  }
  case 'upgrade': {
    const KNOWN = new Set(['--dry-run', '--exit-code'])
    const unknown = rest.find(a => a.startsWith('--') && !KNOWN.has(a))
    if (unknown !== undefined) {
      console.error(`psycho-frame upgrade: 未知参数 "${unknown}"\n\n${USAGE}`)
      process.exit(2)
    }
    const positional = rest.filter(a => !a.startsWith('--'))
    if (positional.length > 1) {
      console.error(`psycho-frame upgrade: 最多提供一个目录参数\n\n${USAGE}`)
      process.exit(2)
    }
    const dryRun = rest.includes('--dry-run')
    const exitCode = rest.includes('--exit-code')
    const explicit = positional[0]
    try {
      const result = explicit !== undefined
        ? runUpgrade({ target: explicit, dryRun })
        : runUpgrade({ target: '.', cwd: resolveRoot(), dryRun })
      if (result.errors) process.exit(1)
      if (dryRun && exitCode && result.changed > 0) process.exit(1)
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
  case 'adopt': {
    const r = scaffold({ target: singleTargetArg(cmd), mode: cmd })
    if (r.exitCode !== 0) process.exit(r.exitCode)
    break
  }
  case 'doctor': {
    const r = doctor({ target: singleTargetArg(cmd) })
    if (r.exitCode !== 0) process.exit(r.exitCode)
    break
  }
  default:
    console.error(`psycho-frame: 未知命令 "${cmd}"\n\n${USAGE}`)
    process.exit(2)
}
