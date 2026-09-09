# Agent Note: 文档优先工程骨架初始化

Status: implemented

## Problem

TypeSugar 后续主力项目需要可持续、可追溯、可更换 Agent 的工程底座。既有实践暴露两个
问题：文档把"当前事实"与"进度历史"混放导致腐化与漂移；任务状态真源依赖外部 SaaS 看板，
不可版本化、不可 diff，换环境/换 Agent 成本高。

## Decision

采用 DSH 官方仓库（deepseek-ai/deepseek-harness）工程实践的裁剪版，全量落于
[typesugar-agents-notes-skeleton](../../../README.md)：

- 指令层：根 [AGENTS.md](../../../AGENTS.md) + 子树 AGENTS.md，Agent 按目录自动收到规则。
- 知识层：`docs/` 只写当前事实；`decisions/` 存理由；`reports/` 存过程；
  `tasks/` 为任务状态真源（Git 内，[任务记录](../../../tasks/2026-09-07-typesugar-skeleton-init.md)）。
- 门禁层：[verify-docs.mjs](../../../packages/psycho-frame/src/verify-docs.mjs)（链接、决策格式、字数预算）与
  [change-scope.mjs](../../../packages/psycho-frame/src/change-scope.mjs)（显式 base 四层改动面）。
- 并行工作流：每任务一个 git worktree，merge-forward 合流，禁 raw `--force`
  （[cookbook](../../../docs/cookbook/parallel-worktrees.md)）。
- 每次非平凡变更必须在同一提交中携带至少一条决策记录；本次初始化自身的决策即本记录。

## Alternatives considered

**全量照搬官方 monorepo 体系（i18n 双语文档对、catalog 生成器、100% 覆盖率门禁）**
— 否决：对单仓库业务项目是负资产；GitHub native stacked PR 在 Codeup/云效也不可用，
改为分支链 + merge-forward。

**任务真源放外部 SaaS 看板** — 否决：真源出库不可版本化、不可 diff、不可随仓库迁移；
本骨架任务真源固定为 Git 内 `tasks/`，外部看板（如有）只允许做只读镜像。

**继续"平铺文档 + 按日期追加进度记录"** — 否决：历史与事实混放是腐化主因，
进度记录移至 reports/ 与 commit。

**任务状态用目录式生命周期（按状态分文件夹）** — 否决：移动文件即改写历史；
改为单目录 + 文件头状态字段，状态变更只改字段。

## Consequences

- 全部知识载体为纯 Markdown + Git + Node 内置模块脚本，零外部依赖，换 harness/Agent 零迁移成本。
- 每次变更多一条决策记录的成本，换取"为什么"可追溯、后人不再重复踩坑。
- 任务真源在 Git，离线可用；外部看板缺席不影响工作流。
- 字数预算以 `wc -w` 语义计数，对中文偏宽松，定位是防膨胀护栏而非质量标尺。
