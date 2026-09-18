// cookbook 脚手架：`cookbook new` 生成 docs/cookbook/<slug>.md，并登记索引与字数预算。
// 判定标准与五问（什么时候该写 cookbook、写到哪一层）的唯一家在 docs/cookbook/authoring-cookbooks.md。
// 零依赖；仓库根由调用方（cli.mjs）确定。
// 用法: import { newCookbook, SLUG_RE } from './cookbook.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { readConfig, configPath } from './work-mode.mjs'

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const DEFAULT_BUDGET = 400
const INDEX_REL = 'docs/cookbook/README.md'

/** cookbook 骨架：与仓库既有 cookbook 同构（编号步骤 + 验证清单）。 */
export function cookbookText({ title }) {
  return `# ${title}

<一句话：解决什么重复出现的痛，做完之后什么变简单了。>

## 1. 触发场景

## 2. 前置

## 3. 步骤

## 4. 失败与回退

## 验证清单

-
`
}

/** 在 cookbook 索引里追加一行；已登记则不动。返回 { changed }。 */
function registerIndex(root, slug, title) {
  const file = path.join(root, INDEX_REL)
  if (!fs.existsSync(file)) return { changed: false, reason: 'missing-index' }
  const text = fs.readFileSync(file, 'utf8')
  if (text.includes(`](${slug}.md)`)) return { changed: false }
  const entry = `- [${slug}.md](${slug}.md) — ${title}`
  const lines = text.split('\n')
  let last = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (/^- \[[^\]]+\]\([^)]+\.md\)/.test(lines[i])) last = i
  }
  if (last === -1) fs.writeFileSync(file, `${text.trimEnd()}\n\n${entry}\n`, 'utf8')
  else {
    lines.splice(last + 1, 0, entry)
    fs.writeFileSync(file, lines.join('\n'), 'utf8')
  }
  return { changed: true }
}

/** 给新 cookbook 登记字数预算；配置没开 budgets 或已登记则不动。返回 { changed, reason }。 */
function addBudget(root, rel, budget) {
  const cfg = readConfig(root)
  if (cfg.budgets === undefined) return { changed: false, reason: 'no-budgets' }
  if (cfg.budgets === null || typeof cfg.budgets !== 'object' || Array.isArray(cfg.budgets)) {
    throw new Error('.psycho-frame.json: budgets 必须为 { 文件: 字数上限 } 对象')
  }
  if (cfg.budgets[rel] !== undefined) return { changed: false }
  cfg.budgets[rel] = budget
  fs.writeFileSync(configPath(root), `${JSON.stringify(cfg, null, 2)}\n`, 'utf8')
  return { changed: true }
}

/**
 * 新增一个 cookbook：写骨架、登记索引、登记预算。缺 docs/cookbook/ 时失败；
 * 文件已存在时幂等跳过（只补索引与预算缺项）。
 */
export function newCookbook({
  root,
  slug,
  title = slug,
  budget = DEFAULT_BUDGET,
  stdout = console.log,
}) {
  if (!SLUG_RE.test(slug)) {
    return { ok: false, exitCode: 2, errors: [`slug "${slug}" 必须全小写连字符（如 shared-toolchain）`] }
  }
  if (!Number.isInteger(budget) || budget <= 0) {
    return { ok: false, exitCode: 2, errors: [`--budget 必须为正整数（现为 ${String(budget)}）`] }
  }
  const dir = path.join(root, 'docs', 'cookbook')
  if (!fs.existsSync(dir)) {
    return { ok: false, exitCode: 1, errors: [`${root} 没有 docs/cookbook/；先 psycho-frame init 或 adopt 接入骨架`] }
  }
  const cleanTitle = title.replace(/\s*\n\s*/g, ' ').trim() || slug
  const rel = `docs/cookbook/${slug}.md`
  const file = path.join(root, rel)
  let created = false
  if (fs.existsSync(file)) stdout(`[skip] ${rel} 已存在`)
  else {
    fs.writeFileSync(file, cookbookText({ title: cleanTitle }), 'utf8')
    created = true
    stdout(`[write] ${rel}`)
  }

  const index = registerIndex(root, slug, cleanTitle)
  if (index.changed) stdout(`[write] ${INDEX_REL} += ${slug}.md`)
  else if (index.reason === 'missing-index') stdout(`[note] 没有 ${INDEX_REL}，跳过索引登记`)

  let budgetResult
  try {
    budgetResult = addBudget(root, rel, budget)
  } catch (e) {
    return { ok: false, exitCode: 1, errors: [e.message], created, rel }
  }
  if (budgetResult.changed) stdout(`[write] .psycho-frame.json budgets["${rel}"] = ${budget}`)
  else if (budgetResult.reason === 'no-budgets') stdout('[note] .psycho-frame.json 未启用 budgets，跳过预算登记')

  stdout('')
  stdout(`下一步：按 docs/cookbook/${slug}.md 的小节填步骤与验证命令，再跑 psycho-frame verify。`)
  stdout('判定标准与五问见 docs/cookbook/authoring-cookbooks.md；重复出现的痛点才写 cookbook。')
  return { ok: true, exitCode: 0, created, rel, budget: budgetResult.changed ? budget : null }
}
