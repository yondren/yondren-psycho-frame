# Agent Note: 修复门禁的两处失效

Status: implemented

## Problem

`verify` 有两处不按门禁语义工作：

1. `.psycho-frame.json` 损坏时 `readConfig` 直接抛错，CLI 打印 Node 堆栈而不是门禁错误；
2. Windows 绝对路径检查不可达——`C:\…` 先被 `isExternal` 的 scheme 正则当作外部 URL 跳过，
   `checkTarget` 内的 `isWinDrive` 分支永远不会执行，不可移植路径能通过门禁。

## Decision

`verifyDocs` 把配置读取与校验（`readConfig`、`stringList`、`budgetsOf`、`ignorePatterns`）
整体包进 try/catch，异常作为门禁错误返回；`isExternal` 先排除 Windows 盘符，再判断
scheme 与根路径。两处都有回归测试（`packages/psycho-frame/test/verify-docs.test.mjs`）。

## Alternatives considered

**只在 CLI 层 catch 异常** — 否决：门禁库自身应返回结构化错误列表，才可复用与单测。

## Consequences

- 坏配置以一行 `.psycho-frame.json: …` 失败，退出码仍为 1；`verifyDocs` 不再抛错。
- 盘符路径恢复按“不可移植”报错；网络 URL、根路径与 `//` 协议相对链接行为不变。
