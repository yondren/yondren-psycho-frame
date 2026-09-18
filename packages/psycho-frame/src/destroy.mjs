// 毁灭模式（NT-D）门禁：workMode.destroy=on 时 psycho-frame verify 追加的硬检查。
// 语义与清单见 docs/modes.md；本模块只读 git 与配置事实，唯一副作用是按 destroyChecks 跑项目声明的
// 全量矩阵命令。凭据命中只报路径与行号，绝不回显内容。
// 用法: import { destroyGate } from './destroy.mjs'; destroyGate(root, { base })
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'
import { readConfig } from './work-mode.mjs'
import { collectChangeScope, changedPaths } from './change-scope.mjs'
import { checkWorktrees, findTaskCard, currentBranch, readTaskCards } from './worktree.mjs'

const MAX_GIT_OUTPUT = 16 * 1024 * 1024
const MAX_SCAN_BYTES = 2 * 1024 * 1024
// 嵌套调用标记：verify → destroyChecks → verify 时必须跳过矩阵，否则自递归。
export const NESTED_ENV = 'PSYCHO_FRAME_DESTROY_CHECK'
export const ALLOW_SECRET_MARKER = 'psycho-frame:allow-secret'

/** 凭据模式表：命中只报模式名与位置，不回显命中文本。 */
const SECRET_PATTERNS = [
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ['GitHub 细粒度 token', /\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
  ['AWS access key id', /\bAKIA[0-9A-Z]{16}\b/],
  ['OpenAI 风格密钥', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['PEM 私钥', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
]

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: MAX_GIT_OUTPUT,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
  })
}

/** 改动面上的文本文件扫凭据；二进制、超大文件与删除的文件跳过。 */
export function scanSecrets(root, files) {
  const errors = []
  for (const rel of files) {
    const abs = path.join(root, rel)
    let buf
    try {
      buf = fs.readFileSync(abs)
    } catch {
      continue
    }
    if (buf.length > MAX_SCAN_BYTES || buf.includes(0)) continue
    const lines = buf.toString('utf8').split('\n')
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]
      if (line.includes(ALLOW_SECRET_MARKER)) continue
      for (const [name, re] of SECRET_PATTERNS) {
        if (re.test(line)) {
          errors.push(`${rel}:${i + 1}: 疑似${name}（内容不回显）；确认是假阳性时在该行加 ${ALLOW_SECRET_MARKER}`)
        }
      }
    }
  }
  return errors
}

/** 项目声明的毁灭矩阵命令；未配置返回 []，配置非法抛错。 */
export function destroyChecks(config) {
  const v = config.destroyChecks
  if (v === undefined) return []
  if (!Array.isArray(v) || v.some(x => typeof x !== 'string' || x.trim() === '')) {
    throw new Error('.psycho-frame.json: destroyChecks 必须为非空字符串数组（每条是要执行的命令）')
  }
  for (const cmd of v) {
    if (/psycho-frame\s+verify|\bverify:docs\b/.test(cmd)) {
      throw new Error(`.psycho-frame.json: destroyChecks 不能包含 verify 自身（会自递归）：${cmd}`)
    }
  }
  return v
}

/** 跑一条矩阵命令；返回 { command, ok, detail }，失败只报退出码，不回显全部输出。 */
export function runCheck(root, command) {
  const win = process.platform === 'win32'
  const shell = win ? (process.env.ComSpec ?? 'cmd.exe') : (process.env.SHELL ?? '/bin/sh')
  const shellArgs = win ? ['/d', '/s', '/c', command] : ['-c', command]
  try {
    execFileSync(shell, shellArgs, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: MAX_GIT_OUTPUT,
      env: { ...process.env, [NESTED_ENV]: '1' },
    })
    return { command, ok: true }
  } catch (e) {
    const tail = String(e.stdout ?? '').trim().split('\n').slice(-5).join('\n')
    return { command, ok: false, detail: `退出码 ${String(e.status ?? '?')}${tail === '' ? '' : `；末尾输出：\n${tail}`}` }
  }
}

