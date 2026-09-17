# Agent Note: CLI 帮助参数与目录参数守卫

Status: implemented

## Problem

`--help` 只在命令位被识别：`init --help` 把 `--help` 当成目标目录名，就地脚手架空目录（不打印
用法、不报错），`adopt`/`doctor` 同样按目录处理；`verify`/`upgrade`/`self-upgrade` 把 `--help`
判为未知参数退出码 2，`mode --help` 报"未知子命令"。同时 `init`/`adopt`/`doctor` 静默忽略多余
位置参数（`init a b` 只建 `a`）。

## Decision

- `rest` 中出现 `--help`/`-h` 时统一拦截：打印 `COMMAND_HELP[<命令>]` 并退出码 0，绝不执行命令
  本身；未知命令回退总览并退出码 2。拦截位于顶层 `help` 之后、`version` 之前，使
  `version --help` 也走专属帮助。
- `init`/`adopt`/`doctor` 共用 `singleTargetArg()`：以 `-` 开头的选项与多于一个目录参数一律
  退出码 2；需要以 `-` 开头的目录时写 `./-dir`。
- 三者的 `COMMAND_HELP` 退出码行补 `2（参数非法）`；README 命令表与 USAGE 记录该约定。

## Alternatives considered

**每个子命令各自处理 `--help`** — 否决：八处重复且新增命令必然漏改，统一拦截一处生效。

**`init --help` 保持脚手架行为** — 否决：误敲即静默生成目录，是本记录要修的故障。

**拒绝所有以 `-` 开头的目录参数但保留静默忽略多余参数** — 否决：`init a b` 只建 `a` 属静默丢参，
与 `upgrade` 的"最多一个目录"不一致。

**引入参数解析库（yargs/commander）** — 否决：骨架门禁承诺零依赖，`node_modules` 只应来自用户
项目自身。

## Consequences

- 任意命令的 `--help`/`-h` 都是安全操作：只读、退出码 0、不产生副作用。
- 参数错误的命令一律退出码 2 并打印对应用法，不再静默按目录处理。
- 以 `-` 开头的目录名需写成 `./-name`，属有意收紧。
