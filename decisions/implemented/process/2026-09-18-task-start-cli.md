# Agent Note: task start 一条命令开任务 worktree

Status: implemented

## Problem

"每个任务一个 worktree"是铁律，但执行它要三步手工 git 命令加两次决策（布局、基线、hooks 隔离），
Agent 在实际会话里经常直接在主 checkout 改文件——规则没有可执行的入口，也就没有可失败的信号；
登记任务与开 worktree 是两件手工事，漏一件不会有任何提示。

## Decision

新增 `psycho-frame task start <task_key> [--base <ref>]`，把"登记任务 + 开 worktree + 隔离 hooks"
收敛成一条命令：建分支与 `.worktrees/<task_key>`、写 `tasks/<日期>-<task_key>.md`（`IN_PROGRESS`）
与 `reports/<task_key>.md` 占位、开 `extensions.worktreeConfig` 并设该 worktree 的
`core.hooksPath`、缺 `.worktrees/` 时补 `.gitignore`。`--base` 缺省 main / master，只能从主 checkout
执行；重复执行时若 worktree 与分支一致就幂等跳过。

配套 `psycho-frame task check` 把纪律变成检查：`IN_PROGRESS` 必须有 worktree、`DONE` 不留
worktree、无孤儿 worktree、根 checkout 不检出任务分支、各 worktree 的 `core.hooksPath` 互不相同、
`BLOCKED` / `DEFERRED` 必须写原因。检查引擎 `checkWorktrees` 与毁灭门禁共用一份实现
（[毁灭模式门禁](2026-09-18-destroy-mode-gate.md)）。

[cookbook/parallel-worktrees.md](../../../docs/cookbook/parallel-worktrees.md) 的手工 git 步骤由这条
命令替换；[嵌套 worktree 布局](2026-09-09-worktree-parallel.md)的位置与理由不变。

## Alternatives considered

**保持手工命令，只在文档里写得更醒目** — 否决：这正是反馈中失效的做法；规则缺可执行入口时，
强调措辞不产生行为差异。

**用 git pre-commit hook 拦住主 checkout 的提交** — 否决：hooks 目录本身按 worktree 隔离，消费方
未必装 installer，骨架也不内置；走 CLI 才能同时覆盖本地与毁灭门禁，且不新增安装步骤。

**task start 顺带 `pnpm install`** — 否决：门禁零依赖，装依赖只在需要构建时发生；把安装塞进开
worktree 会让每个任务付一次冷安装成本。

## Consequences

- 开任务从三步手工命令变成一条命令；漏建 worktree 有 `task check` 与毁灭门禁两个信号。
- 任务卡与报告占位由命令生成，`task start` 之后必须补齐任务卡「范围」再开工。
- `task start` 对宿主仓库的唯一自动改动是补 `.gitignore` 的 `.worktrees/`。
- 手工 `git worktree add` 仍可用，但 `task check` 会因缺 hooks 隔离报违规。
- 任务状态以主 checkout 为权威：从 worktree 内检查时，当前分支只补主 checkout 没有的任务卡，
  不让分支覆盖主 checkout——否则分支上过期的 `IN_PROGRESS` 会对已合流的任务误报"没有 worktree"。