/** 改动面上 base..HEAD 的非合并提交（[{sha, subject, body}]）；无提交返回 []。 */
function commitsSince(root, mergeBaseSha) {
  let raw = ''
  try {
    raw = git(root, ['log', '--no-merges', '--format=%H%x1f%s%x1f%b%x1e', `${mergeBaseSha}..HEAD`])
  } catch {
    return []
  }
  const out = []
  for (const block of raw.split('\x1e')) {
    if (block.trim() === '') continue
    const [sha, subject = '', body = ''] = block.split('\x1f')
    out.push({ sha: sha.trim(), subject, body })
  }
  return out
}

/** 当前任务卡：分支名优先，其次唯一 IN_PROGRESS 任务；无法确定返回 null。 */
export function activeTask(root) {
  const branch = currentBranch(root)
  if (branch !== null) {
    const byBranch = findTaskCard(root, branch)
    if (byBranch !== null) return byBranch
  }
  const active = readTaskCards(root).filter(c => c.status === 'IN_PROGRESS')
  return active.length === 1 ? active[0] : null
}

/**
 * 毁灭门禁：worktree 纪律 + 任务绑定 + 显式 base + 决策记录 + 提交含 task_key + 凭据扫描 + 全量矩阵。
 * 返回 { errors, checks, notes }；errors 非空即门禁失败。
 */
export function destroyGate(root, { base } = {}) {
  const errors = []
  const notes = []
  const checks = []

  let config
  try {
    config = readConfig(root)
  } catch (e) {
    return { errors: [e.message], checks, notes }
  }

  const tree = checkWorktrees(root)
  errors.push(...tree.issues)
  notes.push(...tree.notes)

  const task = activeTask(root)
  if (task === null) {
    errors.push('毁灭模式要求改动绑定唯一任务：把当前分支名取成 task_key，或只留一个 IN_PROGRESS 任务卡')
  } else if (!['IN_PROGRESS', 'DONE'].includes(task.status)) {
    errors.push(`${task.file}: 当前任务状态为 ${String(task.status)}，毁灭模式下不允许提交（先解除 BLOCKED/DEFERRED）`)
  }

  if (base === undefined || base === null || base === '') {
    errors.push('毁灭模式要求显式 --base <父分支 ref>：psycho-frame verify --base main（绝不猜 origin/<branch>）')
    return { errors, checks, notes }
  }

  let report
  try {
    report = collectChangeScope({ root, base })
  } catch (e) {
    errors.push(`毁灭模式无法读取改动面: ${e.message}`)
    return { errors, checks, notes }
  }
  const files = changedPaths(report)

  const records = files.filter(f => /^decisions\/(implemented|proposed)\//.test(f))
  if (records.length === 0) {
    errors.push(`毁灭模式要求改动面里至少新增或更新一条决策记录（decisions/implemented|proposed/）；当前改动面 ${files.length} 个文件，微小改动豁免在毁灭模式下不适用`)
  }

  if (task !== null) {
    for (const commit of commitsSince(root, report.resolved.mergeBaseSha)) {
      if (!`${commit.subject}\n${commit.body}`.includes(task.key)) {
        errors.push(`提交 ${commit.sha.slice(0, 8)} "${commit.subject}" 不含 task_key ${task.key}`)
      }
    }
  }

  errors.push(...scanSecrets(root, files))

  let commands
  try {
    commands = destroyChecks(config)
  } catch (e) {
    errors.push(e.message)
    return { errors, checks, notes }
  }
  if (process.env[NESTED_ENV] === '1') {
    if (commands.length > 0) notes.push('已在毁灭矩阵命令内，跳过 destroyChecks 以免自递归')
  } else {
    for (const command of commands) {
      const result = runCheck(root, command)
      checks.push(result)
      if (!result.ok) errors.push(`毁灭矩阵失败：${command}（${String(result.detail)}）`)
    }
  }

  return { errors, checks, notes }
}
