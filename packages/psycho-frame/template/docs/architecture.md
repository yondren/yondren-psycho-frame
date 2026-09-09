# 架构地图

本骨架的文档工程架构。改 `AGENTS.md` 分层、目录结构或 `.psycho-frame.json` 前先读本文件。

## 组成

- 知识层：`docs/`（当前事实）、`decisions/`（理由）、`tasks/`（状态）、`reports/`（过程）。
- 业务层：`apps/`（可选；pnpm workspace 或任意技术栈，模块契约写模块 README）。
- 指令层：根 `AGENTS.md` + 子树 `AGENTS.md`，Agent 按当前目录自动收到对应规则。
- 门禁层：由 [yondern-psycho-frame](https://www.npmjs.com/package/yondern-psycho-frame)
  包提供（verify / scope / mode / upgrade / self-upgrade / doctor），本仓库配置在
  [.psycho-frame.json](../.psycho-frame.json)。

## 流转

任务 → worktree → 编码/文档 → change-scope 取改动面 → 最窄验证 → 决策记录 + 报告 →
`pnpm verify:docs` → 提交（含 task_key）→ merge-forward 合流。

## 扩展点

- 业务代码在 `apps/` 按模块建目录，模块契约写模块 README（one home per fact）。
- 封闭集合与字数预算在 `.psycho-frame.json`；缺省用包内置值。
- 高频操作沉淀为 `.agents/skills/<name>/SKILL.md`。
- 全量门禁矩阵归 CI；本地只跑改动面匹配的检查。
