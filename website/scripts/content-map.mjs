// 官网内容映射（单一真源）：源文件（相对仓库根）→ 官网页（相对 website/，不含扩展名）
// + 页面标题 + 分组。数组顺序即 sidebar 顺序；新增文档页只改这里。
// 只放使用者向内容：维护者向文档（AGENTS.md、文档标准、架构地图、四层 README 等）留在仓库内，不上官网。
// 消费者：scripts/sync-content.mjs（生成页面）、.vitepress/config.mts（sidebar）。
export const contentMap = [
  { src: 'README.md', dest: 'src/guide/getting-started', title: '快速上手', group: '指南' },
  { src: 'docs/cookbook/tutorial.md', dest: 'src/guide/tutorial', title: '使用教程', group: '指南' },
  { src: 'docs/concepts.md', dest: 'src/guide/concepts', title: '核心理念', group: '指南' },
  { src: 'docs/modes.md', dest: 'src/guide/modes', title: '工作模式', group: '指南' },
  { src: 'docs/cookbook/submit-pr.md', dest: 'src/guide/submit-pr', title: '提 issue 与 PR', group: '指南' },
  { src: 'docs/cookbook/shared-toolchain.md', dest: 'src/guide/shared-toolchain', title: '共享工具链', group: '指南' },
  { src: 'docs/cookbook/authoring-cookbooks.md', dest: 'src/guide/authoring-cookbooks', title: '整理 cookbook', group: '指南' },
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
