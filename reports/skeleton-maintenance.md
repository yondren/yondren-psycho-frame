# 骨架维护模式 执行报告

- task_key: skeleton-maintenance
- 状态: IN_PROGRESS（实现与验证完成，待合流）

## 1. 改了哪些文件

门禁与 CLI：

- `packages/psycho-frame/src/init.mjs`：新增 `isFrameworkRepo`（框架源码仓库的唯一判定）与
  `skeletonDrift`（对比包内模板，排除 README.md 与三类增量合并文件）；doctor 新增骨架漂移 note。
- `packages/psycho-frame/src/upgrade.mjs`：新增 linked worktree 入口守卫（比较 `--git-dir` 与
  `--git-common-dir`），框架源码仓库判定改为复用 `isFrameworkRepo`。
- `packages/psycho-frame/src/cli.mjs`：usage 与 `help upgrade` 增补 linked worktree 中止说明。

文档：

- 新增 `docs/cookbook/skeleton-upgrade.md` 与模板副本：进入条件、步骤、并发收束、验证清单。
- `docs/cookbook/README.md` 与模板副本：索引新增一行。
- `docs/cookbook/parallel-worktrees.md` 与模板副本：铁律下方新增例外一条。
- 根 `AGENTS.md` 与模板 `AGENTS.md`：常驻一行（漂移线索 + 原地升级不建 worktree）。
- `docs/development.md` 与模板副本：门禁分工补骨架漂移提示与 cookbook 链接。
- `packages/psycho-frame/README.md`：`upgrade` 与 `doctor` 两行同步。
- `docs/architecture.md`：doctor 的骨架漂移与 upgrade 的两处入口中止。
- `.psycho-frame.json` 与模板副本：新增 `docs/cookbook/skeleton-upgrade.md` 预算 400。

测试：

- 新增 3 项：upgrade 在 linked worktree 内中止、根 checkout 仍可升级；doctor 骨架漂移 note（干净
  脚手架不提示、漂移 2 个文件时提示、框架源码仓库返回 null）；`help upgrade` 说明两处入口守卫。

决策与流程：

- `decisions/proposed/process/2026-09-15-skeleton-upgrade-in-place.md` 转为
  `decisions/implemented/process/2026-09-15-skeleton-upgrade-in-place.md`。
- `tasks/2026-09-15-skeleton-maintenance.md` 与本报告。

## 2. 实现了什么

骨架升级有了明确的执行位置与可判定的线索。`upgrade` 在两个入口中止且不落盘：框架源码仓库（既有
守卫）与 linked worktree（新增，升级改的是全仓库共享的根文件，须在根 checkout 原地执行）。doctor
对比包内模板后给出一条漂移 note——报出本地改动数与缺失数并指向 `upgrade --dry-run`，只记 note、
不改变退出码；框架源码仓库是模板源头，跳过比较。漂移线索与原地升级要求以各一行写进常驻
`AGENTS.md`，升级流程、并发收束（在飞 worktree 逐个 merge-forward 后重跑门禁）与验证清单独立成
cookbook 页。

实现取舍：不做持久 `workMode.skeleton` 开关（忘关会让后续任务都在根 checkout 上编码）、不让
upgrade 自建临时 worktree（产物本就是根 checkout 的共享文件）、不写骨架版本号（版本由 npm 包与
`self-upgrade` 表达，仓库内只比较文件内容）。

## 3. 跑了哪些命令

```sh
node packages/psycho-frame/src/cli.mjs verify              # 130 个 Markdown 文件
node --test packages/psycho-frame/test/*.test.mjs          # 106 项
node packages/psycho-frame/src/cli.mjs doctor              # 框架源码仓库不比较模板
node packages/psycho-frame/src/cli.mjs upgrade --dry-run   # 本仓库内被入口守卫拦下，退出码 1
node packages/psycho-frame/src/cli.mjs scope --base main
```

## 4. 验证结果

- 门禁通过（链接与锚点、决策结构、任务头字段、字数预算、工作模式取值全绿）；测试 106 项全通过。
- 真实演练：在 linked worktree 内跑 `upgrade --dry-run` 被入口守卫拦下、不落盘（本仓库命中的是框架
  源码仓库守卫，linked worktree 守卫由 upgrade 测试在消费方形态的仓库中覆盖）；`doctor` 在框架源码
  仓库不报骨架漂移，在脚手架项目里改一个、删一个骨架文件后报"2 个骨架文件与模板不一致（缺失
  1 个）"。
- 预算（接近上限者）：`AGENTS.md` 543/550、`docs/architecture.md` 590/600、
  `docs/cookbook/skeleton-upgrade.md` 394/400、`docs/cookbook/parallel-worktrees.md` 386/400。

## 5. 文档与决策是否同步

同步。流程的唯一家在 `docs/cookbook/skeleton-upgrade.md`，铁律例外在 `parallel-worktrees.md`，
`AGENTS.md` 只放一行常驻触发；模板与自举实例同批更新（AGENTS.md、docs/development.md、
docs/cookbook/README.md、docs/cookbook/parallel-worktrees.md、docs/cookbook/skeleton-upgrade.md、
.psycho-frame.json）；产品面（CLI 文案与 packages README）同步；决策记录由提案转 implemented。

## 6. 合流状态

分支 `skeleton-maintenance`（worktree `.worktrees/skeleton-maintenance`）尚未合流，等用户确认后
merge-forward 到 `main`。

## 7. 还剩什么阻塞

无。合流后本次两份提案（语域/工程化两条轴、骨架维护模式）全部落地。
