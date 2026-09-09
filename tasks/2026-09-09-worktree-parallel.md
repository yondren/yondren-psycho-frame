# 嵌套 worktree 真并行启用

- task_key: worktree-parallel
- status: DONE
- created: 2026-09-09
- updated: 2026-09-09
- report: [reports/worktree-parallel.md](../reports/worktree-parallel.md)

## 范围

本次包含：cookbook 布局从兄弟目录 `../<project>-<task_key>` 切换为嵌套
`.worktrees/<task_key>`；verify-docs 门禁遍历跳过 `.worktrees/`；模板与官网页面同步；
探针验证嵌套 worktree 的创建、hooks 隔离与改动面行为。

本次不包含：lefthook + hooks 隔离 installer、run-gates 式门禁汇总、每 worktree 一个
DSH workspace 的部署级方案、归档冻结 manifest。

## 进度

- [DONE] 2026-09-09 布局切换、门禁跳过、模板与官网同步落地，探针验证通过，变更已提交。
