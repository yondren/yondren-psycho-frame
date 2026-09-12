# Agent Note: 任务 report 头字段强制命名

Status: implemented

## Problem

tasks/ 规则要求 report 指向 `reports/<task_key>.md`，门禁却只检查字段存在：值可以是任意文本，
也可以指向任意文件。实测 `tasks/2026-09-09-yondern-website.md` 指向
`reports/yondern-psycho-frame-website.md`，命名不一致仍然通过门禁。

## Decision

`verify` 解析 report 值，要求它是 `[reports/<task_key>.md](../reports/<task_key>.md)` 形式的链接，
且解析后的路径等于 `reports/<task_key>.md`；目标是否存在仍由链接组统一校验。历史不一致的报告
改名为 `reports/yondern-website.md`，任务头字段同步。

## Alternatives considered

**放宽为“指向 reports/ 下存在的文件”** — 否决：task_key 与报告失去一一对应，无法从任务名反查报告。

**只校验文件存在** — 否决：任意文件都能挂到任务上，规则等于不存在。

## Consequences

- 新增任务必须同时建立同名报告；重命名报告必须同步任务头字段。
- 门禁错误同时给出期望路径与实际路径，便于直接修正。
