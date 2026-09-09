# Agent Note: 发布脚本与两包锁步发布结构

Status: implemented

## Problem

发布流程全手工且易错：版本 bump 涉及两包 package.json 与模板 devDep pin 三处，任何一处
漏改都会产生不一致；已有事故先例（0.1.0 被误占无法覆盖，被迫 0.1.1 → 0.2.0 连续补救）。
更隐蔽的风险在 shim 包：`create-yondern-psycho-frame` 的 `workspace:^` 依赖发布后固化为
`^x.y.z`，核心包升 minor/major 后若漏发 shim，`npm create yondern-psycho-frame` 会静默
冻结在旧核心。是否可合并为单包发 npm 也被重新审视。

## Decision

- 保持两包锁步发布，不合并：`npm init foo` 无条件改写为 `npm exec create-foo`
  （npm CLI [init.js](https://github.com/npm/cli/blob/9c67f7932e85edd20c76b1413c9f3b200cd60754/lib/commands/init.js)），
  pnpm create 同样严格做 `create-` 前缀转换无回退
  （pnpm [create.ts](https://github.com/pnpm/pnpm/blob/main/pnpm11/exec/commands/src/create.ts)）；
  合并后 `npm create yondern-psycho-frame` 对新用户 E404，且已发布 shim 无法从 registry
  下架会永久冻结旧核心。生态惯例同向：vite、astro、svelte、vue、nuxt、next、solid 均
  单独发布 `create-*` 包。
- 新增零依赖 [scripts/release.mjs](../../../scripts/release.mjs)，根 package.json 暴露
  `pnpm release <bump>`：预检（git 干净、main 分支、无未推送提交）→ `pnpm install
  --frozen-lockfile`（workspace 协议转换需要链接状态）→ bump 两包 + 模板 pin
  → verify/doctor 门禁 → pack 预检（tarball 无 `.gitignore` 条目、shim 依赖已脱离
  `workspace:` 并固化为 `^x.y.z`、模板 pin 同步）→ commit（含 task_key）+ 注解 tag
  `vX.Y.Z` → `--publish` 按依赖序双发（pnpm 原生 publish，自动转换 workspace 协议）→
  `--push` 推 origin（推送前重查 origin/main OID 未变，租约保护）。
- 默认安全：不加 `--publish`/`--push` 时只做本地 bump/commit/tag；`--preview` 完全只读。
- 模板 pin 形状：稳定版 `^x.y.z`，预发布版精确 pin；脚本断言三处版本一致后才允许 bump。

## Alternatives considered

**合并为单包（主包内置 create bin，npm 只发一个）** — 否决：npm/pnpm 的 create 命令按包名
严格解析 `create-<initializer>`，不读主包 bin；合并即破坏 README 与 OSS 决策锁定的
`npm create` 上手路径，收益仅省一个 5 行转发 shim 的发布动作。

**changesets** — 否决：两包永远锁步同版本，无独立版本管理需求；changesets 的变更集、
PR 联动与 CI 编排对当前单维护者人工发布是纯开销。

**GitHub Actions 自动发布（NPM_TOKEN）** — 否决（暂缓）：仓库凭据纪律要求 token 不入
Git，且发布前人工确认（tarball 内容、npm view 结果）是当前惯例；脚本已把该人工环节
收敛为单个 `--publish` 开关，后续如需可在 workflow 中复用同脚本。

**shim 依赖改为 `*`/`latest` 让 npm create 永远转发最新核心** — 否决：安装结果随日期漂移、
不可复现，且放弃锁步后版本对应关系失去审计依据；锁步 + 脚本断言是更可验证的替代。

## Consequences

- 发布从手工清单收敛为一条命令；三处版本同步、shim 冻结风险与 `.gitignore` 打包陷阱
  由脚本断言看护，漏发 shim 不再可能。
- 仓库自本决策起使用 `vX.Y.Z` 注解 tag（此前无 tag）。
- 发布仍为本地人工触发；CI 自动发布列为后续可选项（复用同脚本）。
- 官网/README 的 `npm create yondern-psycho-frame@latest` 用法不变，两包仍锁步同版本。
