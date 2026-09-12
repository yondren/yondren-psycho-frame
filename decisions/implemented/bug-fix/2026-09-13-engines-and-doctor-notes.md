# Agent Note: 根 engines 与 doctor 判定对齐事实

Status: implemented

## Problem

两处声明与实际不符：根 `package.json` 的 engines 写 `>=18.20`，但工作区锁定的 pnpm 11.20 需要
Node ≥ 22.13（[docs/development.md](../../../docs/development.md) 也如此声明，CI 曾因此崩溃）；
`doctor` 把“缺少 package.json”列为 issue 并使命令 exit 1，文案却说非 Node 项目可忽略。

## Decision

根 `package.json` 的 engines 提到 `>=22.13`，新增 [.nvmrc](../../../.nvmrc) 固定 22；两个发布包的
engines 保持 `>=18.20`，因为门禁与 CLI 对消费者仍只依赖 Node 内置能力。`doctor` 把缺失
package.json 降为 note（跳过脚本检查、退出码 0），缺失必需文件与坏 JSON 仍是 issue。

## Alternatives considered

**同步提高发布包 engines** — 否决：无谓放弃 Node 18/20 消费者，门禁代码并不需要新语言特性。

**保留 issue 但把文案改成“必须”** — 否决：非 Node 项目合法，doctor 不应把它们判为漂移。

## Consequences

- 开发者用 nvm 读到 22，与 pnpm 与 CI 的版本要求一致。
- doctor 的退出码只反映真实的结构漂移，不再因合法形态报警。
