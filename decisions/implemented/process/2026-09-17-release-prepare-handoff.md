# Agent Note: 发布准备入口与发布交接块

Status: implemented

## Problem

发布脚本已覆盖全部准备动作，但"只准备、不发布"只是"不加 `--publish`"这一条口头约定：准备与发布
共用 `pnpm release` 入口，多打一个开关就会真的双发不可覆盖的版本；准备结束后只打印一行 publish
命令，缺核对与推送的完整交接，并漏掉 AGENTS.md 要求的 codeup 镜像；release commit 的 task_key
硬编码为 `publish-release-script`，与 tasks/ 真源对不上，当次发布任务无法从提交追溯。

## Decision

- 新增 `--prepare` 只准备模式，与 `--publish`/`--push` 互斥（同时给出即报错）；根 package.json
  暴露 `pnpm release:prepare`，让"只准备"成为不可能误发的独立入口。
- 新增 `--task-key=<key>`：release commit 写 `[<key>]`，默认 `publish-release-script`；脚本在预检
  阶段断言 tasks/ 下存在同名任务卡，发布提交必须可追溯到任务真源。
- 准备结束打印可直接复制的交接块：两条 publish（按依赖序）→ registry 核对 → 推 origin main 与
  tag → 推 codeup 镜像，并附发布前回退命令。
- `--push` 补 codeup 镜像推送；origin 成功而 codeup 失败时只告警并打印手动补推命令，不让镜像故障
  掩盖已完成的 origin 推送。

## Alternatives considered

**维持现状，只在文档里写清"不加 `--publish`"** — 否决：约定拦不住误操作，准备与发布共用一个入口，
交接信息仍要人工拼装。

**独立脚本 `scripts/prepare-release.mjs`** — 否决：会与 release.mjs 重复预检、门禁、pack 预检与
commit 逻辑，两处漂移风险高于一个互斥开关。

**准备步骤结束后自动 publish** — 否决：npm 凭据与 2FA 属维护者，且版本发布不可覆盖，人工确认环节
保留（[2026-09-09-publish-release-script.md](2026-09-09-publish-release-script.md)）。

## Consequences

- 发布前准备收敛为一条命令，误发路径由开关互斥封死；交接块可整块复制执行。
- release commit 的 task_key 由参数决定，任务卡缺失时脚本在预检阶段拒绝执行。
- codeup 镜像纳入 `--push`；镜像失败是告警而非致命错误，需人工补推。
- 手动流程细节落在 [docs/cookbook/release.md](../../../docs/cookbook/release.md)，docs/development.md
  只保留入口与链接。
