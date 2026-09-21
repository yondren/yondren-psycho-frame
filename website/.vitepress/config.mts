import { defineConfig } from 'vitepress'
import { sidebarGroups } from '../scripts/content-map.mjs'

// 规范地址是自定义域名 https://psycho-frame.yondren.com/（GitHub Pages 在该域名下按根路径
// 发布），workflow 注入 DOCS_BASE=/；本地构建不设该变量，取同一默认值。
const base = process.env.DOCS_BASE ?? '/'

// 站点介绍句只写一次，SEO description 与 og:description 共用；canonical 是规范地址
// （见 decisions/implemented/feature/2026-09-09-yondren-psycho-frame-website.md），
// og:image 必须是绝对地址，分享平台不解析相对路径。
const canonical = 'https://psycho-frame.yondren.com'
const description =
  '见山处（Yondren）精神力骨架：把事实、决策、任务、报告四层知识放进 Git，Agent 之间共享同一份记忆、多任务本地 worktree 并行，一条命令挡住文档腐化。'

export default defineConfig({
  lang: 'zh-CN',
  title: 'yondren-psycho-frame',
  description,
  base,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: `${canonical}/` }],
    ['meta', { property: 'og:title', content: 'yondren-psycho-frame · 见山处精神力骨架' }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:image', content: `${canonical}/og.png` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],
  srcDir: './src',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
      { text: '教程', link: '/guide/tutorial' },
      { text: '参考', link: '/reference/cli' },
      { text: 'npm', link: 'https://www.npmjs.com/package/yondren-psycho-frame' },
      { text: 'GitHub', link: 'https://github.com/yondren/yondren-psycho-frame' },
    ],
    sidebar: sidebarGroups(),
    search: {
      provider: 'local',
    },
    footer: {
      message: 'MIT 许可 · Yondren（见山处）',
    },
  },
})
