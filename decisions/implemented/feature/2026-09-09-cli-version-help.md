# Agent Note: CLI 一等 version 与 help [命令] 命令

Status: implemented

## Problem

`--version`/`-v` 与 `help`/`--help`/`-h` 只以旗标形式存在：裸 `version` 命令落入
"未知命令"分支退出 2，`help <命令>` 会忽略参数直接打印全量用法。用户与 Agent 无法
按命令查用法契约，脚本也无法按通用 CLI 习惯用 `version` 取版本号。

## Decision

- 新增 `psycho-frame version`：输出纯版本号，与 `--version`/`-v` 完全一致，退出 0；
  并入同一早退分支，先于自动版本检查，天然不参与 update-check（与 `--version`
  行为一致）。
- 新增 `psycho-frame help [命令]`：无参数打印全量 USAGE（与 `--help`/`-h` 同源）；
  带命令名打印 `COMMAND_HELP` 映射中的专属帮助（用法/选项/示例/退出码）；未知
  命令名打印一行错误 + 全量 USAGE，退出 2。
- `COMMAND_HELP` 覆盖全部命令：verify、scope（含 change-scope 别名）、mode、
  upgrade、self-upgrade、init、adopt、doctor、help、version；与 USAGE 同处
  cli.mjs，二者为用法信息的唯二出口。
- 包 README 命令表补两行；官网经 sync MAP 自动展示。

## Alternatives considered

**只保留旗标、不新增命令** — 否决：`version` 与 `help <命令>` 是一等公民的通用
CLI 惯例，旗标无法携带子命令语义。

**专属帮助独立成文件或 JSON 数据** — 否决：内容与 USAGE 强耦合，分文件徒增同步
成本，且同一文件可被代码评审与门禁一并覆盖。

**version 输出包名 + Node 版本等诊断信息** — 否决：与 `--version` 语义分裂，破坏
脚本解析；纯版本号保持单一定义，诊断需求另行再议。

## Consequences

- 用户与 Agent 可用 `help <命令>` 就地查命令契约，未知命令有明确指引（退出 2）。
- version/help 均先于自动版本检查早退，与既有 help/--version 的静默语义一致。
- 改动任一命令时 USAGE 与 COMMAND_HELP 两处需同步（同文件，评审可见）。
