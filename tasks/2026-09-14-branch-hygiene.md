# 分支卫生：清理历史任务分支，合流流程补删分支

- task_key: branch-hygiene
- status: DEFERRED
- created: 2026-09-14
- updated: 2026-09-14
- report: [reports/branch-hygiene.md](../reports/branch-hygiene.md)

## 范围

本次包含：清理 `main` 之外的历史本地分支（已合入者与内容已被取代者）；在
[docs/cookbook/merge.md](../docs/cookbook/merge.md) 与模板副本的合流步骤补一条"合流后删除已合入的
任务分支：`git branch -d <task-branch>`"，让任务分支不再随任务堆积。

本次不包含：改写已推历史（禁止）；删除 `origin` 或 `codeup` 上的任何 ref（两端除 `main` / `mirror`
外没有任务分支）；[init.mjs](../packages/psycho-frame/src/init.mjs) 里 `doctor` 的领先分支提示逻辑
（行为保持不变）。

## 延期原因

用户 2026-09-14 要求"暂不做，只记录"，故补步骤一条延期实施。实施时属仓库定义的微小改动（单点
文案、无方案分歧）：登记任务 → 改 `merge.md` 与模板 → `pnpm verify:docs` → 提交合流，不写报告与
决策记录。

## 进度

- [DONE] 2026-09-14 清理本地分支 11 个（2 个已完全合入，9 个内容已被 main 取代）：逐条比对分支
  独有文件与任务卡状态后删除，`doctor` 的领先分支提示由 9 条降为 0。证据见
  [reports/branch-hygiene.md](../reports/branch-hygiene.md)。
- [DEFERRED] 2026-09-14 合流流程补"删除已合入任务分支"一步（`merge.md` + 模板各一行）。
