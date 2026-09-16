// 脚手架与漂移检查：init（新项目，目录须为空）/ adopt（旧项目，只增不改）/ doctor（结构漂移）。
// 模板根为包内 template/，占位符 {{PROJECT_NAME}} 以目标目录名（npm 名规整后）替换。
// 用法: import { scaffold, doctor } from './init.mjs'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { DEFAULT_WORK_MODE } from './work-mode.mjs'

const templateRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'template')
const GIT_BRANCH_LIMIT = 8

// npm/pnpm pack 会丢弃名为 .gitignore 的文件且 npm install 会把它改名，故模板里存
// gitignore（无点），写入宿主时映射回 .gitignore。
const RENAMES = { gitignore: '.gitignore' }

const REQUIRED_FILES = [
  'AGENTS.md',
  'docs/AGENTS.md',
  'docs/architecture.md',
  'docs/development.md',
  'decisions/README.md',
  'tasks/README.md',
  'reports/README.md',
]

export function sanitizeName(name) {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned === '' ? 'my-project' : cleaned
}

export function walkFiles(dir, base = dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walkFiles(p, base))
    else out.push(path.relative(base, p).split(path.sep).join('/'))
  }
  return out
}

/** 框架源码仓库标识：根 package 名或包内模板目录。它既是模板源头，又按骨架组织自身文档。 */
export function isFrameworkRepo(root) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
    if (pkg.name === 'yondren-psycho-frame-workspace') return true
  } catch { /* 无 package.json 或 JSON 损坏：改看路径特征 */ }
  return fs.existsSync(path.join(root, 'packages', 'psycho-frame', 'template', 'package.json'))
}

// upgrade 会整文件覆盖模板自有文件；README.md 属用户内容，其余三类配置走增量合并，均不计漂移。
const MERGED_OR_LOCAL = new Set(['README.md', '.psycho-frame.json', 'package.json', '.gitignore'])

/** 骨架文件与包内模板的差异：{ drift, missing } 文件名清单；框架源码仓库返回 null。 */
export function skeletonDrift(root) {
  if (isFrameworkRepo(root)) return null
  const projectName = sanitizeName(path.basename(root))
  const drift = []
  const missing = []
  for (const rel of walkFiles(templateRoot).sort()) {
    const name = RENAMES[rel] ?? rel
    if (MERGED_OR_LOCAL.has(name)) continue
    const dest = path.join(root, name)
    if (!fs.existsSync(dest)) {
      missing.push(name)
      continue
    }
    const expected = fs.readFileSync(path.join(templateRoot, rel), 'utf8').replaceAll('{{PROJECT_NAME}}', projectName)
    if (fs.readFileSync(dest, 'utf8') !== expected) drift.push(name)
  }
  return { drift, missing }
}

