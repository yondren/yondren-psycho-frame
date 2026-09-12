// 官网内容生成：把仓库权威 Markdown 映射为 VitePress 指南/参考页。
// 映射表在 scripts/content-map.mjs（与 .vitepress/config.mts 的 sidebar 共用）。
// 生成物位于 src/guide/ 与 src/reference/（gitignore，构建前运行）。
// 链接重写规则：目标在映射表内 → 官网路径；其余仓库内目标 → GitHub 直链；外部链接原样保留；
// 代码围栏内是示例文本，一律原样保留。
// 零依赖。用法: node scripts/sync-content.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { contentMap } from './content-map.mjs'

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(websiteRoot, '..')
const repoBase = 'https://github.com/yondren/yondren-psycho-frame/blob/main'

const bySrc = new Map(contentMap.map(m => [m.src, m]))

const isExternal = url =>
  url.startsWith('//') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)

function splitAnchor(url) {
  const i = url.indexOf('#')
  if (i === -1) return { pathPart: url, anchor: '' }
  return { pathPart: url.slice(0, i), anchor: url.slice(i) }
}

// 把源文件里的一个相对目标改写为官网路径或 GitHub 直链
function rewriteTarget(target, srcDir) {
  if (target === '') return target
  if (isExternal(target)) return target
  if (target.startsWith('/')) return target // 仓库文档无根绝对路径；保险起见原样保留
  if (target.startsWith('#')) return target // 同文件锚点
  const { pathPart, anchor } = splitAnchor(target)
  const resolved = path.posix.normalize(path.posix.join(srcDir, pathPart.replace(/[?#].*$/, '')))
  const mapped = bySrc.get(resolved)
  // VitePress 内容根为 website/src/，站点 URL 不含 src/ 前缀
  if (mapped) return `/${mapped.dest.replace(/^src\//, '')}${anchor}`
  return `${repoBase}/${resolved}${anchor}`
}

function transform(source, srcDir) {
  const text = fs.readFileSync(path.join(repoRoot, source), 'utf8')
  // 代码围栏内是示例文本，原样保留；只重写正文里的链接，否则教程里的相对路径会被改写坏。
  let inFence = false
  return text.split('\n').map(line => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      return line
    }
    if (inFence) return line
    // 行内链接与图片：![label](url "title") 分段重建，避免标签文本与 URL 相同导致误替换
    let next = line.replace(/(!?\[[^\]]*\]\()([^)\s]+)([^)]*\))/g, (m, head, url, tail) => {
      const target = rewriteTarget(url, srcDir)
      return `${head}${target}${tail}`
    })
    // 引用式定义：[id]: url
    next = next.replace(/^(\[[^\]]+\]:)\s*(\S+)/, (m, head, url) => {
      const target = rewriteTarget(url, srcDir)
      return `${head} ${target}`
    })
    return next
  }).join('\n')
}

// 生成目录整体重建：映射里删掉的页面不能以残留文件继续被 VitePress 构建。
for (const dir of ['src/guide', 'src/reference']) {
  fs.rmSync(path.join(websiteRoot, dir), { recursive: true, force: true })
}

for (const entry of contentMap) {
  const srcDir = path.posix.dirname(entry.src) === '.' ? '' : path.posix.dirname(entry.src)
  const body = transform(entry.src, srcDir)
  const page = `---\ntitle: ${entry.title}\n---\n\n${body}`
  const destFile = path.join(websiteRoot, `${entry.dest}.md`)
  fs.mkdirSync(path.dirname(destFile), { recursive: true })
  fs.writeFileSync(destFile, page)
  console.log(`[sync] ${entry.src} -> ${entry.dest}.md`)
}
console.log(`同步完成：${contentMap.length} 个页面`)
