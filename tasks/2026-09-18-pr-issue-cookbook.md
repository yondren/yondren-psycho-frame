# 提 issue/PR 的 cookbook 与模板

- task_key: pr-issue-cookbook
- status: DONE
- created: 2026-09-18
- updated: 2026-09-18
- report: [reports/pr-issue-cookbook.md](../reports/pr-issue-cookbook.md)

## 范围

本次包含：`docs/cookbook/submit-pr.md`（自动提 issue/PR 的协议与命令：该开什么、正文结构、
`gh` 命令、无 `gh`/非 GitHub 的回退、等 CI 与回应 review 的规则）；`.github/` 下的 PR 模板与
issue 模板（bug / feature）作为正文骨架；cookbook 索引、字数预算、官网页面映射、根 AGENTS.md
一行常驻命令；模板镜像与决策记录。

本次不包含：`psycho-frame pr` / `issue` 薄封装命令（本轮只做 cookbook + 模板 + `gh` 命令范式）、
自动合并或自动关闭 PR、`cookbook new` 与共享工具链范例（任务 `cookbook-authoring`）。

## 进度

- [DONE] 2026-09-18 worktree `pr-issue-cookbook` 内实现：cookbook、`.github/` 三个模板、门禁跳过
  `.local/`、索引与官网映射、模板镜像与决策记录。
- [DONE] 2026-09-18 验证：文档门禁通过（154 个文件）、测试 149 项全过、`task check` 通过、官网映射
  存在性校验通过。
- [DONE] 2026-09-18 已按 `workMode.merge=ask`（用户授权）合流到 `main`（`d9cbf7a`），worktree 已删除。
