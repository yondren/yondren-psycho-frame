# 官网升级：面向使用者的精简与教程化 执行报告

- task_key: website-restructure
- 状态: DONE

## 1. 改了哪些文件

- 新增权威文档：`docs/concepts.md`（核心理念）、`docs/cookbook/tutorial.md`（使用教程）。
- 官网：`website/scripts/content-map.mjs`（13 页 → 4 页）、`website/scripts/sync-content.mjs`
  （生成目录整体重建 + 链接重写跳过代码围栏）、`website/.vitepress/config.mts`（nav 增教程、
  描述改写）、`website/src/index.md`（hero 与 features 重写）、`website/README.md`（去部署段）。
- 部署移出 Git：`docs/cookbook/cloudflare-gh-pages.md` 删除，内容落到本地
  `.local/deploy/`（`cloudflare-gh-pages.md` + `README.md`）；`.local/` 进 `.gitignore` 与
  `.psycho-frame.json` 的 `ignore`。
- 链接修正：`docs/cookbook/README.md`、`docs/AGENTS.md`、
  `decisions/implemented/feature/2026-09-09-yondern-psycho-frame-website.md`、
  `decisions/implemented/architecture/2026-09-10-yondren-naming.md`。
- 根 `README.md` 重写（367/400 字）。
- 决策：`decisions/implemented/simplification/2026-09-13-website-user-facing-restructure.md`。
- 任务与报告：`tasks/2026-09-13-website-restructure.md`、本文件。

## 2. 实现了什么

官网从 13 页收敛为 4 页使用者向内容：快速上手（根 README）、使用教程、核心理念、CLI 与配置。
维护者向页面（常驻指令、文档标准、架构地图、开发工作流、四层 README、并行 worktree、
Postmortem）退出官网但保留在仓库。教程覆盖安装 → 认识生成物 → 跑门禁 → 登记任务 → 写决策 →
提交 → 日常循环；理念页讲清四层分工、单一事实源、门禁与工作模式。

`sync-content.mjs` 现在生成前整体重建 `src/guide/` 与 `src/reference/`，删除映射后旧页面不再
被构建；链接重写跳过代码围栏，教程示例里的相对路径不会被改写成 GitHub 直链。

部署 cookbook 迁到本地 `.local/deploy/`，既离开 GitHub 又未丢失；GitHub Pages workflow 保留。

## 3. 跑了哪些命令

- `node packages/psycho-frame/src/cli.mjs verify`
- `pnpm docs:build`
- `ls website/.vitepress/dist/guide website/.vitepress/dist/reference`
- `node packages/psycho-frame/src/cli.mjs scope --base main`

## 4. 验证结果

- 文档门禁通过：110 个 Markdown 文件，链接与锚点、决策结构、任务头字段、预算、工作模式全部合规。
- 官网构建成功（vitepress v1.6.4），同步 4 个页面。
- 产物核对：`dist/guide/` 仅 `concepts.html` `getting-started.html` `tutorial.html`，
  `dist/reference/` 仅 `cli.html`；旧生成页已被清理，不再出现在站点。
- 预算：`README.md` 367/400、`docs/AGENTS.md` 520/650、`docs/cookbook/README.md` 43/120。

## 5. 文档与决策是否同步

- 新增决策记录覆盖页面收敛、本地部署笔记、生成目录重建与围栏感知重写；官网决策记录改述
  页面来源，命名决策去掉失效的 cookbook 指向。
- `docs/AGENTS.md` 分层表登记 `concepts.md`；`docs/cookbook/README.md` 索引更新。
- 根 README、`website/README.md`、`website/src/index.md` 与站点配置同步到新的 4 页结构。

## 6. 还剩什么阻塞

- 无阻塞。本次仅本地提交、未推送；`.local/deploy/` 是本地文件，换机器需自行迁移。
