// 文档门禁：链接与锚点可解析 + 决策记录结构与格式 + 任务头字段 + 常驻文档字数预算
// + 工作模式取值。零依赖、单语言、轻量解析。仓库根由调用方（cli.mjs）确定；封闭集合
// 与预算来自 <root>/.psycho-frame.json，缺省用内置值。
// 用法: import { verifyDocs } from './verify-docs.mjs'; verifyDocs(root)
import fs from 'node:fs'
import path from 'node:path'
import { readConfig, validateWorkMode } from './work-mode.mjs'

const LIFECYCLES = ['proposed', 'implemented', 'rejected', 'archived']
const DEFAULT_DECISION_CLASSES = ['feature', 'bug-fix', 'simplification', 'architecture', 'process', 'testing']
const DEFAULT_TASK_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'DEFERRED', 'DONE']
const ROOT_ALLOWLIST = new Set(['README.md', 'AGENTS.md'])
const STATUS_GRAMMAR = {
  proposed: /^Status: proposed$/,
  implemented: /^Status: implemented$/,
  rejected: /^Status: rejected — .+$/,
}
const REQUIRED = {
  proposed: ['## Problem', '## Proposal', '## Alternatives considered', '## Acceptance criteria', '## Risks'],
  implemented: ['## Problem', '## Decision', '## Alternatives considered', '## Consequences'],
  rejected: ['## Problem', '## Proposal', '## Alternatives considered'],
}
const BANNED_IMPLEMENTED = /^## (?:Proposal\b|Plan\b|Migration plan\b|Acceptance criteria\b)/i

function stringList(cfg, key, fallback, context) {
  const v = cfg[key]
  if (v === undefined) return fallback
  if (!Array.isArray(v) || v.some(x => typeof x !== 'string' || x.length === 0)) {
    throw new Error(`${context}: ${key} 必须为非空字符串数组`)
  }
  return [...new Set(v)]
}

function budgetsOf(cfg) {
  const v = cfg.budgets
  if (v === undefined) return null
  if (v === null || typeof v !== 'object' || Array.isArray(v)) {
    throw new Error('.psycho-frame.json: budgets 必须为 { 文件: 词数上限 } 对象')
  }
  return v
}

function ignorePatterns(cfg) {
  const v = cfg.ignore
  if (v === undefined) return []
  if (!Array.isArray(v) || v.some(x => typeof x !== 'string' || x.length === 0)) {
    throw new Error('.psycho-frame.json: ignore 必须为非空字符串数组（相对根的前缀）')
  }
  return v
}

