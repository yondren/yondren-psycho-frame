// 骨架升级：把 <root> 下随模板分发的骨架文件一键同步到当前模板版本，用户无需手工合并。
// 策略（模板优先）：缺文件补齐；与模板一致跳过；不一致的普通文件更新为模板版，本地版本
// 先备份到 .psycho-frame-upgrade/<时间戳>/；配置做增量合并——.psycho-frame.json 保留用户
// 已有键、只补模板新增键，package.json 只补模板缺失的 scripts，.gitignore 只补模板新增行，
// 用户值永不覆盖；README.md 属用户内容，与模板不同时保留本地。--dry-run 只预览不落盘。
// 前置校验：目标须存在、为目录且带骨架特征（AGENTS.md / .psycho-frame.json / package.json /
// docs 之一），否则中止并提示。用户自有内容（decisions/tasks/reports 记录、自建文档页）
// 不在模板内，不受影响。
// 用法: import { run } from './upgrade.mjs'; run({ target, dryRun, cwd })
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { walkFiles, sanitizeName } from './init.mjs'

const templateRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'template')

// 模板里的 gitignore（无点）在写入宿主时映射为 .gitignore；npm/pnpm pack 与 npm install
// 会丢弃/改名名为 .gitignore 的文件，故模板不存该名。
const RENAMES = { gitignore: '.gitignore' }

function timestamp() {
  return new Date().toISOString().replace(/[:T]/g, '-').replace(/\..+$/, '')
}

/** 键级合并：保留 local 已有键，补入 template 缺失键；返回 { text, added } 或 { error }。 */
function mergeConfig(localText, templateText) {
  let local = null
  let tpl = null
  try {
    local = JSON.parse(localText)
  } catch (e) {
    return { error: `JSON 解析失败: ${e.message}` }
  }
  try {
    tpl = JSON.parse(templateText)
  } catch (e) {
    return { error: `模板 JSON 解析失败: ${e.message}` }
  }
  if (local === null || typeof local !== 'object' || Array.isArray(local)) {
    return { error: '顶层必须为对象' }
  }
  const added = []
  for (const [k, v] of Object.entries(tpl)) {
    if (!(k in local)) {
      local[k] = v
      added.push(k)
    }
  }
  return { text: JSON.stringify(local, null, 2) + '\n', added }
}

/** package.json 例外：只补模板缺失的 scripts，其余键一律不动。 */
function mergeScripts(localText, templateText) {
  let local = null
  let tpl = null
  try {
    local = JSON.parse(localText)
  } catch (e) {
    return { error: `JSON 解析失败: ${e.message}` }
  }
  try {
    tpl = JSON.parse(templateText)
  } catch (e) {
    return { error: `模板 JSON 解析失败: ${e.message}` }
  }
  if (local === null || typeof local !== 'object' || Array.isArray(local)) {
    return { error: '顶层必须为对象' }
  }
  const scripts = local.scripts ?? {}
  const added = []
  for (const [k, v] of Object.entries(tpl.scripts ?? {})) {
    if (!(k in scripts)) {
      scripts[k] = v
      added.push(k)
    }
  }
  if (added.length > 0) local.scripts = scripts
  return { text: JSON.stringify(local, null, 2) + '\n', added }
}

