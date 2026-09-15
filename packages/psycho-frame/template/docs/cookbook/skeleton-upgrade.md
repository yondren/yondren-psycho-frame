# 骨架升级（骨架维护模式）

骨架升级改的是仓库根级共享文件（`AGENTS.md`、`docs/`、`.psycho-frame.json`、`package.json` scripts、
`.gitignore`），语义是整个仓库换一代骨架。因此它是一个**在原地进行的特殊工作模式**：不建 worktree、
不建任务分支，升级提交直接落在集成分支。

## 进入条件

- 用户明确要求升级骨架；
- 或漂移线索非 0：`pnpm run doctor` 提示骨架漂移，或
  `pnpm exec psycho-frame upgrade --dry-run --exit-code` 退出码 1。

## 步骤

```sh
pnpm exec psycho-frame upgrade --dry-run   # 预览：哪些文件会被覆盖、哪些配置键会补入
pnpm exec psycho-frame upgrade             # 原地升级；被覆盖的本地改动备份到 .psycho-frame-upgrade/
pnpm verify:docs && pnpm test              # 门禁与测试
git add -A && git commit -m "chore(skeleton): 骨架升级 [<task_key>]"
```

1. 在仓库根 checkout 执行：升级产物是所有 worktree 共享的根文件，linked worktree 内 upgrade 会中止。
2. 只做"升级 → 门禁 → 提交"，不夹带业务改动；工作区脏时先停并说明。
3. 仍按 [tasks/README.md](../../tasks/README.md) 登记任务卡，但豁免 worktree 一步（铁律与例外见
   [parallel-worktrees.md](parallel-worktrees.md)）。

## 升级后的并发收束

升级提交落在集成分支后，在飞的任务 worktree 仍是旧骨架：逐个在 worktree 内 merge-forward 父分支
（[merge.md](merge.md)），并各自重跑 `pnpm verify:docs`。没有在飞任务时跳过本步。

## 验证清单

- `git rev-parse --git-dir` 与 `git rev-parse --git-common-dir` 输出相同（确认在根 checkout）。
- 升级提交的改动面只含模板自有文件与配置增量：`pnpm change-scope --base <ref>` 可核对。
- 每个在飞 worktree 升级后 `pnpm verify:docs` 通过。
