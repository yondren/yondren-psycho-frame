# 骨架评审修复与 DSH 官方门禁对齐 执行报告

- task_key: skeleton-review-fixes
- 状态: DONE

## 1. 改了哪些文件

- scripts/：verify-docs.mjs（四组检查：链接与锚点、决策结构与格式、任务头字段、预算）、
  change-scope.mjs（parseArgs/-z/merge-base 唯一性/版本化报告）、doc-budgets.manifest.json（4→11 文件）
- decisions/：README（归档语义、Status 语法、封闭类别、格式）、AGENTS、
  implemented/process/2026-09-07-skeleton-review-gate-alignment.md（新）
- tasks/：README（头字段门禁、微小改动豁免）、AGENTS、2026-09-07-skeleton-review-fixes.md（新）
- docs/：AGENTS（锚点校验）、architecture（门禁描述与现态措辞）、development（豁免统一与现态措辞）、
  cookbook/parallel-worktrees（现态措辞）
- 根：AGENTS.md（修断引用）、README.md（门禁覆盖面）、package.json（删 doc-sync、加 packageManager）、
  .gitignore（.pnpm-store/）、pnpm-lock.yaml（提交）
- .agents/skills/verify-before-push/SKILL.md（--head 与报告结构说明）

## 2. 实现了什么

评审 P1–P3 全部修复；对照 DSH 官方仓库的 gap 盘点并落地低代价对齐项（归档头部语义、
Status 语法、类别封闭集合、implemented 禁提案期章节、锚点校验、change-scope 健壮性）。

## 3. 跑了哪些命令

- git switch -c skeleton-review-fixes（沙箱拒绝 workspace 外 worktree，单 checkout 分支隔离）
- node scripts/verify-docs.mjs（门禁自检 + 构造失败用例的负向验证，见第 4 节）
- node scripts/change-scope.mjs --base main（改动面报告，merge-base 与 main 一致）

## 4. 验证结果

- 负向用例（临时构造，逐个被拦后删除）：缺 task_key 的任务文件、未知类别目录、
  archived/ 内 `Status: archived`（应为 implemented + Archived: 行）、死 `#锚点`、
  rejected 缺 Status 原因、implemented 含 `## Acceptance criteria`——全部按预期报错。
- 门禁：21 个 Markdown 文件全部通过（链接与锚点可解析、决策结构与格式合规、任务头字段合规、预算达标）。
- change-scope：输出 versioned JSON，committed 覆盖本次改动面，mergeBaseSha 与 main 一致。

## 5. 文档与决策是否同步

- 已同步：决策记录
  [decisions/implemented/process/2026-09-07-skeleton-review-gate-alignment.md](../decisions/implemented/process/2026-09-07-skeleton-review-gate-alignment.md)、
  本报告、[tasks/2026-09-07-skeleton-review-fixes.md](../tasks/2026-09-07-skeleton-review-fixes.md)；
  docs/ 相关描述同步更新。

## 6. 还剩什么阻塞

- 无阻塞。gap 盘点产出的后续候选（未登记任务）：CI 接入与 run-gates 式门禁汇总、
  lefthook + worktree hooks 隔离 installer、归档冻结 manifest（sha256 append-only）、
  verify-md-wrap 移植、dsh-doc / dsh-prose-standard / dsh-archive-agent-notes skills 移植、
  业务代码出现后的 catalog 生成器族与 doc-typecheck / translation-pairing。
