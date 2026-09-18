// worktree 纪律：`task start` 一条命令开任务 worktree，`task check` 校验纪律；毁灭门禁复用检查结果。
// 布局与理由见 docs/cookbook/parallel-worktrees.md 与 decisions/implemented/process/2026-09-09-worktree-parallel.md。
// 零依赖；所有 git 调用都带 -C <root>，不依赖 cwd。
// 用法: import { startTask, checkWorktrees, listWorktrees, findTaskCard } from './worktree.mjs'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'

export const WORKTREE_DIR = '.worktrees'
export const TASK_KEY_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const MAX_GIT_OUTPUT = 16 * 1024 * 1024

function git(root, args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: MAX_GIT_OUTPUT,
    }).trim()
  } catch (e) {
    if (allowFail) return null
    const detail = String(e.stderr ?? e.message).trim() || `退出码 ${String(e.status)}`
    throw new Error(`git ${args.join(' ')}: ${detail}`)
  }
}

/** 仓库根（含 linked worktree）；非 git 仓库或 git 不可用时返回 null。 */
export function gitRoot(cwd) {
  return git(cwd, ['rev-parse', '--show-toplevel'], { allowFail: true })
}

/** 路径等价判断：macOS 上 /tmp 与 /private/tmp 这类软链会让 path.resolve 比较失效，故先 realpath。 */
export function samePath(a, b) {
  const real = p => {
    try {
      return fs.realpathSync(p)
    } catch {
      return path.resolve(p)
    }
  }
  return real(a) === real(b)
}