export function scaffold({ target = '.', mode, cwd = process.cwd(), stdout = console.log, stderr = console.error }) {
  const destRoot = path.resolve(cwd, target)
  if (!fs.existsSync(destRoot)) fs.mkdirSync(destRoot, { recursive: true })
  if (mode === 'init') {
    const existing = fs.readdirSync(destRoot).filter(n => n !== '.DS_Store')
    if (existing.length > 0) {
      stderr(`psycho-frame init: 目标目录非空（${destRoot}）；已有项目请用 adopt（只增不改）`)
      return { exitCode: 1, written: [], skipped: [] }
    }
  }
  const projectName = sanitizeName(path.basename(destRoot))
  const files = walkFiles(templateRoot).sort()
  const written = []
  const skipped = []
  for (const rel of files) {
    const src = path.join(templateRoot, rel)
    const dest = path.join(destRoot, RENAMES[rel] ?? rel)
    if (mode === 'adopt' && fs.existsSync(dest)) {
      stdout(`[skip] ${rel}`)
      skipped.push(rel)
      continue
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    const text = fs.readFileSync(src, 'utf8').replaceAll('{{PROJECT_NAME}}', projectName)
    fs.writeFileSync(dest, text)
    stdout(`[write] ${rel}`)
    written.push(rel)
  }
  stdout('\n下一步：')
  if (mode === 'adopt') {
    stdout('  既有 package.json 缺 verify:docs / change-scope 脚本时，按 docs/development.md 的')
    stdout('  「门禁接入」补齐脚本与 devDependency，再跑 pnpm verify:docs（pnpm 会先装好，不要用 npm）')
  } else {
    stdout('  pnpm verify:docs        # 零依赖；缺 devDependency 时 pnpm 会自动补齐')
  }
  return { exitCode: 0, written, skipped }
}

/** 仓库根（含 linked worktree）；非 git 仓库或 git 不可用时返回 null。 */
function gitToplevel(root) {
  try {
    const top = execFileSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return top === '' ? null : fs.realpathSync(top)
  } catch {
    return null
  }
}

/** 本地集成分支名：优先 main，其次 master；都不存在时返回 null。 */
function integrationBranch(root) {
  for (const name of ['main', 'master']) {
    try {
      execFileSync('git', ['-C', root, 'rev-parse', '--verify', '--quiet', `refs/heads/${name}`], {
        stdio: ['ignore', 'ignore', 'ignore'],
      })
      return name
    } catch { /* 换下一个候选 */ }
  }
  return null
}

/** 领先 base 的本地分支与领先提交数，按领先数降序；git 不可用或 base 缺失时返回 []。 */
export function branchesAhead(root, base) {
  let names = ''
  try {
    names = execFileSync('git', ['-C', root, 'branch', '--no-merged', base, '--format=%(refname:short)'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return []
  }
  const rows = []
  for (const name of names.split('\n').map(s => s.trim()).filter(Boolean)) {
    if (name === base) continue
    try {
      const ahead = Number(execFileSync('git', ['-C', root, 'rev-list', '--count', `${base}..${name}`], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim())
      if (Number.isInteger(ahead) && ahead > 0) rows.push({ branch: name, ahead })
    } catch { /* 读不到的单个分支跳过，doctor 不因 git 细节失败 */ }
  }
  return rows.sort((a, b) => b.ahead - a.ahead || a.branch.localeCompare(b.branch))
}

export function doctor({ target = '.', cwd = process.cwd(), stdout = console.log, stderr = console.error }) {
  const root = path.resolve(cwd, target)
  const missing = REQUIRED_FILES.filter(f => !fs.existsSync(path.join(root, f)))
  const issues = []
  const notes = []

  if (missing.length > 0) {
    issues.push(`缺少必需文件：${missing.join('、')}（用 psycho-frame adopt 补齐，或 psycho-frame upgrade 一键同步）`)
  }
  const drift = skeletonDrift(root)
  if (drift !== null && drift.drift.length + drift.missing.length > 0) {
    notes.push(
      `骨架漂移：${drift.drift.length + drift.missing.length} 个骨架文件与模板不一致（缺失 ${drift.missing.length} 个）；psycho-frame upgrade --dry-run 预览，psycho-frame upgrade 同步（被覆盖的本地改动会备份）`,
    )
  }
  const configPath = path.join(root, '.psycho-frame.json')
  if (fs.existsSync(configPath)) {
    let config = null
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    } catch (e) {
      issues.push(`.psycho-frame.json: JSON 解析失败: ${e.message}`)
    }
    if (config !== null && typeof config === 'object' && !Array.isArray(config) && config.workMode === undefined) {
      const defaults = Object.entries(DEFAULT_WORK_MODE).map(([k, v]) => `${k}=${v}`).join('，')
      notes.push(`workMode 未配置：使用内置默认（${defaults}），可用 psycho-frame mode set 调整`)
    }
  } else {
    notes.push('无 .psycho-frame.json：使用内置封闭集合与默认工作模式，字数预算未启用')
  }
  const pkgPath = path.join(root, 'package.json')
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      const scripts = pkg.scripts ?? {}
      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) }
      // 只有脚本调用裸 psycho-frame 命令才需要依赖；路径形式自带实现，不该追讨 devDependency
      const usesBin = Object.values(scripts).some(s => typeof s === 'string' && /(^|[\s&|;])psycho-frame(?:$|\s)/.test(s))
      if (usesBin && !deps['yondren-psycho-frame']) {
        notes.push('package.json 未声明 "yondren-psycho-frame"：加入 devDependencies 后 pnpm verify:docs 会自动安装')
      }
      if (!scripts['verify:docs']?.includes('psycho-frame')) {
        notes.push('package.json 缺少脚本 "verify:docs"：加入 "verify:docs": "psycho-frame verify"，然后 pnpm verify:docs')
      }
      if (!scripts['change-scope']?.includes('psycho-frame')) {
        notes.push('package.json 缺少脚本 "change-scope"：加入 "change-scope": "psycho-frame scope"')
      }
    } catch (e) {
      issues.push(`package.json: JSON 解析失败: ${e.message}`)
    }
  } else {
    notes.push('无 package.json：跳过脚本检查（非 Node 项目可忽略）')
  }

  let isRepoRoot = false
  try {
    isRepoRoot = gitToplevel(root) === fs.realpathSync(root)
  } catch { /* 目录不存在等情况：跳过分支检查 */ }
  if (isRepoRoot) {
    const base = integrationBranch(root)
    if (base !== null) {
      const ahead = branchesAhead(root, base)
      if (ahead.length > 0) {
        const shown = ahead.slice(0, GIT_BRANCH_LIMIT).map(r => `${r.branch}（领先 ${r.ahead} 个提交）`).join('、')
        const rest = ahead.length > GIT_BRANCH_LIMIT ? `（共 ${ahead.length} 个分支）` : ''
        notes.push(`有 ${ahead.length} 个本地分支领先 ${base}：${shown}${rest}；按 workMode.merge 收束，或在任务卡与报告写明未合流的分支名与原因`)
      }
    }
  }

  for (const n of notes) stdout(`[note] ${n}`)
  if (issues.length > 0) {
    for (const i of issues) stderr(`[issue] ${i}`)
    return { exitCode: 1, issues, notes }
  }
  stdout(`doctor 通过：${REQUIRED_FILES.length} 个必需文件齐全`)
  return { exitCode: 0, issues, notes }
}
