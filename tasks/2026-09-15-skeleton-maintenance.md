# 骨架维护模式：升级在根 checkout 原地进行

- task_key: skeleton-maintenance
- status: DONE
- created: 2026-09-15
- updated: 2026-09-15
- report: [reports/skeleton-maintenance.md](../reports/skeleton-maintenance.md)

## 范围

本次包含：`psycho-frame upgrade` 的 linked worktree 入口守卫（`git rev-parse --git-dir` 与
`--git-common-dir` 指向不同即中止、不落盘）；`doctor` 新增骨架漂移提示（`skeletonDrift` 对比包内
模板，只记 note、不改变退出码），框架源码仓库标识从
[upgrade.mjs](../packages/psycho-frame/src/upgrade.mjs) 收敛到
[init.mjs](../packages/psycho-frame/src/init.mjs) 的 `isFrameworkRepo` 单一实现；新增
[docs/cookbook/skeleton-upgrade.md](../docs/cookbook/skeleton-upgrade.md)（进入条件、步骤、并发收束、
验证清单），[docs/cookbook/README.md](../docs/cookbook/README.md) 与
[docs/cookbook/parallel-worktrees.md](../docs/cookbook/parallel-worktrees.md) 补索引与铁律例外；根
[AGENTS.md](../AGENTS.md) 与模板 [AGENTS.md](../packages/psycho-frame/template/AGENTS.md) 加常驻
触发一行；[docs/development.md](../docs/development.md)、
[packages/psycho-frame/README.md](../packages/psycho-frame/README.md)、
[docs/architecture.md](../docs/architecture.md)、[cli.mjs](../packages/psycho-frame/src/cli.mjs) 文案
与两处 `.psycho-frame.json` 预算同步；upgrade / init / cli 测试；决策记录由 proposed 转 implemented。

本次不包含：自动执行升级（触发后仍由用户确认）；把骨架版本号写进仓库文件或配置（版本由 npm 包与
`self-upgrade` 表达）；CI 内的漂移预检作业（`upgrade --dry-run --exit-code` 已可作脚本入口）。

## 进度

- [IN_PROGRESS] 2026-09-15 开工：worktree `.worktrees/skeleton-maintenance`，分支
  `skeleton-maintenance`，base `main`。
- [DONE] 2026-09-15 linked worktree 入口守卫、doctor 骨架漂移 note、`isFrameworkRepo` 单一实现、
  cookbook 页与铁律例外、AGENTS.md 常驻一行、CLI 文案与两处预算落地。
- [DONE] 2026-09-15 验证：`pnpm verify:docs` 通过、`pnpm test` 106 项全绿、真实演练（worktree 内
  upgrade 被拦下、doctor 在框架源码仓库不比较模板），证据见
  [reports/skeleton-maintenance.md](../reports/skeleton-maintenance.md)。
- [DONE] 2026-09-15 以 merge 提交 `773a5ec` 合流回 `main`，worktree 已移除。
