# 工作模式新增合流开关（merge）

- task_key: work-mode-merge
- status: NOT_STARTED
- created: 2026-09-14
- updated: 2026-09-14
- report: [reports/work-mode-merge.md](../reports/work-mode-merge.md)

## 范围

本次包含：`workMode` 新增第四把正交开关 `merge`（`off`/`ask`/`auto`，默认 `ask`）；
[work-mode.mjs](../packages/psycho-frame/src/work-mode.mjs) 的取值、默认与校验；
[cli.mjs](../packages/psycho-frame/src/cli.mjs) 的 usage 与 help 文本；完成定义改造
（[tasks/README.md](README.md) 规则 2、[docs/development.md](../docs/development.md) 日常顺序）；
[reports/README.md](../reports/README.md) 报告模板增加合流状态字段；
[docs/cookbook/parallel-worktrees.md](../docs/cookbook/parallel-worktrees.md) 合流节补触发时机、
目标分支与失败语义；`doctor` 报告领先父分支的本地分支；根与模板 `AGENTS.md`、
[packages/psycho-frame/README.md](../packages/psycho-frame/README.md) 与两处 `.psycho-frame.json`
同步；work-mode / cli / init / upgrade 测试覆盖；决策记录与模板同步。

本次不包含：push 并入开关或新增 push 开关（推送仍按 [AGENTS.md](../AGENTS.md) 的既有约定单独确认）；
主分支名配置化（消费者默认分支均为 `main`，出现第二主线时再引入）；包版本 bump（归 release 任务）；
官网新增页面（`packages/psycho-frame/README.md` 已在 content-map 内，随同步展示）。

## 进度

- [NOT_STARTED] 2026-09-14 评估完成并落成提案
  [decisions/proposed/feature/2026-09-14-work-mode-merge.md](../decisions/proposed/feature/2026-09-14-work-mode-merge.md)；
  实现未开工，开工前按 [cookbook/parallel-worktrees.md](../docs/cookbook/parallel-worktrees.md) 建
  `.worktrees/work-mode-merge` 并把状态改为 `IN_PROGRESS`。
