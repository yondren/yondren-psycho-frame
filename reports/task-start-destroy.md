# task start 命令与毁灭模式门禁 执行报告

- task_key: task-start-destroy
- 状态: DONE

## 1. 改了哪些文件

- 新增 `packages/psycho-frame/src/worktree.mjs`：`startTask`（一条命令开 worktree）、
  `checkWorktrees`（纪律检查引擎）、任务卡与报告骨架、`samePath` / `isLinkedWorktree` 等辅助。
- 新增 `packages/psycho-frame/src/destroy.mjs`：毁灭门禁 `destroyGate`、`scanSecrets`、
  `destroyChecks` 校验、`runCheck`（矩阵执行 + 自递归守卫）、`activeTask`。
- `packages/psycho-frame/src/work-mode.mjs`：`MODES` 表加 `destroy`（on/off，默认 off），
  导出 `DESTROY_VALUES`；mode CLI 的键、回显、set/reset 由该表自动派生。
- `packages/psycho-frame/src/change-scope.mjs`：抽出 `collectChangeScope` 与 `changedPaths` 供毁灭
  门禁复用，`run` 行为不变。
- `packages/psycho-frame/src/cli.mjs`：新增 `task start` / `task check` 子命令，`verify` 支持
  `--base` 并在 `destroy=on` 时并入毁灭门禁（`--json` 增 `destroy` / `checks` 字段），帮助文本与
  示例同步。
- 测试：新增 `test/worktree.test.mjs`（17 项）、`test/destroy.test.mjs`（14 项），扩写
  `test/cli.test.mjs`、`test/work-mode.test.mjs`、`test/init.test.mjs`、`test/helpers.mjs`
  （新增可跑 git 的 `gitFixture` / `gitIn` 夹具）。
- 文档：[AGENTS.md](../AGENTS.md)、[docs/modes.md](../docs/modes.md)（新增「毁灭模式」节）、
  [docs/architecture.md](../docs/architecture.md)、[docs/development.md](../docs/development.md)、
  [docs/cookbook/parallel-worktrees.md](../docs/cookbook/parallel-worktrees.md)、
  [tasks/README.md](../tasks/README.md)、[packages/psycho-frame/README.md](../packages/psycho-frame/README.md)。
- 配置：[.psycho-frame.json](../.psycho-frame.json) 加 `destroyChecks`、`workMode.destroy` 与预算上调。
- 模板同步：`template/AGENTS.md`、`template/docs/{modes,architecture,development}.md`、
  `template/docs/cookbook/parallel-worktrees.md`、`template/tasks/README.md`、
  `template/.psycho-frame.json`。
- 决策：[毁灭模式门禁](../decisions/implemented/process/2026-09-18-destroy-mode-gate.md)、
  [task start](../decisions/implemented/process/2026-09-18-task-start-cli.md)，并同步
  [嵌套 worktree 布局](../decisions/implemented/process/2026-09-09-worktree-parallel.md)中已失效的事实
  （会话绑定已由门禁校验）。

## 2. 实现了什么

`psycho-frame task start <task_key>` 把「登记任务 + 开 worktree + 隔离 hooks」收敛成一条命令：
建分支与 `.worktrees/<task_key>`、写任务卡（`IN_PROGRESS`）与报告占位、开 `extensions.worktreeConfig`
并设该 worktree 的 `core.hooksPath`、缺 `.worktrees/` 时补 `.gitignore`；幂等，且拒绝在 linked
worktree 内执行。`psycho-frame task check` 校验：`IN_PROGRESS` 必须有 worktree、`DONE` 不留
worktree、无孤儿 worktree、根 checkout 不检出任务分支、各 worktree 的 `core.hooksPath` 互不相同、
`BLOCKED` / `DEFERRED` 必须写原因。

`workMode.destroy` 是第七把开关（默认 off），打开后 `verify` 追加 worktree 纪律、任务绑定、显式
`--base`、改动面必须带决策记录、提交含 task_key、凭据扫描（只报位置不回显、可豁免）、
`destroyChecks` 全量矩阵；只加严，不改动其他开关。本仓库 `destroyChecks` 配 `pnpm test` +
`pnpm run doctor`。

## 3. 跑了哪些命令

- 开 worktree（本任务开工时该命令尚未存在，用当时 cookbook 的手工命令）：
  `git worktree add .worktrees/task-start-destroy -b task-start-destroy main` +
  `git config extensions.worktreeConfig true` + `git config --worktree core.hooksPath ...`。
- `node --test packages/psycho-frame/test/*.test.mjs`（147 项）。
- `node packages/psycho-frame/src/cli.mjs task check`、`... verify`、`... scope --base main`。
- 毁灭模式自审：`mode set destroy=on` → `verify --base main` → 失败一次（矩阵内 `pnpm test` 被
  门禁标记影响，已修测试隔离）→ 复跑全绿 → `mode set destroy=off`。

## 4. 验证结果

- 测试：147 项全过；`PSYCHO_FRAME_DESTROY_CHECK=1`（模拟门禁内跑测试）下同样 147 项全过。
- `task check`：worktree 纪律通过（任务卡与 `.worktrees/` 一一对应、根 checkout 干净、hooks 已隔离）。
- 毁灭模式自审：`verify --base main` 退出码 0，`[ok] pnpm test`、`[ok] pnpm run doctor`，
  总耗时约 4 秒；`--json` 里 `destroy: true`、`checks` 两条。
- 毁灭门禁有牙（当场演示）：缺 `--base` → 退出码 1 并给出显式提示；放入含假 token 的临时文件 →
  `leak-demo.md:1: 疑似GitHub token（内容不回显）`，删除后复跑恢复全绿。
- 边界：macOS `/tmp` 与 `/private/tmp` 软链导致的路径比较失效已用 `samePath`（realpath）修正，
  否则 `task start` 的幂等判断会误判。

## 5. 文档与决策是否同步

同步。事实分层：模式语义（含门禁清单与 `destroyChecks`）的唯一家在
[docs/modes.md](../docs/modes.md)；命令用法在家 [packages/psycho-frame/README.md](../packages/psycho-frame/README.md)
与 [cookbook](../docs/cookbook/parallel-worktrees.md)；常驻命令在 [AGENTS.md](../AGENTS.md)（含模板
镜像）。决策记录两条新增 + 一条事实同步，均与本提交同一提交。预算按文档标准「先搬迁、再精简、
最后显式提高并说明理由」上调：`docs/modes.md` 850→1320、`AGENTS.md` 550→680、
`docs/architecture.md` 600→740、`docs/cookbook/parallel-worktrees.md` 400→480、
`tasks/README.md` 300→320（模板侧同步），理由是新增了模式与命令两类新事实，未搬迁的原因是这些
文档已各自处在正确的层级。

## 6. 合流状态

已按 `workMode.merge=ask`（用户确认）合流到 `main`：任务提交 `0175526`、合流提交 `9b32987`
（`git merge --no-ff task-start-destroy`），worktree `.worktrees/task-start-destroy` 已删除。

## 7. 还剩什么阻塞

无。后续任务：`pr-issue-cookbook`、`cookbook-authoring`。
