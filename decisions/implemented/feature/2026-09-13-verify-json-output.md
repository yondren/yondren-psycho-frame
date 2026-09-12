# Agent Note: verify 支持 --json 输出

Status: implemented

## Problem

`verify` 只输出人类可读文本，CI 或脚本要判断具体失败项时只能解析中文句子。

## Decision

`verify` 新增 `--json`：把 `{ formatVersion, ok, count, errors }` 输出到 stdout，退出码语义不变
（0 通过 / 1 门禁失败 / 2 参数非法）；未知参数一律退出码 2。

## Alternatives considered

**把默认输出改为 JSON** — 否决：交互终端可读性优先，JSON 作为可选模式存在。

## Consequences

- CI 与自动化可直接消费门禁结果，人读输出保持原样。
- 门禁结果结构带 formatVersion，后续扩展字段不破坏消费方。
