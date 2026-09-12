import { defineConfig } from 'vitepress'
import { sidebarGroups } from '../scripts/content-map.mjs'

// 部署到 GitHub Pages 项目页（https://<user>.github.io/yondren-psycho-frame/）时，
// 由 workflow 注入 DOCS_BASE=/yondren-psycho-frame/；自定义域名时保持根路径。
const base = process.env.DOCS_BASE ?? '/'

export default defineConfig({
  lang: 'zh-CN',
  title: 'yondren-psycho-frame',
  description: '见山处（Yondren）精神力骨架开发框架：文档优先的工程骨架，任务、决策、报告、事实四层分离，门禁机器可校验。',
  base,
  srcDir: './src',
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: '指南', link: '/guide/getting-started' },
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
