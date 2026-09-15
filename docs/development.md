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
2. 在 tasks/ 登记任务并置 `IN_PROGRESS`（[tasks/README.md](../tasks/README.md)）。
3. 为任务创建 worktree（[cookbook/parallel-worktrees.md](cookbook/parallel-worktrees.md)）。
4. 编码 / 改文档；微小改动（单点文案、无方案分歧）可跳过第 2、3 步，但须在提交前
   补登记，且不写 reports/ 与决策记录。
5. 验证：`pnpm change-scope --base <base-ref>` 取改动面，只跑覆盖该面的最窄检查；改
   `packages/` 时加跑 `pnpm test`。
6. 同步：非平凡变更更新或新增 decisions/ 决策记录与 reports/<task_key>.md（微小改动豁免）。
7. 门禁：`pnpm verify:docs` 通过后提交，提交信息含 task_key；完成顺序（含合流）见
   [tasks/README.md](../tasks/README.md)。

## 工作模式

工作模式真源在 [.psycho-frame.json](../.psycho-frame.json) 的 `workMode`：纪律开关 `plan`、
`confirmAmbiguous`、`fleet`、`merge`，加沟通语域 `audience` 与工程化 `engineering` 两条轴；
取值、语义与耦合矩阵的唯一家在 [modes.md](modes.md)。

调整方式：对话中直接要求，Agent 用 `psycho-frame mode set <key>=<value>` 持久化；也可运行
`psycho-frame mode`（查看）与 `mode reset`（恢复默认）。配置非法时 `pnpm verify:docs` 失败。

## 门禁分工

本地：`pnpm verify:docs` + `pnpm test` + 改动面匹配的最窄验证；全量矩阵归 CI。
漂移：`pnpm run doctor`；骨架升级用 `psycho-frame upgrade`（模板优先、本地改动自动备份、配置增量
合并），骨架偏差由 init/adopt/upgrade 测试看护（[packages/psycho-frame/test/](../packages/psycho-frame/test/)）。
CI：门禁、doctor、测试在 Node 20/22 上跑，PR 与 main 都触发
（[.github/workflows/ci.yml](../.github/workflows/ci.yml)）。

## 包发布

- 入口：[scripts/release.mjs](../scripts/release.mjs) 经 `pnpm release <bump>` 执行；默认只做
  bump/commit/tag，`--publish` 才发布、`--push` 才推送、`--preview` 只读预览。
- 私有性：根 package.json 与模板 package.json 带 `private`，发布包不带。
- 版本：semver；门禁脚本与模板的破坏性变更升 major，doctor 负责提示漂移。
- 顺序：脚本按依赖序先 `yondren-psycho-frame` 后 `create-yondren-psycho-frame`，两包锁步同版本。
- 升级：发布新版后，旧版 CLI 在交互终端运行任意命令时提示 `self-upgrade`（行为见
  [psycho-frame README](../packages/psycho-frame/README.md)）。
