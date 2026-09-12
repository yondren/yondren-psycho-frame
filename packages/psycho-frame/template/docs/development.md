# 开发工作流

## 环境

- Node.js ≥ 18.20，Git ≥ 2.26（worktree 级配置需要）；pnpm 由 `packageManager` 锁定，
  首次用 `corepack enable` 激活。
- 门禁由 [yondren-psycho-frame](https://www.npmjs.com/package/yondren-psycho-frame)
  提供，零依赖；`pnpm verify:docs` 缺 devDependency 时会先自动装好，无需手动 install。
- 一个 checkout 只用 pnpm：npm/yarn 生成的 `node_modules` 会被 pnpm 判为异类，而 agent
  沙箱写不了 `~/.npm` 缓存（EPERM），混用只会卡住门禁。

## 日常顺序

1. 读 [architecture.md](architecture.md) 与相关 decisions/。
2. 在 tasks/ 登记任务并置 `IN_PROGRESS`（[tasks/README.md](../tasks/README.md)）。
3. 为任务创建 worktree（[cookbook/parallel-worktrees.md](cookbook/parallel-worktrees.md)）。
4. 编码 / 改文档；微小改动（单点文案、无方案分歧）可跳过第 2、3 步，但须在提交前
   补登记，且不写 reports/ 与决策记录。
5. 验证：`pnpm change-scope --base <base-ref>` 取改动面，只跑覆盖该面的最窄检查。
6. 同步：非平凡变更更新或新增 decisions/ 决策记录与 reports/<task_key>.md（微小改动豁免）。
7. 门禁：`pnpm verify:docs` 通过后提交，提交信息含 task_key。

## 门禁接入（既有项目）

`adopt` 只增不改：既有 `package.json` 缺脚本时手动并入 `scripts`，并把
`yondren-psycho-frame` 加进 `devDependencies`：

```json
"verify:docs": "psycho-frame verify",
"change-scope": "psycho-frame scope",
"doctor": "psycho-frame doctor"
```

`pnpm run doctor` 复查接入完整性；没有 Node 工程时在 workspace 内用
`npx --yes --cache ./.npm-cache yondren-psycho-frame verify` 免安装运行门禁。

## 工作模式

工作模式是每次会话的行为开关，真源在 [.psycho-frame.json](../.psycho-frame.json) 的
`workMode` 字段：`plan`（`on`/`off`，默认 `on`）与 `confirmAmbiguous`（`true`/`false`，
默认 `true`）。

- `plan=on`：plan 模式。改动文件前先在对话中给出实施计划，经用户确认后才动手。
- `plan=off`：动手前仍显式说明将要执行的计划，但不等待确认。
- `confirmAmbiguous=true`：需求不明确（未确认的需求、歧义、缺失信息）必须先向用户确认，禁止自行假设。
- `confirmAmbiguous=false`：允许合理假设并继续，假设须在计划或报告中显式标注。

调整方式：对话中直接要求，Agent 用 `psycho-frame mode set <key>=<value>` 持久化；也可自行
运行 `psycho-frame mode`（查看）与 `psycho-frame mode reset`（恢复默认）。取值封闭，配置非法
时 `pnpm verify:docs` 失败。

## 门禁分工

本地：`pnpm verify:docs` + 改动面匹配的最窄验证；全量矩阵归 CI。
结构漂移：`pnpm run doctor`；旧项目补齐用 `psycho-frame adopt .`（只增不改）；骨架文件随模板
升级用 `psycho-frame upgrade`（模板优先、被覆盖的本地改动自动备份、配置增量合并）。
