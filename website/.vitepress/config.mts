import { defineConfig } from 'vitepress'

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
    sidebar: [
      {
        text: '指南',
        items: [
          { text: '快速上手', link: '/guide/getting-started' },
          { text: 'AGENTS.md 常驻指令', link: '/guide/agents-file' },
          { text: '文档标准', link: '/guide/doc-standard' },
          { text: '架构地图', link: '/guide/architecture' },
          { text: '开发工作流', link: '/guide/workflow' },
          { text: '决策记录', link: '/guide/decisions' },
          { text: '任务状态真源', link: '/guide/tasks' },
          { text: '执行报告', link: '/guide/reports' },
          { text: 'Cookbook', link: '/guide/cookbook' },
          { text: '并行 worktree 工作流', link: '/guide/parallel-worktrees' },
          { text: 'GitHub Pages + Cloudflare 加速', link: '/guide/cloudflare-gh-pages' },
          { text: 'Postmortem', link: '/guide/postmortem' },
        ],
      },
      {
        text: '参考',
        items: [
          { text: 'CLI 与配置', link: '/reference/cli' },
        ],
      },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'MIT 许可 · Yondren（见山处）',
    },
  },
})
