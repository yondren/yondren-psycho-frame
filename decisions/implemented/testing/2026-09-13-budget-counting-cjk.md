# Agent Note: 字数预算改用 CJK 感知计数

Status: implemented

## Problem

`budgets` 按 `wc -w` 语义（空白切分）计数，对全中文常驻文档近乎失效：AGENTS.md 实计 107 词
却含 380 个汉字，500 的预算永远不会触发，文档宣称的护栏名存实亡。

## Decision

字数 = CJK 字符数（Han / Hiragana / Katakana / Hangul 逐字计 1）+ 拉丁/数字串数
（以 `[A-Za-z0-9_]` 开头的连续串计 1 词），空白与标点不计；实现在
`packages/psycho-frame/src/verify-docs.mjs` 的 `countWords`。预算按当前实测值上调并留
约 10–25% 余量，根与模板 [.psycho-frame.json](../../../.psycho-frame.json) 同步。语义写在
[docs/AGENTS.md](../../../docs/AGENTS.md) 与包 README 的 `budgets` 行。

## Alternatives considered

**维持 `wc -w`** — 否决：中文文档不受任何约束，护栏形同虚设。

**按字符总数计（含标点与 Markdown 语法）** — 否决：语法符号随排版波动，计数不稳定且不可解释。

**精简文档以适配旧预算** — 否决：旧预算按错误计量校准，数值本身没有意义。

## Consequences

- 六个常驻文档在真实计量下超旧预算，已按实测显式提预算并保留余量。
- 预算对不同语言都可解释：中文按字、西文按词；新增文档按同一口径核算。
