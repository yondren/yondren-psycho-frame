import { defineConfig } from 'vitepress'
import { sidebarGroups } from '../scripts/content-map.mjs'

// 规范地址是自定义域名 https://psycho-frame.yondren.com/（GitHub Pages 在该域名下按根路径
// 发布），workflow 注入 DOCS_BASE=/；本地构建不设该变量，取同一默认值。
const base = process.env.DOCS_BASE ?? '/'

export default defineConfig({
  lang: 'zh-CN',
  title: 'yondren-psycho-frame',
  description: '见山处（Yondren）精神力骨架：把事实、决策、任务、报告四层知识放进 Git，用一条命令挡住文档腐化；零运行时依赖。',
  base,
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
