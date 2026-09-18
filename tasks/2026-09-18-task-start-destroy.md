# task start 命令与毁灭模式门禁

- task_key: task-start-destroy
- status: IN_PROGRESS
- created: 2026-09-18
- updated: 2026-09-18
- report: [reports/task-start-destroy.md](../reports/task-start-destroy.md)

## 范围

本次包含：`psycho-frame task start <task_key>`（一条命令建 worktree、分支、任务卡、报告占位与
worktree 级 hooks 隔离）与 `psycho-frame task check`；`workMode.destroy` 第七把开关与毁灭门禁
（worktree 纪律、hooks 隔离、必须显式 `--base`、改动面必须带决策记录、提交信息含 task_key、
任务卡状态流转、凭据扫描、提交前本地全量矩阵）；对应测试、文档、模板同步与决策记录。

本次不包含：提 issue/PR 的 cookbook 与 PR/issue 模板（任务 `pr-issue-cookbook`）、
`cookbook new` 与共享工具链范例（任务 `cookbook-authoring`）、把本仓库的 `workMode.destroy`
长期置 `on`。

## 进度

- [DONE] 2026-09-18 worktree `task-start-destroy` 内实现：`task start` / `task check` 命令、
  `work-mode.mjs` 第七把开关 `destroy`、`destroy.mjs` 毁灭门禁、`change-scope.mjs` 抽出
  `collectChangeScope`，CLI 与帮助文本同步。
- [DONE] 2026-09-18 测试 147 项全过（嵌套环境下同样全过）、`task check` 通过、毁灭模式自审
  `verify --base main` 全绿（`pnpm test` + `pnpm run doctor`），并当场演示缺 `--base` 与凭据命中
  两种失败。
- [DONE] 2026-09-18 文档、模板镜像、预算上调与两条决策记录同步。
- [IN_PROGRESS] 待合流到 `main`（按 `workMode.merge=ask` 等用户确认）。