export function run({ target = '.', dryRun = false, cwd = process.cwd() }) {
  const root = path.resolve(cwd, target)
  if (!fs.existsSync(root)) {
    console.error(`upgrade 中止：目录不存在 ${root}`)
    return { changed: 0, errors: true }
  }
  if (!fs.statSync(root).isDirectory()) {
    console.error(`upgrade 中止：目标不是目录 ${root}`)
    return { changed: 0, errors: true }
  }
  const markers = ['AGENTS.md', '.psycho-frame.json', 'package.json', 'docs']
  if (!markers.some(m => fs.existsSync(path.join(root, m)))) {
    console.error(`upgrade 中止：${root} 不像骨架项目（缺少 ${markers.join(' / ')} 之一）；新项目用 psycho-frame init，旧项目先 psycho-frame adopt`)
    return { changed: 0, errors: true }
  }
  const projectName = sanitizeName(path.basename(root))
  const files = walkFiles(templateRoot).sort()
  const backupRoot = path.join(root, '.psycho-frame-upgrade', timestamp())
  const changes = []
  const errors = []
  const kept = []
  let backedUp = 0

  for (const rel of files) {
    const tpl = fs.readFileSync(path.join(templateRoot, rel), 'utf8').replaceAll('{{PROJECT_NAME}}', projectName)
    const destRel = RENAMES[rel] ?? rel
    const dest = path.join(root, destRel)
    if (!fs.existsSync(dest)) {
      changes.push({ rel: destRel, action: '新增' })
      if (!dryRun) {
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.writeFileSync(dest, tpl)
      }
      continue
    }
    const local = fs.readFileSync(dest, 'utf8')
    if (local === tpl) continue
    if (rel === 'README.md') {
      kept.push(destRel)
      continue
    }
    if (rel === '.psycho-frame.json') {
      const m = mergeConfig(local, tpl)
      if (m.error) {
        errors.push(`.psycho-frame.json: ${m.error}（跳过合并，请先修复）`)
        continue
      }
      if (m.added.length === 0) continue
      changes.push({ rel: destRel, action: `配置合并：补入键 ${m.added.join('、')}` })
      if (!dryRun) fs.writeFileSync(dest, m.text)
      continue
    }
    if (rel === 'package.json') {
      const m = mergeScripts(local, tpl)
      if (m.error) {
        errors.push(`package.json: ${m.error}（跳过合并，请先修复）`)
        continue
      }
      if (m.added.length === 0) continue
      changes.push({ rel: destRel, action: `配置合并：补入脚本 ${m.added.join('、')}` })
      if (!dryRun) fs.writeFileSync(dest, m.text)
      continue
    }
    if (rel === 'gitignore') {
      const localLines = new Set(local.split('\n'))
      const missing = tpl.split('\n').filter(l => !localLines.has(l))
      if (missing.length === 0) continue
      changes.push({ rel: destRel, action: `配置合并：补入 ${missing.length} 行` })
      if (!dryRun) {
        const merged = (local.endsWith('\n') ? local : local + '\n') + missing.join('\n') + '\n'
        fs.writeFileSync(dest, merged)
      }
      continue
    }
    changes.push({ rel: destRel, action: '更新（本地改动已备份）' })
    if (!dryRun) {
      const bak = path.join(backupRoot, destRel)
      fs.mkdirSync(path.dirname(bak), { recursive: true })
      fs.writeFileSync(bak, local)
      fs.writeFileSync(dest, tpl)
      backedUp += 1
    }
  }

  for (const e of errors) console.error(`[error] ${e}`)
  if (errors.length > 0 && changes.length === 0) {
    console.log('upgrade 结束：存在错误，未变更任何文件')
  } else if (changes.length === 0) {
    console.log(`upgrade 完成：骨架已是最新，无需变更（模板文件 ${files.length} 个）`)
  } else if (dryRun) {
    console.log(`upgrade --dry-run：以下 ${changes.length} 个文件将被变更：`)
    for (const c of changes) console.log(`  [${c.action}] ${c.rel}`)
  } else {
    const backupNote = backedUp > 0 ? `；被覆盖的本地改动备份在 ${path.relative(root, backupRoot)}` : ''
    console.log(`upgrade 完成：${changes.length} 个文件已变更${backupNote}`)
    for (const c of changes) console.log(`  [${c.action}] ${c.rel}`)
    console.log('建议运行 pnpm run doctor 与 pnpm verify:docs 确认')
  }
  for (const k of kept) console.log(`  [保留本地（README 属用户内容，不覆盖）] ${k}`)
  return { changed: changes.length, errors: errors.length > 0 }
}