/** `git worktree list --porcelain` 解析结果；每项 { path, branch, bare, detached }。 */
export function listWorktrees(root) {
  const raw = git(root, ['worktree', 'list', '--porcelain'], { allowFail: true })
  if (raw === null) return []
  const out = []
  for (const block of raw.split('\n\n')) {
    if (block.trim() === '') continue
    const entry = { path: null, branch: null, bare: false, detached: false }
    for (const line of block.split('\n')) {
      const i = line.indexOf(' ')
      const key = i === -1 ? line : line.slice(0, i)
      const value = i === -1 ? '' : line.slice(i + 1)
      if (key === 'worktree') entry.path = value
      else if (key === 'branch') entry.branch = value.replace(/^refs\/heads\//, '')
      else if (key === 'bare') entry.bare = true
      else if (key === 'detached') entry.detached = true
    }
    if (entry.path !== null) out.push(entry)
  }
  return out
}

/** 当前 checkout 的分支名；detached 时返回 null。 */
export function currentBranch(root) {
  return git(root, ['symbolic-ref', '--quiet', '--short', 'HEAD'], { allowFail: true })
}

/** 任务卡：tasks/yyyy-mm-dd-<task_key>.md，返回 [{ file, key, status, text }]（相对根的路径）。 */
export function readTaskCards(root) {
  const dir = path.join(root, 'tasks')
  if (!fs.existsSync(dir)) return []
  const cards = []
  for (const name of fs.readdirSync(dir).sort()) {
    const m = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/.exec(name)
    if (m === null) continue
    const text = fs.readFileSync(path.join(dir, name), 'utf8')
    const field = key => new RegExp(`^- ${key}: (.+)$`, 'm').exec(text)?.[1]?.trim()
    cards.push({ file: `tasks/${name}`, key: m[2], status: field('status') ?? null, text })
  }
  return cards
}

export function findTaskCard(root, key) {
  return readTaskCards(root).find(c => c.key === key) ?? null
}

/** 某 worktree 解析后的 core.hooksPath（相对值按其根解析）；未设置返回 null。 */
export function hooksPathOf(worktreePath) {
  const raw = git(worktreePath, ['config', '--get', 'core.hooksPath'], { allowFail: true })
  if (raw === null || raw === '') return null
  return path.resolve(worktreePath, raw)
}

/** 在 .gitignore 中确认 `.worktrees/` 被忽略；write=true 时缺则补一行。 */
export function ensureWorktreesIgnored(root, { write = false } = {}) {
  const file = path.join(root, '.gitignore')
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  const ignored = text
    .split(/\r?\n/)
    .some(line => [WORKTREE_DIR, `${WORKTREE_DIR}/`].includes(line.trim()))
  if (ignored || !write) return { ignored, changed: false }
  const prefix = text === '' || text.endsWith('\n') ? text : `${text}\n`
  fs.writeFileSync(file, `${prefix}${WORKTREE_DIR}/\n`, 'utf8')
  return { ignored: true, changed: true }
}

/** 任务卡的合并视图：主 checkout 是权威状态，当前 checkout 覆盖它（新开的任务卡可能还没提交）。 */
function mergeCards(authoritative, overlay) {
  const map = new Map(authoritative.map(c => [c.key, c]))
  for (const card of overlay) map.set(card.key, card)
  return [...map.values()]
}

/** worktree 纪律检查：issues 是硬违规（毁灭门禁据此失败），notes 是提示。 */
export function checkWorktrees(root) {
  const issues = []
  const notes = []
  const worktrees = listWorktrees(root)
  const main = worktrees[0] ?? null
  const mainPath = main === null ? path.resolve(root) : path.resolve(main.path)
  const nestedBase = path.join(mainPath, WORKTREE_DIR) + path.sep
  const linked = worktrees.filter(w => path.resolve(w.path) !== mainPath)
  const nested = linked.filter(w => path.resolve(w.path).startsWith(nestedBase))
  const cards = samePath(mainPath, root)
    ? readTaskCards(root)
    : mergeCards(readTaskCards(mainPath), readTaskCards(root))

  if (!ensureWorktreesIgnored(mainPath).ignored) {
    issues.push(`${WORKTREE_DIR}/ 未被 .gitignore 忽略：门禁与检索会扫进嵌套副本（psycho-frame task start 会自动补上）`)
  }

  const byKey = new Map(cards.map(c => [c.key, c]))
  const worktreeKeys = new Set()
  for (const w of nested) {
    const key = path.basename(w.path)
    worktreeKeys.add(key)
    // 任务卡可能还没提交（task start 刚在 worktree 内建好），两侧都认，避免误判孤儿。
    const card = byKey.get(key) ?? findTaskCard(w.path, key)
    if (card === null || card === undefined) {
      issues.push(`${WORKTREE_DIR}/${key}: 没有对应的任务卡（tasks/*-${key}.md）；孤儿 worktree 用 git worktree remove 清理`)
      continue
    }
    if (card.status === 'DONE') {
      issues.push(`${WORKTREE_DIR}/${key}: 任务 ${key} 已 DONE 仍留着 worktree；合流后 git worktree remove ${WORKTREE_DIR}/${key}`)
    }
  }

  for (const card of cards) {
    if (card.status === 'IN_PROGRESS' && !worktreeKeys.has(card.key)) {
      issues.push(`${card.file}: 任务 ${card.key} 为 IN_PROGRESS 但没有 worktree；先跑 psycho-frame task start ${card.key}`)
    }
    if (['BLOCKED', 'DEFERRED'].includes(card.status) && !/原因/.test(card.text)) {
      issues.push(`${card.file}: ${card.status} 必须写明原因`)
    }
  }

  if (main !== null && main.branch !== null && byKey.has(main.branch)) {
    issues.push(`${mainPath}: 根 checkout 检出了任务分支 ${main.branch}；任务分支只能在其 worktree 内检出，根 checkout 只做合流`)
  }

  const seen = new Map()
  for (const w of nested) {
    const key = path.basename(w.path)
    const hooks = hooksPathOf(w.path)
    if (hooks === null) {
      issues.push(`${WORKTREE_DIR}/${key}: 未设置 worktree 级 core.hooksPath，hook 会与其他 worktree 互相覆盖（见 docs/cookbook/parallel-worktrees.md）`)
      continue
    }
    const prev = seen.get(hooks)
    if (prev !== undefined) {
      issues.push(`${WORKTREE_DIR}/${key}: core.hooksPath 与 ${prev} 相同（${hooks}），未隔离`)
    } else {
      seen.set(hooks, `${WORKTREE_DIR}/${key}`)
    }
  }

  if (linked.length > nested.length) {
    notes.push(`有 ${linked.length - nested.length} 个 worktree 不在 ${WORKTREE_DIR}/ 下；task check 只管嵌套布局`)
  }
  return { issues, notes, worktrees, cards }
}

export const REPORT_SKELETON = key => `# ${key} 执行报告

- task_key: ${key}
- 状态: IN_PROGRESS

## 1. 改了哪些文件

（实现后补齐）

## 2. 实现了什么

（实现后补齐）

## 3. 跑了哪些命令

（实现后补齐）

## 4. 验证结果

（实现后补齐）

## 5. 文档与决策是否同步

（实现后补齐）

## 6. 合流状态

未合流：分支 \`${key}\`。

## 7. 还剩什么阻塞

无。
`

export const TASK_CARD_SKELETON = ({ key, title, date }) => `# ${title}

- task_key: ${key}
- status: IN_PROGRESS
- created: ${date}
- updated: ${date}
- report: [reports/${key}.md](../reports/${key}.md)

## 范围

本次包含：（待补充）

本次不包含：（待补充）

## 进度

- [IN_PROGRESS] ${date} worktree \`${key}\` 内开工。
`

/** 集成分支：优先 main，其次 master；都不存在返回 null。 */
function integrationBranch(root) {
  for (const name of ['main', 'master']) {
    if (git(root, ['rev-parse', '--verify', '--quiet', `refs/heads/${name}`], { allowFail: true }) !== null) return name
  }
  return null
}

/** 当前 checkout 是否为 linked worktree（嵌套副本）；是则不该在它里面再开 worktree。 */
export function isLinkedWorktree(root) {
  const common = git(root, ['rev-parse', '--path-format=absolute', '--git-common-dir'], { allowFail: true })
  const dir = git(root, ['rev-parse', '--path-format=absolute', '--git-dir'], { allowFail: true })
  if (common === null || dir === null) return false
  try {
    return fs.realpathSync(common) !== fs.realpathSync(dir)
  } catch {
    return false
  }
}

/**
 * 一条命令开任务 worktree：建分支与 .worktrees/<key>、登记任务卡与报告占位、隔离 worktree 级 hooks。
 * 幂等：worktree 已存在且分支正确时直接返回 ok；参数非法由调用方先行拦截。
 */
export function startTask({
  root,
  key,
  base,
  title = key,
  date = new Date().toISOString().slice(0, 10),
  stdout = console.log,
}) {
  const fail = message => ({ ok: false, exitCode: 1, errors: [message] })
  if (!TASK_KEY_RE.test(key)) {
    return { ok: false, exitCode: 2, errors: [`task_key "${key}" 必须全小写连字符（如 destroy-gate）`] }
  }
  if (gitRoot(root) === null) return fail(`${root} 不是 git 仓库`)
  if (isLinkedWorktree(root)) {
    const mainPath = listWorktrees(root)[0]?.path ?? root
    return fail(`${root} 是 linked worktree；任务 worktree 只能从主 checkout 开：cd ${mainPath} 后重跑`)
  }
  if (!fs.existsSync(path.join(root, 'tasks'))) {
    return fail(`${root} 没有 tasks/ 目录；先 psycho-frame init 或 adopt 接入骨架`)
  }

  const worktreePath = path.join(root, WORKTREE_DIR, key)
  const existing = listWorktrees(root).find(w => samePath(w.path, worktreePath))
  if (existing !== undefined) {
    if (existing.branch !== key) {
      return fail(`${WORKTREE_DIR}/${key} 已存在但检出的是 ${String(existing.branch)}；换一个 task_key 或先清理`)
    }
    stdout(`[skip] ${WORKTREE_DIR}/${key} 已存在（分支 ${key}）`)
    return { ok: true, exitCode: 0, worktree: worktreePath, branch: key, base: null, created: false }
  }

  const resolvedBase = base ?? integrationBranch(root)
  if (resolvedBase === null) return fail('找不到 main/master 作为基线；用 --base <ref> 显式指定')
  if (git(root, ['rev-parse', '--verify', '--quiet', `${resolvedBase}^{commit}`], { allowFail: true }) === null) {
    return fail(`--base ${resolvedBase} 无法解析为 commit`)
  }
  if (git(root, ['rev-parse', '--verify', '--quiet', `refs/heads/${key}`], { allowFail: true }) !== null) {
    return fail(`分支 ${key} 已存在但没有对应 worktree；先 git branch -D ${key} 或换 task_key`)
  }

  const ignore = ensureWorktreesIgnored(root, { write: true })
  if (ignore.changed) stdout(`[write] .gitignore += ${WORKTREE_DIR}/`)

  try {
    git(root, ['worktree', 'add', path.join(WORKTREE_DIR, key), '-b', key, resolvedBase])
  } catch (e) {
    return fail(e.message)
  }
  stdout(`[write] ${WORKTREE_DIR}/${key} ← 分支 ${key}（基线 ${resolvedBase}）`)

  git(root, ['config', 'extensions.worktreeConfig', 'true'])
  const gitDir = path.resolve(worktreePath, git(worktreePath, ['rev-parse', '--git-dir']))
  const hooksDir = path.join(gitDir, `hooks-${key}`)
  fs.mkdirSync(hooksDir, { recursive: true })
  git(worktreePath, ['config', '--worktree', 'core.hooksPath', hooksDir])
  stdout(`[write] ${WORKTREE_DIR}/${key} core.hooksPath = ${hooksDir}`)

  const cardRel = `tasks/${date}-${key}.md`
  let wroteCard = false
  if (findTaskCard(worktreePath, key) === null) {
    const cardPath = path.join(worktreePath, cardRel)
    fs.mkdirSync(path.dirname(cardPath), { recursive: true })
    fs.writeFileSync(cardPath, TASK_CARD_SKELETON({ key, title, date }), 'utf8')
    wroteCard = true
    stdout(`[write] ${cardRel}`)
  }
  const reportRel = `reports/${key}.md`
  if (!fs.existsSync(path.join(worktreePath, reportRel))) {
    fs.mkdirSync(path.join(worktreePath, 'reports'), { recursive: true })
    fs.writeFileSync(path.join(worktreePath, reportRel), REPORT_SKELETON(key), 'utf8')
    stdout(`[write] ${reportRel}`)
  }

  stdout('')
  stdout(`下一步：cd ${WORKTREE_DIR}/${key}`)
  if (wroteCard) stdout(`  1. 补齐 ${cardRel} 的「范围」，再开工（任务状态真源在 tasks/）。`)
  stdout(`  2. 开工前跑一次 psycho-frame mode：destroy=on 时 verify 需要显式 --base。`)
  stdout(`  3. 提交信息必须含 ${key}；合流按 workMode.merge，合流后 git worktree remove ${WORKTREE_DIR}/${key}。`)
  return { ok: true, exitCode: 0, worktree: worktreePath, branch: key, base: resolvedBase, created: true, card: cardRel }
}
