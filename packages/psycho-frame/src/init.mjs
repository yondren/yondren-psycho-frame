// 脚手架与漂移检查：init（新项目，目录须为空）/ adopt（旧项目，只增不改）/ doctor（结构漂移）。
// 模板根为包内 template/，占位符 {{PROJECT_NAME}} 以目标目录名（npm 名规整后）替换。
// 用法: import { scaffold, doctor } from './init.mjs'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const templateRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'template')

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

export function doctor({ target = '.', cwd = process.cwd(), stdout = console.log, stderr = console.error }) {
  const root = path.resolve(cwd, target)
  const missing = REQUIRED_FILES.filter(f => !fs.existsSync(path.join(root, f)))
  const issues = []
  const notes = []

  if (missing.length > 0) {
    issues.push(`缺少必需文件：${missing.join('、')}（用 psycho-frame adopt 补齐，或 psycho-frame upgrade 一键同步）`)
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
      notes.push('workMode 未配置：使用内置默认（plan=on，confirmAmbiguous=true），可用 psycho-frame mode set 调整')
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

  for (const n of notes) stdout(`[note] ${n}`)
  if (issues.length > 0) {
    for (const i of issues) stderr(`[issue] ${i}`)
    return { exitCode: 1, issues, notes }
  }
  stdout(`doctor 通过：${REQUIRED_FILES.length} 个必需文件齐全`)
  return { exitCode: 0, issues, notes }
}
