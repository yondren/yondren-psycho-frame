# 提 issue 与 PR

把任务结果交给人类审查或跨仓协作时用本流程。Agent 可以直接开 issue 与 PR，但不合并、不关闭、
不改标签语义：合并仍按 `workMode.merge`（[merge.md](merge.md)）。

## 1. 先判断该开什么

| 场景 | 动作 |
| --- | --- |
| 可复现的缺陷、超出本次任务范围的发现、需要拍板的需求 | issue |
| 任务分支已提交、门禁通过、需要人审查 | PR |
| 单人仓库的本地收尾 | 都不开，直接合流 |

同一件事不重复开：先 `gh issue list --search "<关键词>"` 或 `gh pr list --search`，命中就补评论。

## 2. 正文只写可核对的事实

PR 用仓库模板（[.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md)）：范围、
改动面、验证证据（命令 + 退出码）、决策记录链接、风险与回退、未包含项、task_key。

issue 用 [.github/ISSUE_TEMPLATE/](../../.github/ISSUE_TEMPLATE/) 下的模板：现象、复现步骤、期望、
实际、环境、影响面、关联 task_key。草稿写到 `.local/`（已由 .gitignore 与门禁共同跳过），再
`--body-file` 提交，不要在命令行里拼多行正文；凭据、token、私有地址一律不进正文
（[AGENTS.md](../../AGENTS.md)）。

## 3. 命令（GitHub 优先）

```sh
gh issue create --title "<摘要>" --body-file .local/issue.md
gh pr create --base main --head <task_key> \
  --title "<type>(scope): <摘要> [<task_key>]" --body-file .local/pr.md
gh pr checks --watch
```

## 4. 没有 gh，或远端不是 GitHub

打印标题、正文与目标 URL，交人粘贴；不为此安装或登录新工具，凭据不落盘、不进仓库。

## 5. 等 CI 与回应 review

- CI 红：在任务分支追加修复提交；重写已推历史必须租约保护，禁止 raw `--force`。
- review 意见：逐条回复并追加提交，不静默改范围；范围变化就同步任务卡与报告。
- 合并与关闭由人决定，agent 不自动合并、不自动关闭。

## 验证清单

- PR 标题含 task_key，正文含验证命令与退出码。
- 本地 [最窄验证](../development.md)通过，`gh pr checks` 全绿。
- 同一问题没有重复单，issue/PR 正文不含凭据。
