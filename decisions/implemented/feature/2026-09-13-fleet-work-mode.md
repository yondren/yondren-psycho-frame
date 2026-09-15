# Agent Note: 工作模式新增舰队模式开关（fleet）

Status: implemented

## Problem

骨架只编码了"先规划""歧义必问"两条会话纪律；多代理宿主普及后，主线程指挥 + 子代理并行执行
（Sol/Luna 式的舰队分工）没有项目级开关：Agent 是否派发、怎么派发只能临场判断，用户无法在
对话或命令行里调整，配置写错也不会有任何门禁失败。

## Decision

- `.psycho-frame.json` 的 `workMode` 新增第三个正交开关 `fleet`（`on`/`off`，默认 `off`），
  与 `plan`、`confirmAmbiguous` 并列；默认关闭，老配置零迁移（缺省即补 `off`）。
- `fleet=on` 的语义：批量、检索、整理、提取、分类等可独立切分的工作优先派发子代理并行，
  主线程保留架构决策与最终验收；`fleet=off` 不强制派发，派不派由收益是否超过协调成本决定。
  语义唯一事实源在 [docs/modes.md](../../../docs/modes.md)，操作规格（派发包、收口、与 worktree 分层）在
  docs/cookbook/fleet-mode.md。
- 取值、默认与校验收敛在 `packages/psycho-frame/src/work-mode.mjs`，verify 门禁沿用
  `validateWorkMode`；CLI 的 mode 解析、回显与 reset 从 `DEFAULT_WORK_MODE` 派生，新增开关
  不必再逐个改 CLI 列表。
- 模板与仓库自举实例同步同一批默认与语义。

## Alternatives considered

**只写文档不加开关** — 否决：无法命令行切换与对话调整，配置漂移不挂门禁，还会在 AGENTS.md
制造语义的第二事实源。

**命名绑定 Codex 的 Sol / Luna** — 否决：骨架面向所有宿主与模型，模型名会变；把厂商名写进
配置 schema 会让文档随上游改名腐化，Sol/Luna 只作文档里的实例映射。

**`fleet=on` 时强制派发** — 否决：机器无法判定切片是否独立、收益是否超过协调成本；强制派发
把小任务的协调开销变成纪律，且与"派发包写不全就别派"直接冲突。

**把舰队并入 `plan` 取值** — 否决：一个值切换全套行为、组合不灵活，与既有正交开关设计相悖
（见 [可配置工作模式](2026-09-09-work-modes.md)）。

## Consequences

- 第三种会话纪律可对话与命令行调整，收敛到 `.psycho-frame.json` 一个真源。
- 取值封闭由 verify 校验，写错 `fleet` 会挂在门禁上。
- 官网 CLI 与配置页（`packages/psycho-frame/README.md` 在 sync MAP 内）自动展示新默认值。
- 新项目 init 即带 `fleet=off`；adopt 不覆盖既有配置。
