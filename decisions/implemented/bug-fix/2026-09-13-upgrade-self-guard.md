# Agent Note: upgrade 拒绝在框架源码仓库内运行

Status: implemented

## Problem

框架源码仓库既是模板源头又按骨架方式组织自身文档，其 `docs/` 远比模板丰富。`upgrade` 只判断
“像不像骨架”，在本仓库运行会把 AGENTS.md、docs/AGENTS.md、docs/architecture.md、
docs/development.md、docs/cookbook/*、tasks/README.md 一并替换为极简模板版（本地副本仅进备份），
富文档整体降级。

## Decision

`upgrade` 在入口识别框架源码仓库并中止：根 `package.json` 的 name 为
`yondren-psycho-frame-workspace`，或存在 `packages/psycho-frame/template/package.json`。
中止时不写任何文件、返回 `{ errors: true }`；消费方项目行为不变。

## Alternatives considered

**提供 `--force` 逃生口** — 否决：维护者应改模板再同步，逃生口只会让误覆盖更容易发生。

**只靠决策记录约定纪律** — 否决：`--dry-run` 一次就列出 8 个将被覆盖的文件，靠记忆不可靠。

## Consequences

- 框架仓库内运行 upgrade 得到明确中止提示；模板改动只能改 `packages/psycho-frame/template/`。
- 消费方升级路径与测试不变。
