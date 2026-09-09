# 任务状态真源

任务状态唯一真源在本目录（Git 内）。不使用外部 SaaS 看板（理由见
[decisions/implemented/process/2026-09-07-doc-first-engineering-skeleton.md](../decisions/implemented/process/2026-09-07-doc-first-engineering-skeleton.md)）。

## 文件

`tasks/yyyy-mm-dd-task_key.md`；task_key 全小写连字符、语义化、创建后不变，与文件名一致。

## 头部字段

- task_key / status / created / updated / report（reports/<task_key>.md 路径）
- 头字段与 task_key 一致性由 `pnpm verify:docs` 校验。

## 状态

`NOT_STARTED` `IN_PROGRESS` `BLOCKED`（须写阻塞原因）`DEFERRED`（须写延期原因）`DONE`

## 规则

1. 开工前先登记任务并置 `IN_PROGRESS`；微小改动豁免（判定见
   [docs/development.md](../docs/development.md)），须在提交前补登记。
2. 完成顺序固定：验证 → 报告 → 文档/决策同步 → 提交（含 task_key）→ 置 `DONE`。
3. 阻塞/延期先改本文件状态并写原因，再同步 reports/。
4. 状态与 reports/、decisions/ 不一致时，以本目录为准并立即修正其他位置。
5. 换 Agent / 恢复上下文：读 AGENTS.md → tasks/ 找当前任务 → 对应 reports/ 与 decisions/。
