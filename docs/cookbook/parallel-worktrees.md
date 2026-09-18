# 并行 worktree 工作流

铁律：一个任务一个 worktree，并行任务永不共享 checkout。合并采用 merge-forward；
重写已推历史必须租约保护；禁止 raw `--force`。

例外：骨架升级改的是全仓库共享的根文件，在根 checkout 原地进行、不建 worktree
（[skeleton-upgrade.md](skeleton-upgrade.md)）。

worktree 布局：嵌套 `.worktrees/<task_key>`（理由见
[决策记录](../../decisions/implemented/process/2026-09-09-worktree-parallel.md)）。

## 1. 开任务 worktree

```sh
psycho-frame task start <task_key> [--base <ref>]
```

一条命令完成：建分支与 `.worktrees/<task_key>`、登记 `tasks/<日期>-<task_key>.md`（`IN_PROGRESS`）
与 `reports/<task_key>.md` 占位、设该 worktree 的 `core.hooksPath` 隔离、缺 `.worktrees/` 时补
`.gitignore`。`--base` 缺省 main / master，只能从主 checkout 执行；已存在且分支正确时幂等跳过。

hooks 隔离的理由：linked worktree 共享 hooks 目录，不隔离会互相覆盖（见 DSH 官方
[worktree-local-lefthook 决策记录](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/process/2026-07-27-worktree-local-lefthook.md)）；
骨架不内置 installer，`task start` 只设路径。

## 2. 依赖供给

门禁零依赖，worktree 里可直接 `node packages/psycho-frame/src/cli.mjs verify`；需要 workspace
链接或官网构建时才安装，且只用 pnpm：

```sh
CI=true pnpm install --frozen-lockfile
```

包管理器规则见 [development.md](../development.md)；不要软链或复制 `node_modules`。

## 3. 会话绑定

一个对话只在自己的 `.worktrees/<task_key>` 内工作，文件路径以它为前缀；
main checkout 只做合流，不在其中编码。

## 4. 改动面与验证

```sh
pnpm change-scope --base <父分支 ref>   # 显式 base，绝不猜 origin/<branch>
```

## 5. 合流

任务置 `DONE` 前按 `workMode.merge` 把分支合流回父分支，触发、目标与失败语义见
[merge.md](merge.md)；完成后删除 worktree：`git worktree remove .worktrees/<task_key>`。

## 验证清单

- `psycho-frame task check` 通过：hooks 互不相同、无孤儿 worktree、`DONE` 无残留。
- `change-scope` 输出的 merge-base 与预期父分支一致。
- main checkout 的 `change-scope` 不出现 `.worktrees/` 路径。
