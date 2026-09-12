# Agent Note: 官网收敛为使用者向内容，部署操作移出 Git

Status: implemented

## Problem

官网把仓库的维护者向文档原样发布：常驻指令、文档标准、架构地图、开发工作流、四层 README、
并行 worktree、Postmortem 与部署 cookbook 共 13 页，读者要在一堆内部流程里找"怎么用"。
同时维护者不希望部署操作手册（GitHub Pages + Cloudflare 加速的 DNS/SSL/缓存/回滚步骤）
进入 GitHub。

## Decision

- 官网页面收敛为使用者向 4 页：快速上手（根 README）、
  [使用教程](../../../docs/cookbook/tutorial.md)、[核心理念](../../../docs/concepts.md)、
  [CLI 与配置](../../../packages/psycho-frame/README.md)。维护者向文档退出
  [content-map.mjs](../../../website/scripts/content-map.mjs)，仍保留在仓库内。
- 新增两篇权威文档承担官网内容，官网依旧不产第二事实源：教程走分步操作，理念页讲四层知识
  与门禁、工作模式的取舍；[docs/AGENTS.md](../../../docs/AGENTS.md) 分层表登记 concepts.md。
- 部署操作移出 Git：`docs/cookbook/cloudflare-gh-pages.md` 迁到本地 `.local/deploy/`，`.local/`
  进 `.gitignore` 与 [.psycho-frame.json](../../../.psycho-frame.json) 的 `ignore`（门禁不扫描
  本地笔记）；官网决策记录中的部署操作细节与链接同步移除。GitHub Pages workflow 保留。
- [sync-content.mjs](../../../website/scripts/sync-content.mjs) 生成前整体重建
  `src/guide/` 与 `src/reference/`，映射删除的页面不再以残留文件被构建；链接重写跳过代码
  围栏，教程示例里的相对路径保持原样。

## Alternatives considered

**手写官网教程与理念页** — 否决：官网手写内容制造第二事实源，违背 one home per fact；
权威文档写在 docs/ 并由映射生成，规则只有一处。

**保留 13 页只改文案** — 否决：读者仍要先穿过维护者文档才能找到用法，精简页面的收益大于
保留全部页面的信息量。

**删除仓库内维护者文档** — 否决：它们是骨架的自举实例与产品规则，仓库自身运行依赖它们；
本决策只让它们退出官网。

**部署文档留在 Git，仅从官网移除** — 否决：维护者要求部署操作不进 GitHub；本地留存同时满足
"不公开"与"不丢失"。

**sync 只写不删，手工清理旧页** — 否决：删除映射后旧生成页会继续被 VitePress 构建，手工清理
必然漏；生成目录整体重建是唯一可靠做法。

## Consequences

- 官网从 13 页收敛到 4 页，导航与侧边栏仍由 content-map.mjs 单点决定。
- 教程与理念页是新增的权威文档，新增文档仍须同步 MAP 才会出现在官网。
- `.local/deploy/` 不入 Git、不进门禁；换机器或协作时需维护者自行迁移。
- 决策记录只保留"为什么用 VitePress + GitHub Pages"的理由，部署操作方法不再可门禁追踪。
