# 合流开关（merge）评估报告

- task_key: work-mode-merge
- 状态: NOT_STARTED（评估与提案完成，实现未开工）

## 1. 改了哪些文件

- `decisions/proposed/feature/2026-09-14-work-mode-merge.md`：新增提案（问题、方案、备选、验收、风险）
- `tasks/2026-09-14-work-mode-merge.md`：新增任务卡，状态 `NOT_STARTED`
- `reports/work-mode-merge.md`：本报告

未改代码、配置与既有文档；`merge` 开关的实现归后续任务。

## 2. 实现了什么

未实现。本次只做问题评估与设计定案：

- 定位"偶尔不主动合流"的四个契约缺口：完成定义止于提交（`tasks/README.md` 规则 2、
  `docs/development.md` 日常顺序）、`plan=on` 下无合流授权、会话绑定 worktree 与 main checkout
  做合流的规则冲突、没有"待合流"状态与可见性。
- 定案开关形态：`workMode.merge = off | ask | auto`，默认 `ask`，`auto` 只做本地 merge-forward
  到父分支（默认 `main`），**不含推送**；push 不并入开关。
- 定案配套：完成定义、报告字段、`doctor` 可见性三件同时做，否则开关不生效。

## 3. 跑了哪些命令

- 读 0.3.1 已发布内容：`git show v0.3.1:packages/psycho-frame/src/work-mode.mjs`、
  `git show v0.3.1:packages/psycho-frame/template/{AGENTS.md,docs/development.md,docs/cookbook/parallel-worktrees.md}`
- 消费者实测（本机 6 个 0.3.1 项目）：`git for-each-ref`、`git rev-list --count main..<branch>`、
  `git status --short --branch`、读各自 `.psycho-frame.json` 的 `workMode`
- 预算核算：按 `countWords` 口径统计 `.psycho-frame.json` 的 `budgets` 清单
- `node packages/psycho-frame/src/cli.mjs verify`（基线，改动前 119 个 Markdown 文件通过）

## 4. 验证结果

- 证据一（0.3.1 契约）：`workMode` 只有 `plan`、`confirmAmbiguous`；模板 `AGENTS.md` 不含 `main`、
  合流与推送命令；合流只出现在按需文档的一节里，且只有"怎么做"没有"谁在何时做"。
- 证据二（消费者分支模型）：6 个 0.3.1 项目共 103 个本地分支，其中 77 个为 `codex/*`，不是骨架的
  `.worktrees/<task_key>`。
- 证据三（未合流确实发生且不可见）：`typesugar-official-mp` 有 2 个、`yune-platform` 有 3 个分支
  领先 main；`zw` 的 main 领先 `origin/main` 36 个提交、`yune-platform` 领先 12 个；
  `TypeSugar-Website` main 有 31 个未提交文件；`YONDREN_shanwai` 无远端，`jmy-ai-school` 非 git 仓库。
- 证据四（无可见性通道）：`doctor` 只查必需文件、配置与脚本；`change-scope` 只算 merge-base；
  仓库内没有任何检查会指出"存在未合流分支"。
- 门禁：本次改动后跑 `verify`，见第 5 节。

## 5. 文档与决策是否同步

已同步。问题与设计写在提案
[decisions/proposed/feature/2026-09-14-work-mode-merge.md](../decisions/proposed/feature/2026-09-14-work-mode-merge.md)，
任务状态写在 [tasks/2026-09-14-work-mode-merge.md](../tasks/2026-09-14-work-mode-merge.md)；既有
`docs/` 与模板未改动，`merge` 语义在实现时才进 `docs/development.md`，避免提案期产生第二事实源。
改动后 `pnpm verify:docs` 通过（新增 2 个 Markdown 文件，共 121 个）。

## 6. 还剩什么阻塞

无阻塞。实现未开工，开工前须先建 `.worktrees/work-mode-merge` 并把任务置 `IN_PROGRESS`；落地时会撞上
常驻文档预算（`docs/development.md` 719/750、`docs/cookbook/fleet-mode.md` 396/400），需先搬迁或精简。
