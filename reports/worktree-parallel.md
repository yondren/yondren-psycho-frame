# 嵌套 worktree 真并行启用 执行报告

- task_key: worktree-parallel
- 状态: DONE

## 1. 改了哪些文件

- [docs/cookbook/parallel-worktrees.md](../docs/cookbook/parallel-worktrees.md)：布局切换为嵌套
  `.worktrees/<task_key>`，新增"会话绑定"步骤与验证清单项（main 改动面不含 `.worktrees/`）。
- [packages/psycho-frame/template/docs/cookbook/parallel-worktrees.md](../packages/psycho-frame/template/docs/cookbook/parallel-worktrees.md)：模板同步（模板为源）。
- [packages/psycho-frame/src/verify-docs.mjs](../packages/psycho-frame/src/verify-docs.mjs)：目录遍历跳过 `.worktrees`。
- [decisions/implemented/process/2026-09-09-worktree-parallel.md](../decisions/implemented/process/2026-09-09-worktree-parallel.md)：决策记录（新）。
- [tasks/2026-09-09-worktree-parallel.md](../tasks/2026-09-09-worktree-parallel.md)：任务登记（新）。
- `website/src/guide/parallel-worktrees.md`：sync-content 生成物（gitignore，不入库）。

## 2. 实现了什么

嵌套 `.worktrees/` 布局让并行铁律在当前沙箱部署可执行：worktree 建在 workspace 内，
git 机制保证同一分支不可双重检出；门禁遍历跳过嵌套副本；会话绑定写入 cookbook。

## 3. 跑了哪些命令

- `git worktree add .worktrees/probe -b probe-wt main`（探针创建）与 `git worktree remove`
  （探针清理，含 `prune` 与分支删除）。
- `pnpm verify:docs`：main 根（探针在场与清理后各一次，比对扫描文件数）。
- 探针内 `node packages/psycho-frame/src/cli.mjs verify`（探针自身副本，71 文件全过）。
- 探针内 `pnpm change-scope --base main`（mergeBaseSha == main HEAD，四层皆空）。
- 探针内 `git config --worktree core.hooksPath "$(git rev-parse --git-dir)/hooks-probe-wt"`。
- `pnpm change-scope --base main`（main 根改动面）。
- `node website/scripts/sync-content.mjs`（官网 12 页同步）。

## 4. 验证结果

- 探针创建与删除干净；清理后 `git worktree list` 恢复单条 main。
- main 根 verify：探针在场时唯一报错为 tasks 链接缺 report，补写本报告后通过；
  探针清理前后扫描文件数一致（86 == 86，跳过 `.worktrees/` 生效）。
- 探针内 verify 71 文件全过；change-scope mergeBaseSha 与 main 一致。
- main 与探针 `core.hooksPath` 互异（`.git/hooks-main` vs `.git/worktrees/probe/hooks-probe-wt`）。
- main 根 change-scope 的 untracked 层不出现 `.worktrees/` 路径（gitignore + exclude-standard 生效）。
- cookbook 词数 132/131，预算 350 内。

## 5. 文档与决策是否同步

- 已同步：决策记录
  [decisions/implemented/process/2026-09-09-worktree-parallel.md](../decisions/implemented/process/2026-09-09-worktree-parallel.md)
  （交叉链接 [2026-09-07-skeleton-review-gate-alignment](../decisions/implemented/process/2026-09-07-skeleton-review-gate-alignment.md)）、
  本报告、任务文件、cookbook（仓库 + 模板）、官网生成页。

## 6. 还剩什么阻塞

- 无阻塞。后续候选（未登记任务）：lefthook + hooks 隔离 installer、run-gates 式门禁
  汇总、每 worktree 一个 DSH workspace 的部署级方案。
