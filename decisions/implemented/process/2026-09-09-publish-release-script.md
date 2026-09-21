# Agent Note: 发布脚本与两包锁步发布结构

Status: implemented

## Problem

发布流程全手工且易错：版本 bump 涉及两包 package.json 与模板 devDep pin 三处，任何一处
漏改都会产生不一致；已有事故先例（0.1.0 被误占无法覆盖，被迫 0.1.1 → 0.2.0 连续补救）。
更隐蔽的风险在 shim 包：`create-yondren-psycho-frame` 的 `workspace:^` 依赖发布后固化为
`^x.y.z`，核心包升 minor/major 后若漏发 shim，`npm create yondren-psycho-frame` 会静默
冻结在旧核心。是否可合并为单包发 npm 也被重新审视。

## Decision

- 保持两包锁步发布，不合并：`npm init foo` 无条件改写为 `npm exec create-foo`
  （npm CLI [init.js](https://github.com/npm/cli/blob/9c67f7932e85edd20c76b1413c9f3b200cd60754/lib/commands/init.js)），
  pnpm create 同样严格做 `create-` 前缀转换无回退
  （pnpm [create.ts](https://github.com/pnpm/pnpm/blob/main/pnpm11/exec/commands/src/create.ts)）；
  合并后 `npm create yondren-psycho-frame` 对新用户 E404，且已发布 shim 无法从 registry
  下架会永久冻结旧核心。生态惯例同向：vite、astro、svelte、vue、nuxt、next、solid 均
  单独发布 `create-*` 包。
- 零依赖 [scripts/release.mjs](../../../scripts/release.mjs) 支持 prepare/preview/resume/publish/push。
  准备须主 checkout 的干净 main、唯一 IN_PROGRESS 任务、HEAD 与 origin/main 精确相同，
  本地/远端 tag 无冲突；无远端读取结果即停止，不使用过期 tracking ref 判定。
- bump 后验证文档、内容、源码测试与 doctor；destroy=on 仍运行配置矩阵。pack 校验名称、版本、
  模板 pin、shim 依赖与路径；通过的同一 tarball 交给消费方教程冒烟并保存 SHA-512，再 commit/tag。
- 恢复记录存 Git common-dir/releases/<version>/：基线、受测树/提交/tag、registry、产物摘要、阶段与原文件。
  本地锁排除并发；准备 I/O 中断保留原文件供人工恢复，单文件状态原子替换，不承诺全局事务。
- 发布只用保存的 tarball；恢复逐包查 dist.integrity，相同跳过，不同拒绝，只有 E404 才视作缺失。
  第二包失败可同版本恢复；认证或网络错误不当作缺包。稳定版发布 latest、预发布 next，恢复不重设 tag。
- 发布/推送前复核 HEAD、受测树、tag、产物摘要和远端；origin 原子推 main/tag、再推 codeup mirror，
  显式租约防止竞态覆盖。mirror 失败可在 origin 已到发布 HEAD 的条件下恢复。
- 默认不发布不推送；发布只由显式 --publish 授权，--push 必须同用。模板稳定版 ^pin、预发布精确 pin。

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

版本、验证、产物、发布与推送可沿恢复记录核对；半发布无需为了补第二包再 bump。
实际发布文件与受测文件一致，仍无法撤销已发布版本；准备中断须人工核对原文件/提交/tag。
记录只存本地 Git 目录，清理前必须保留产物。真实 registry 权限、2FA、远端 CI 仍由发布环境负责。
