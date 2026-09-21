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
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { walkFiles, sanitizeName, isFrameworkRepo } from './init.mjs'

import { mergeCookbookIndex } from './template-merge.mjs'

const templateRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'template')

// 模板里的 gitignore（无点）在写入宿主时映射为 .gitignore；npm/pnpm pack 与 npm install
// 会丢弃/改名名为 .gitignore 的文件，故模板不存该名。
const RENAMES = { gitignore: '.gitignore' }

function timestamp() {
  return new Date().toISOString().replace(/[:T]/g, '-').replace(/\..+$/, '')
}

const isPlainObject = v => v !== null && typeof v === 'object' && !Array.isArray(v)

/**
 * 键级合并：保留 local 已有键与值，补入 template 缺失键。两侧同为普通对象时再下探一层补
 * 缺失子键（如 budgets 的新条目），仍不覆盖任何用户值；数组不合并。
 * 返回 { text, added } 或 { error }；added 用 `k` / `k.sub` 标注补入位置。
 */
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
  if (!isPlainObject(local)) {
    return { error: '顶层必须为对象' }
  }
  const added = []
  for (const [k, v] of Object.entries(tpl)) {
    if (!(k in local)) {
      local[k] = v
      added.push(k)
      continue
    }
    if (!isPlainObject(v) || !isPlainObject(local[k])) continue
    for (const [sub, subValue] of Object.entries(v)) {
      if (sub in local[k]) continue
      local[k][sub] = subValue
      added.push(`${k}.${sub}`)
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
  if (!isPlainObject(scripts)) return { error: 'scripts 必须为对象' }
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

/** linked worktree 标识：git-dir 与 git-common-dir 不同即非根 checkout；非 git 目录返回 false。 */
function isLinkedWorktree(root) {
  try {
    const [gitDir, commonDir] = execFileSync(
      'git',
      ['-C', root, 'rev-parse', '--git-dir', '--git-common-dir'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim().split('\n')
    if (gitDir === undefined || commonDir === undefined) return false
    const abs = p => fs.realpathSync(path.resolve(root, p))
    return abs(gitDir) !== abs(commonDir)
  } catch {
    return false
  }
}


/** Reject linked targets (including dangling links) and unexpected node types before any mutation. */
function checkTargetPath(root, rel, directory = false) {
  let current = root
  const segments = rel.split(path.sep)
  for (const [i, segment] of segments.entries()) {
    current = path.join(current, segment)
    let stat
    try { stat = fs.lstatSync(current) } catch (e) { if (e.code === 'ENOENT') continue; throw e }
    if (stat.isSymbolicLink()) throw new Error(rel + ': 符号链接目标拒绝升级，请改用项目内普通文件')
    const last = i === segments.length - 1
    if (!last || directory) {
      if (!stat.isDirectory()) throw new Error(rel + ': 父路径不是目录')
    } else if (!stat.isFile() || stat.nlink > 1) {
      throw new Error(rel + ': 目标必须为未共享硬链接的普通文件')
    }
  }
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
  if (isFrameworkRepo(root)) {
    console.error(`upgrade 中止：${root} 是框架源码仓库（模板源头），模板升级会覆盖其富文档；请在消费方项目内运行`)
    return { changed: 0, errors: true }
  }
  if (isLinkedWorktree(root)) {
    console.error(`upgrade 中止：${root} 是 linked worktree；骨架升级改的是全仓库共享的根文件，请在根 checkout 原地运行（git worktree list 查看根路径）`)
    return { changed: 0, errors: true }
  }
  const markers = ['AGENTS.md', '.psycho-frame.json', 'package.json', 'docs']
  if (!markers.some(m => fs.existsSync(path.join(root, m)))) {
    console.error(`upgrade 中止：${root} 不像骨架项目（缺少 ${markers.join(' / ')} 之一）；新项目用 psycho-frame init，旧项目先 psycho-frame adopt`)
    return { changed: 0, errors: true }
  }
  const projectName = sanitizeName(path.basename(root))
  const files = walkFiles(templateRoot).sort()
  const changes = [], kept = []
  let backupRoot = null, applied = 0
  try {
    // Complete structural and content preflight, including backup ownership, before writing.
    checkTargetPath(root, '.psycho-frame-upgrade', true)
    for (const rel of files) checkTargetPath(root, RENAMES[rel] ?? rel)
    for (const rel of files) {
      const destRel = RENAMES[rel] ?? rel, dest = path.join(root, destRel)
      const tpl = fs.readFileSync(path.join(templateRoot, rel), 'utf8').replaceAll('{{PROJECT_NAME}}', projectName)
      const local = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : null
      let next = tpl, action = local === null ? '新增' : '更新（备份本地）'
      if (local === tpl) continue
      if (local !== null) {
        if (rel === 'README.md') { kept.push(destRel); continue }
        if (rel === '.psycho-frame.json' || rel === 'package.json') {
          const merged = rel === '.psycho-frame.json' ? mergeConfig(local, tpl) : mergeScripts(local, tpl)
          if (merged.error) throw new Error(destRel + ': ' + merged.error)
          if (!merged.added.length) continue
          next = merged.text
          action = '配置合并'
        } else if (rel === 'gitignore') {
          const lines = new Set(local.split('\n')), missing = tpl.split('\n').filter(line => !lines.has(line))
          if (!missing.length) continue
          next = local.trimEnd() + '\n' + missing.join('\n') + '\n'
          action = '配置合并'
        } else if (rel === 'docs/cookbook/README.md') {
          next = mergeCookbookIndex(local, tpl)
          action = '保留用户索引，补模板条目'
        }
      }
      if (next !== local) changes.push({ rel: destRel, local, next, action })
    }
    if (dryRun) {
      console.log('upgrade --dry-run：' + changes.length + ' 个文件将变更')
    } else if (changes.length) {
      fs.mkdirSync(path.join(root, '.psycho-frame-upgrade'), { recursive: true })
      backupRoot = fs.mkdtempSync(path.join(root, '.psycho-frame-upgrade', timestamp() + '-'))
      const manifest = { status: 'prepared', applied: [], changes: changes.map(c => ({
        path: c.rel, action: c.action, restore: c.local === null ? 'remove-created-file' : c.rel,
      })) }
      const saveManifest = () => fs.writeFileSync(path.join(backupRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
      for (const change of changes) {
        if (change.local === null) continue
        const backup = path.join(backupRoot, change.rel)
        fs.mkdirSync(path.dirname(backup), { recursive: true })
        fs.writeFileSync(backup, change.local, { flag: 'wx' })
      }
      saveManifest()
      for (const change of changes) {
        checkTargetPath(root, change.rel)
        const dest = path.join(root, change.rel)
        const now = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : null
        if (now !== change.local) throw new Error(change.rel + ': 预检后内容被其他进程修改，停止升级')
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        const temp = dest + '.psycho-frame-' + path.basename(backupRoot)
        let created = false
        try {
          fs.writeFileSync(temp, change.next, { flag: 'wx', mode: fs.existsSync(dest) ? fs.statSync(dest).mode : 0o644 })
          created = true
          fs.renameSync(temp, dest)
        } finally { if (created && fs.existsSync(temp)) fs.unlinkSync(temp) }
        applied += 1
        manifest.applied.push(change.rel)
        saveManifest()
      }
      manifest.status = 'complete'
      saveManifest()
      console.log('upgrade 完成：' + applied + ' 个文件已变更；备份及恢复清单：' + path.relative(root, backupRoot))
    } else console.log('upgrade 完成：骨架已是最新，无需变更')
    for (const c of changes) console.log('  [' + c.action + '] ' + c.rel)
    for (const rel of kept) console.log('  [保留本地] ' + rel)
    return { changed: changes.length, errors: false, ...(backupRoot ? { backup: backupRoot } : {}) }
  } catch (e) {
    console.error('upgrade 中止：' + e.message + (backupRoot ? '；恢复清单：' + backupRoot : '；未写入升级计划'))
    return { changed: applied, errors: true, ...(backupRoot ? { backup: backupRoot } : {}) }
  }
}
