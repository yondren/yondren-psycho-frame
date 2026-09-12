// 官网内容映射（单一真源）：源文件（相对仓库根）→ 官网页（相对 website/，不含扩展名）
// + 页面标题 + 分组。数组顺序即 sidebar 顺序；新增文档页只改这里。
// 消费者：scripts/sync-content.mjs（生成页面）、.vitepress/config.mts（sidebar）。
export const contentMap = [
  { src: 'README.md', dest: 'src/guide/getting-started', title: '快速上手', group: '指南' },
  { src: 'AGENTS.md', dest: 'src/guide/agents-file', title: 'AGENTS.md 常驻指令', group: '指南' },
  { src: 'docs/AGENTS.md', dest: 'src/guide/doc-standard', title: '文档标准', group: '指南' },
  { src: 'docs/architecture.md', dest: 'src/guide/architecture', title: '架构地图', group: '指南' },
  { src: 'docs/development.md', dest: 'src/guide/workflow', title: '开发工作流', group: '指南' },
  { src: 'decisions/README.md', dest: 'src/guide/decisions', title: '决策记录', group: '指南' },
  { src: 'tasks/README.md', dest: 'src/guide/tasks', title: '任务状态真源', group: '指南' },
  { src: 'reports/README.md', dest: 'src/guide/reports', title: '执行报告', group: '指南' },
  { src: 'docs/cookbook/README.md', dest: 'src/guide/cookbook', title: 'Cookbook', group: '指南' },
  { src: 'docs/cookbook/parallel-worktrees.md', dest: 'src/guide/parallel-worktrees', title: '并行 worktree 工作流', group: '指南' },
  { src: 'docs/cookbook/cloudflare-gh-pages.md', dest: 'src/guide/cloudflare-gh-pages', title: 'GitHub Pages + Cloudflare 加速', group: '指南' },
  { src: 'docs/postmortem/README.md', dest: 'src/guide/postmortem', title: 'Postmortem', group: '指南' },
  { src: 'packages/psycho-frame/README.md', dest: 'src/reference/cli', title: 'CLI 与配置', group: '参考' },
]

/** 官网页 → 站点内链接（VitePress 内容根为 website/src/，站点 URL 不含 src/ 前缀）。 */
export const pageLink = entry => `/${entry.dest.replace(/^src\//, '')}`

/** sidebar 分组：按 contentMap 首次出现的顺序返回 [{ text, items }]。 */
export function sidebarGroups() {
  const order = [...new Set(contentMap.map(e => e.group))]
  return order.map(group => ({
    text: group,
    items: contentMap.filter(e => e.group === group).map(e => ({ text: e.title, link: pageLink(e) })),
  }))
}
