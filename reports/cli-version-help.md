# CLI version 与 help [命令] 执行报告

- task_key: cli-version-help
- 状态: DONE

## 1. 改了哪些文件

- 修改 `packages/psycho-frame/src/cli.mjs`：新增 `COMMAND_HELP` 专属帮助映射；
  `version` 并入 `--version`/`-v` 早退分支；`help [命令]` 分发逻辑；USAGE 补两行与
  两个示例；文件头命令清单同步。
- 修改 `packages/psycho-frame/README.md`：命令表补 `help [命令]` 与 `version` 两行。
- 新增 `decisions/implemented/feature/2026-09-09-cli-version-help.md`。
- 新增 `tasks/2026-09-09-cli-version-help.md`、本报告。

## 2. 实现了什么

- `psycho-frame version`：输出纯版本号，与 `--version`/`-v` 完全一致，退出 0；
  早退先于自动版本检查，不参与 update-check。
- `psycho-frame help [命令]`：无参数打印全量 USAGE；带命令名打印 `COMMAND_HELP`
  中的专属帮助（用法/选项/示例/退出码）；未知命令名打印一行错误 + 全量 USAGE，
  退出 2。覆盖 verify、scope/change-scope、mode、upgrade、self-upgrade、init、
  adopt、doctor、help、version 全部命令。

## 3. 跑了哪些命令

- `pnpm change-scope --base main`（改动面）
- `node packages/psycho-frame/src/cli.mjs` 冒烟：`version`、`--version`、`-v`、
  `help`、`help mode`、`help scope`、`help change-scope`、`help 未知`、`-h`、
  未知命令 `wat`
- `pnpm verify:docs`（门禁）

## 4. 验证结果

- `version`、`--version`、`-v` 三者输出一致（0.2.0），退出 0。
- `help` 无参与 `-h` 打印同一 USAGE，退出 0；`help mode`/`help scope`/
  `help change-scope` 输出专属帮助，退出 0。
- `help 未知`：一行错误 + 全量 USAGE，退出 2；裸未知命令 `wat` 仍退出 2（回归不变）。
- change-scope：改动面 = cli.mjs、包 README、决策记录、任务 4 个文件，merge-base
  与 base 一致（5f096d2）。
- `pnpm verify:docs` 全绿（含新决策记录结构、任务头字段、报告链接）。

## 5. 文档与决策是否同步

- 决策记录：`decisions/implemented/feature/2026-09-09-cli-version-help.md`
  （含 Alternatives considered）。
- 包 README 命令表补两行，官网经 sync MAP 自动展示；模板架构地图与
  docs/architecture.md 未改（命令全表真源在包 README，其门禁层清单不含 CLI 元命令）。
- 任务头字段与 task_key 一致，状态随本报告置 DONE。

## 6. 还剩什么阻塞

无。
