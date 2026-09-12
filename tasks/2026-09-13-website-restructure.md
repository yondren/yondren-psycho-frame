# 官网升级：面向使用者的精简与教程化

- task_key: website-restructure
- status: DONE
- created: 2026-09-13
- updated: 2026-09-13
- report: [reports/website-restructure.md](../reports/website-restructure.md)

## 范围

官网从 13 页收敛为 4 页使用者向内容：快速上手（根 README）、使用教程（新增
`docs/cookbook/tutorial.md`）、核心理念（新增 `docs/concepts.md`）、CLI 与配置。维护者向页面
（AGENTS.md、文档标准、架构地图、开发工作流、四层 README、并行 worktree、Postmortem）退出
官网但保留在仓库。部署 cookbook 移出 Git，落到本地 `.local/deploy/`。

本次不包含：`packages/` 产品代码与模板改动；GitHub Pages workflow（保留）。

## 进度

- [DONE] 2026-09-13 官网收敛为使用者向 4 页，新增教程与理念页，部署 cookbook 移入
  `.local/deploy/`；门禁与官网构建通过，任务收尾。
