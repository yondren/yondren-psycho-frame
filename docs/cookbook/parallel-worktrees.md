# 并行 worktree 工作流

铁律：一个任务一个 worktree，并行任务永不共享 checkout。合并采用 merge-forward；
重写已推历史必须租约保护；禁止 raw `--force`。

例外：骨架升级改的是全仓库共享的根文件，在根 checkout 原地进行、不建 worktree
（[skeleton-upgrade.md](skeleton-upgrade.md)）。

worktree 布局：嵌套 `.worktrees/<task_key>`（理由见
[决策记录](../../decisions/implemented/process/2026-09-09-worktree-parallel.md)）。

## 1. 为任务创建 worktree

```sh
git worktree add .worktrees/<task_key> -b <task_key> main
```

## 2. 依赖供给

门禁零依赖，worktree 里可直接 `node packages/psycho-frame/src/cli.mjs verify`；需要 workspace
链接或官网构建时才安装，且只用 pnpm：

```sh
CI=true pnpm install --frozen-lockfile
```

包管理器规则见 [development.md](../development.md)；不要软链或复制 `node_modules`。

## 3. 启用 worktree 级配置并隔离 hooks（一次 + 每 worktree）

```sh
git config extensions.worktreeConfig true
git config --worktree core.hooksPath \
  "$(git rev-parse --git-dir)/hooks-$(git branch --show-current)"
```

说明：linked worktree 共享 hooks 目录，不隔离会互相覆盖（见 DSH 官方
[worktree-local-lefthook 决策记录](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/process/2026-07-27-worktree-local-lefthook.md)）；
骨架不内置 installer。

## 4. 会话绑定

一个对话只在自己的 `.worktrees/<task_key>` 内工作，文件路径以它为前缀；
main checkout 只做合流，不在其中编码。

## 5. 改动面与验证

```sh
pnpm change-scope --base <父分支 ref>   # 显式 base，绝不猜 origin/<branch>
```

## 6. 合流

任务置 `DONE` 前按 `workMode.merge` 把分支合流回父分支，触发、目标与失败语义见
[merge.md](merge.md)；完成后删除 worktree：`git worktree remove .worktrees/<task_key>`。

## 验证清单

- 每个 worktree 的 `core.hooksPath` 互不相同。
- `change-scope` 输出的 merge-base 与预期父分支一致。
- main checkout 的 `change-scope` 不出现 `.worktrees/` 路径。
