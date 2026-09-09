# Agent Note: 可配置工作模式（plan / confirmAmbiguous）

Status: implemented

## Problem

Agent 在骨架内每次会话的行为纪律（是否强制先出计划并经用户确认、需求不明确是否必须
询问）固定写在文档里，没有项目级开关；用户想按场景调整时只能改文档，无法在对话中
即时切换，也没有命令行手段。

## Decision

- 新增 `.psycho-frame.json` 的 `workMode` 字段，两个正交开关：`plan`（`on`/`off`，
  默认 `on`）与 `confirmAmbiguous`（`true`/`false`，默认 `true`）；取值封闭，verify
  门禁校验，非法即失败。
- `plan=on` 是 plan 模式：改动文件前先在对话中给出实施计划，经用户确认后才动手；
  `plan=off` 动手前仍显式说明将要执行的计划，但不等待确认（off 不等于不计划）。
  语义的唯一事实源在 docs/development.md，根 AGENTS.md 只放链接。
- 新增 CLI `psycho-frame mode`（查看）/ `mode set <key>=<value>`（校验并写回配置）/
  `mode reset`（恢复默认）；doctor 对缺失 workMode 给出提示。
- 对话配置 = 用户在对话中直接要求调整，Agent 用 `mode set` 持久化到配置；配置是唯一
  真源，对话不产生第二事实源。
- 取值、读写与默认收敛在 `packages/psycho-frame/src/work-mode.mjs`，verify 门禁与
  mode CLI 共用；模板与仓库自举实例（AGENTS.md、docs/development.md、.psycho-frame.json）
  同步同一批默认与语义。

## Alternatives considered

**预设命名模式（如 plan-first / fast）** — 否决：一个值切换全套行为，组合不灵活、
扩展需新预设；两个正交开关更贴合"强制 plan"与"必须确认需求"这两个独立诉求。

**plan 三档（required / optional / off）** — 否决：optional 的"可跳过"语义由对话本身
承载（用户随时可免计划）；两档 on/off 已够，且 off 被定义为"仍说明计划、不等确认"，
避免 off 被误解为暗箱行动。

**计划落地为 decisions/proposed 提案文件** — 否决：计划与确认是会话行为，不是文档
流程；决策记录仍按现有流程在实施时以 implemented 形式落地。

**只写文档不写配置与 CLI** — 否决：无机器校验，无法命令行配置，且对话调整会制造与
文档漂移的第二事实源。

## Consequences

- 工作模式可在对话与命令行两处调整，都收敛到 `.psycho-frame.json` 一个真源。
- 取值封闭并由 verify 校验，配置腐化会挂在门禁上；缺省时使用内置默认，老项目零迁移。
- 官网（packages/psycho-frame/README.md 在 sync MAP 内）自动展示 mode 命令与新配置项。
- 新项目 init 即带默认 workMode；adopt 不覆盖既有配置，老配置缺少 workMode 由 doctor
  提示。
