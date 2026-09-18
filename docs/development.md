# 开发工作流

## 环境

- Node.js ≥ 22.13（engines 与 [.nvmrc](../.nvmrc) 锁此下限，pnpm 11.20 同要求；发布包对消费者
  为 ≥ 18.20），Git ≥ 2.26（worktree 级配置需要），pnpm 按 packageManager 锁版本。
- 门禁零依赖：`node packages/psycho-frame/src/cli.mjs verify` 无需 install；
  `pnpm install` 建 workspace 链接后可用 `pnpm verify:docs` 等价入口。
- 装依赖只用 pnpm：npm/npx 写不了沙箱外缓存（EPERM），混装会让 pnpm 拒绝重建 `node_modules`。
- 测试零依赖：`pnpm test` 跑 `packages/psycho-frame/test/`（node:test），同样无需 install。

## 日常顺序

1. 读 [architecture.md](architecture.md) 与相关 decisions/。
2. 开工：`psycho-frame task start <task_key>` 一条命令登记任务（`IN_PROGRESS`）、建 worktree 与报告
   占位并隔离 hooks（[cookbook/parallel-worktrees.md](cookbook/parallel-worktrees.md)）；微小改动
   （单点文案、无方案分歧）可跳过，但须在提交前补登记，且不写 reports/ 与决策记录。
3. 编码 / 改文档。
4. 验证：`pnpm change-scope --base <base-ref>` 取改动面，只跑覆盖该面的最窄检查；改
   `packages/` 时加跑 `pnpm test`。
5. 同步：非平凡变更更新或新增 decisions/ 决策记录与 reports/<task_key>.md（微小改动豁免）。
6. 门禁：`pnpm verify:docs` 通过后提交，提交信息含 task_key；完成顺序（含合流）见
   [tasks/README.md](../tasks/README.md)。

## 工作模式

工作模式真源在 [.psycho-frame.json](../.psycho-frame.json) 的 `workMode`：纪律开关 `plan`、
`confirmAmbiguous`、`fleet`、`merge`、`destroy`，加沟通语域 `audience` 与工程化 `engineering`
两条轴；取值、语义与耦合矩阵的唯一家在 [modes.md](modes.md)。

调整方式：对话中直接要求，Agent 用 `psycho-frame mode set <key>=<value>` 持久化；也可运行
`psycho-frame mode`（查看）与 `mode reset`（恢复默认）。配置非法时 `pnpm verify:docs` 失败。

## 门禁分工

本地：`pnpm verify:docs` + `pnpm test` + 改动面匹配的最窄验证；全量矩阵归 CI。`destroy=on` 时
[modes.md](modes.md) 的毁灭门禁并入 `verify`：worktree 纪律、决策记录、task_key、凭据扫描与
`destroyChecks` 全量矩阵，`--base` 必填。
漂移：`pnpm run doctor`（含骨架漂移提示）；骨架升级用 `psycho-frame upgrade`（模板优先、本地改动
自动备份、配置增量合并），在根 checkout 原地进行、不建 worktree
（[cookbook/skeleton-upgrade.md](cookbook/skeleton-upgrade.md)），骨架偏差由 init/adopt/upgrade 测试
看护（[packages/psycho-frame/test/](../packages/psycho-frame/test/)）。
CI：门禁、doctor、测试在 Node 20/22 上跑，PR 与 main 都触发
（[.github/workflows/ci.yml](../.github/workflows/ci.yml)）。

## 包发布

- 入口：`pnpm release:prepare <bump> --task-key=<key>` 只做准备（bump、门禁、pack 预检、
  commit + tag），结尾打印发布交接命令；`pnpm release <bump> --publish --push` 一次跑完。
  全流程（准备 → 发布 → 核对 → 推送 → 留痕）见 [cookbook/release.md](cookbook/release.md)。
- 私有性：根 package.json 与模板 package.json 带 `private`，发布包不带。
- 版本：semver；门禁脚本与模板的破坏性变更升 major，doctor 负责提示漂移。
- 升级：发布新版后，旧版 CLI 在交互终端运行任意命令时提示 `self-upgrade`（行为见
  [psycho-frame README](../packages/psycho-frame/README.md)）。
