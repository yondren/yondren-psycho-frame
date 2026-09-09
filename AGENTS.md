# AGENTS.md

本文件只放每次会话必须在场的常驻命令，每条 1–3 句并链接它的"家"。
文档分层与书写规则见 [docs/AGENTS.md](docs/AGENTS.md)；决策记录规则见
[decisions/README.md](decisions/README.md)；任务规则见 [tasks/README.md](tasks/README.md)。

## 开发顺序
先规划、再编码、再验证、再更新文档。任何非微小变更前，先读
[docs/architecture.md](docs/architecture.md) 与主题相关的 decisions/ 决策记录；微小改动的判定见
[docs/development.md](docs/development.md)，非平凡变更的计划走 [decisions/](decisions/README.md) 提案格式。

## 工作模式
工作模式真源在 [.psycho-frame.json](.psycho-frame.json) 的 `workMode`（`plan`、`confirmAmbiguous`）；
语义与调整方式见 [docs/development.md](docs/development.md)。对话中可直接要求调整，Agent 用
`psycho-frame mode set` 持久化；也可自行运行 `psycho-frame mode` 查看或 `mode reset` 恢复默认。

## 文档门禁
- 每个事实只有一个家（one home per fact），其余位置只放相对链接。
- 文档只写当前状态，不写变更史；变更史放 commit 与 reports/。
- 每次非平凡变更必须在同一提交中新增或更新至少一条 decisions/ 决策记录。
- 新增、移动、重命名文档后同步更新所属索引；提交前跑 `pnpm verify:docs`。

## 任务与并行
- 任务状态真源在 tasks/（Git 内），开工前先登记任务并置 `IN_PROGRESS`。
- 每个任务一个 git worktree，并行任务永不共享 checkout；流程见
  [docs/cookbook/parallel-worktrees.md](docs/cookbook/parallel-worktrees.md)。
- 提交信息必须包含 task_key；禁止 raw `--force` 推送，重写已推历史必须租约保护。
- 推送：`git push origin main`（GitHub 主远端）+ `git push codeup main:mirror`（codeup 备份）；
  远端拓扑与历史策略见
  [decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md](decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md)。

## 验证
本地只跑与改动面匹配的最窄验证：先 `pnpm change-scope --base <ref>` 取改动面，再选覆盖该面的检查；全量矩阵由 CI 拥有。

## 凭据
凭据、access token、app secret 禁止写入 Git、报告或聊天摘要。