export function verifyDocs(root) {
  const errors = []
  const cfg = readConfig(root)
  const decisionClasses = stringList(cfg, 'decisionClasses', DEFAULT_DECISION_CLASSES, '.psycho-frame.json')
  const taskStatuses = stringList(cfg, 'taskStatuses', DEFAULT_TASK_STATUSES, '.psycho-frame.json')
  const budgets = budgetsOf(cfg)
  const ignores = ignorePatterns(cfg)
  const mdFiles = []

  function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.git' || e.name === 'node_modules' || e.name === '.pnpm-store' || e.name === '.psycho-frame-upgrade' || e.name === '.worktrees') continue
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name.endsWith('.md')) mdFiles.push(p)
    }
  }
  const rel = f => path.relative(root, f).split(path.sep).join('/')
  // Windows 下 core.autocrlf 检出为 CRLF，行级解析前统一归一化行尾
  const read = f => fs.readFileSync(f, 'utf8').replaceAll('\r\n', '\n')

  walk(root)
  mdFiles.sort()

  const isIgnored = f => ignores.some(prefix => rel(f).startsWith(prefix))

  // ---------- 1) 链接与锚点 ----------

  const isExternal = url =>
    url.startsWith('//') || url.startsWith('/') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)
  const isWinDrive = url => /^[A-Za-z]:[\\/]/.test(url)

  function pathPart(url) {
    const raw = url.replace(/[#?].*$/, '')
    try { return decodeURIComponent(raw) } catch { return raw }
  }
  function fragmentPart(url) {
    const i = url.indexOf('#')
    if (i === -1) return null
    const raw = url.slice(i + 1).replace(/\?.*$/, '')
    try { return decodeURIComponent(raw) } catch { return raw }
  }

  /** GitHub 标题 slug 算法：小写、去掉字母/数字/下划线/空格/连字符以外的字符、空格转连字符。 */
  const githubSlug = heading =>
    heading.toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replaceAll(' ', '-')

  /** 标题行 → 渲染后的标题文本（剔除行内代码、链接、强调标记）；非标题行返回 null。 */
  function headingText(line) {
    const m = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line)
    if (m === null) return null
    let t = m[1]
    t = t.replace(/`[^`]*`/g, s => s.slice(1, -1))
    t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    t = t.replace(/([*_]{1,3})([^*_\n]+)\1/g, '$2')
    return t
  }

  /** 一个 Markdown 文件暴露的全部锚点：标题 slug（重名加 -1、-2…）与显式 <a id>。 */
  function documentAnchors(source) {
    const anchors = new Set()
    const seen = new Map()
    let inFence = false
    for (const line of source.split('\n')) {
      if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue }
      if (inFence) continue
      const text = headingText(line)
      if (text !== null) {
        const base = githubSlug(text)
        let bump = seen.get(base) ?? 0
        let slug = base
        while (anchors.has(slug)) { bump += 1; slug = `${base}-${bump}` }
        seen.set(base, bump)
        anchors.add(slug)
        continue
      }
      const html = line.replace(/<!--[\s\S]*?-->/g, '')
      for (const m of html.matchAll(/<a id="([^"]+)"/g)) anchors.add(m[1])
    }
    return anchors
  }

  const anchorCache = () => {
    const cache = new Map()
    return p => {
      let a = cache.get(p)
      if (a === undefined) { a = documentAnchors(read(p)); cache.set(p, a) }
      return a
    }
  }
  const anchorsOf = anchorCache()

  /** 非围栏代码行，且已剔除行内代码段的文本行数组。 */
  function proseLines(source) {
    const out = []
    let inFence = false
    for (const line of source.split('\n')) {
      if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; continue }
      if (!inFence) out.push(line.replace(/`[^`]*`/g, ''))
    }
    return out
  }

  for (const f of mdFiles) {
    const rp = rel(f)
    if (isIgnored(f)) continue
    // 归档记录冻结：出站链接与章节结构不复查（官方语义），仅头部由第 2 组检查。
    if (rp.startsWith('decisions/archived/')) continue

    const lines = proseLines(read(f))
    const dir = path.dirname(f)
    const checkTarget = (url, kind) => {
      if (isWinDrive(url)) {
        errors.push(`${rp}: ${kind}使用不可移植的绝对路径: ${url}`)
        return null
      }
      const decoded = pathPart(url)
      const resolved = decoded === '' ? f : path.resolve(dir, decoded)
      if (!fs.existsSync(resolved)) {
        errors.push(`${rp}: ${kind}目标不存在: ${url}`)
        return null
      }
      return resolved
    }
    const checkAnchor = (resolved, url, kind) => {
      const frag = fragmentPart(url)
      if (frag === null || !resolved.endsWith('.md')) return
      if (!anchorsOf(resolved).has(frag)) errors.push(`${rp}: ${kind}锚点不存在: ${url}`)
    }

    // 引用式定义：[id]: target
    const defs = new Map()
    for (const line of lines) {
      const m = /^\[([^\]]+)\]:\s*(\S+)/.exec(line)
      if (m === null) continue
      defs.set(m[1].toLowerCase(), m[2])
      if (isExternal(m[2])) continue
      const resolved = checkTarget(m[2], '引用定义')
      if (resolved !== null) checkAnchor(resolved, m[2], '引用定义')
    }
    // 行内链接与图片：[…](url)、![…](url)
    for (const line of lines) {
      for (const m of line.matchAll(/!?\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)) {
        if (isExternal(m[1])) continue
        const resolved = checkTarget(m[1], '链接')
        if (resolved !== null) checkAnchor(resolved, m[1], '链接')
      }
    }
    // 引用式调用：[text][id] 与 [id][]（id 缺失时回落到标签名）
    for (const line of lines) {
      for (const m of line.matchAll(/\[([^\]]+)\]\[([^\]]*)\]/g)) {
        const id = (m[2] === '' ? m[1] : m[2]).toLowerCase()
        if (!defs.has(id)) errors.push(`${rp}: 引用定义缺失: [${m[1]}][${m[2]}]`)
      }
    }
  }

  // ---------- 2) 决策记录：结构与格式 ----------

  function validDate(d) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
    if (m === null) return false
    const y = Number(m[1]); const mo = Number(m[2]); const day = Number(m[3])
    const dt = new Date(Date.UTC(y, mo - 1, day))
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === day
  }

  for (const f of mdFiles) {
    const rp = rel(f)
    if (isIgnored(f)) continue
    const segs = rp.split('/')
    if (segs[0] !== 'decisions' || segs.length < 3) continue
    const lifecycle = segs[1]
    if (!LIFECYCLES.includes(lifecycle)) {
      errors.push(`${rp}: 未知生命周期目录（封闭集合：${LIFECYCLES.join(' / ')}）`)
      continue
    }
    if (segs.length === 3 && ROOT_ALLOWLIST.has(segs[2])) continue
    if (segs.length !== 4) {
      errors.push(`${rp}: 路径必须为 decisions/{生命周期}/{类别}/yyyy-mm-dd-主题.md`)
      continue
    }
    const cls = segs[2]
    if (!decisionClasses.includes(cls)) {
      errors.push(`${rp}: 未知类别目录 "${cls}"（封闭集合：${decisionClasses.join(' / ')}）`)
      continue
    }
    const fm = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/.exec(segs[3])
    if (fm === null || !validDate(fm[1])) {
      errors.push(`${rp}: 文件名必须为 yyyy-mm-dd-主题.md（日期有效）`)
      continue
    }

    const src = read(f)
    const lines = src.split('\n')
    const headerErr = msg => errors.push(`${rp}: ${msg}`)
    if (!/^# Agent Note: \S/.test(lines[0] ?? '')) headerErr('第 1 行必须为 "# Agent Note: <标题>"')
    if (lines[1] !== '') headerErr('第 2 行必须为空行')
    const prose = proseLines(src)
    const statusLines = prose.filter(l => l.startsWith('Status:'))
    if (statusLines.length !== 1) headerErr(`"Status:" 行必须全文唯一（现有 ${statusLines.length} 处）`)

    if (lifecycle === 'archived') {
      // 冻结历史：保留 Status: implemented，紧接 Archived: 行；章节与链接不复查。
      if (lines[2] !== 'Status: implemented') headerErr('archived/ 记录第 3 行必须保留 "Status: implemented"')
      const am = /^Archived: (\d{4}-\d{2}-\d{2})$/.exec(lines[3] ?? '')
      if (am === null || !validDate(am[1])) headerErr('第 4 行必须为 "Archived: YYYY-MM-DD"（日期有效）')
      else if (am[1] < fm[1]) headerErr(`归档日期 ${am[1]} 早于文件名日期 ${fm[1]}`)
      if (lines[4] !== '') headerErr('第 5 行必须为空行')
      continue
    }

    const grammar = STATUS_GRAMMAR[lifecycle]
    if (!grammar.test(lines[2] ?? '')) headerErr(`第 3 行必须匹配 ${lifecycle} 的 Status 语法（${String(grammar)}）`)
    if (lines[3] !== '') headerErr('第 4 行必须为空行')
    const h2s = prose.filter(l => l.startsWith('## ')).map(l => l.trimEnd())
    if (h2s[0] !== '## Problem') headerErr(`首个章节必须为 "## Problem"（现有 ${JSON.stringify(h2s[0] ?? '<无>')}）`)
    for (const section of REQUIRED[lifecycle]) {
      if (!h2s.includes(section)) headerErr(`缺少章节 ${section}`)
    }
    if (lifecycle === 'implemented') {
      for (const h2 of h2s.filter(h => BANNED_IMPLEMENTED.test(h))) {
        headerErr(`"${h2}" 是提案期章节；implemented 记录只写现在时事实`)
      }
    }
  }

  // ---------- 3) 任务头字段 ----------

  for (const f of mdFiles) {
    const rp = rel(f)
    if (isIgnored(f)) continue
    const segs = rp.split('/')
    if (segs[0] !== 'tasks' || segs.length !== 2) continue
    if (ROOT_ALLOWLIST.has(segs[1])) continue
    const fm = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/.exec(segs[1])
    if (fm === null || !validDate(fm[1])) {
      errors.push(`${rp}: 任务文件名必须为 yyyy-mm-dd-task_key.md（日期有效）`)
      continue
    }
    const key = fm[2]
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(key)) {
      errors.push(`${rp}: task_key "${key}" 必须全小写连字符`)
      continue
    }
    const src = read(f)
    const field = name => new RegExp(`^- ${name}: (.+)$`, 'm').exec(src)?.[1]
    const taskKey = field('task_key')
    const status = field('status')
    if (taskKey === undefined) errors.push(`${rp}: 缺少头字段 - task_key:`)
    else if (taskKey !== key) errors.push(`${rp}: task_key "${taskKey}" 与文件名后缀 "${key}" 不一致`)
    if (status === undefined) errors.push(`${rp}: 缺少头字段 - status:`)
    else if (!taskStatuses.includes(status)) errors.push(`${rp}: status "${status}" 不在 {${taskStatuses.join(', ')}}`)
    if (field('created') === undefined) errors.push(`${rp}: 缺少头字段 - created:`)
    if (field('updated') === undefined) errors.push(`${rp}: 缺少头字段 - updated:`)
    if (field('report') === undefined) errors.push(`${rp}: 缺少头字段 - report:`)
  }

  // ---------- 4) 字数预算（配置提供 budgets 才启用；清单内文件缺失即失败） ----------

  if (budgets !== null) {
    for (const [file, ceiling] of Object.entries(budgets)) {
      if (!Number.isInteger(ceiling) || ceiling <= 0) {
        errors.push(`${file}: 预算必须为正整数（现为 ${String(ceiling)}）`)
        continue
      }
      const p = path.join(root, file)
      if (!fs.existsSync(p)) {
        errors.push(`${file}: 预算清单中的文件缺失，重命名/移动必须同步配置`)
        continue
      }
      const words = read(p).trim().split(/\s+/).filter(Boolean).length
      if (words > ceiling) errors.push(`${file}: ${words} 词，超出预算 ${ceiling}；先搬迁/精简，或显式提预算`)
    }
  }

  // ---------- 5) 工作模式取值（workMode 未配置即用内置默认，配置了必须取值封闭） ----------

  for (const e of validateWorkMode(cfg.workMode)) {
    errors.push(`.psycho-frame.json: ${e}`)
  }

  return { errors, count: mdFiles.length }
}
