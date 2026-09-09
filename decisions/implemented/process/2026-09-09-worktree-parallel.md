# Agent Note: 嵌套 worktree 布局启用真并行

Status: implemented

## Problem

DSH 沙箱以仓库根为 workspace 边界，拒绝 workspace 外写入；cookbook 原规定的兄弟目录
`../<project>-<task_key>` 布局在本部署不可执行，并行只能退化为单 checkout 分支串行
（[2026-09-07-skeleton-review-gate-alignment](2026-09-07-skeleton-review-gate-alignment.md)）。

## Decision

worktree 布局为嵌套 `.worktrees/<task_key>`（仓库内、workspace 内）：
`git worktree add .worktrees/<task_key> -b <task_key> main`。仓库与模板的 .gitignore
预留 `.worktrees/`；verify-docs 的目录遍历跳过 `.worktrees`（与 node_modules 同级），
门禁不扫入嵌套副本；cookbook 规定会话绑定（一个对话只在自己的 worktree 内工作，
main checkout 只做合流）。change-scope 的 untracked 层使用
`git ls-files --others --exclude-standard`，尊重 gitignore，无需改动。

## Alternatives considered

**兄弟目录 `../<project>-<task_key>`（原布局）** — 否决：沙箱拒绝 workspace 外写入，
本部署不可执行；放宽沙箱到仓库父目录属部署级变更，超出骨架能力。

**每 worktree 注册为独立 DSH workspace** — 否决：依赖部署的目录选择与沙箱配置，
骨架文档无法保证，仅作后续候选。

**不建 worktree，继续单 checkout 分支串行** — 否决：失去并行能力，与铁律意图相悖。

## Consequences

- 并行任务在本部署可执行：每任务一个嵌套 worktree 一条分支，同一分支双重检出被
  git 拒绝，隔离由 git 机制保证。
- main checkout 视 `.worktrees/` 为未跟踪目录，由 .gitignore 与门禁跳过共同管理；
  不尊重 gitignore 的工具是残余风险面。
- 在 worktree 内误跑 psycho-frame upgrade/doctor 会作用于 worktree 副本。
- 会话绑定靠对话纪律执行，门禁不校验；cookbook 验证清单覆盖 main 改动面不含
  `.worktrees/` 路径。
