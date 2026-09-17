# CLI 帮助参数与目录参数守卫 执行报告

- task_key: cli-help-arg-guard
- 状态: IN_PROGRESS（待合流）

## 1. 改了哪些文件

- `packages/psycho-frame/src/cli.mjs`：`rest` 层 `--help`/`-h` 统一拦截、`singleTargetArg()` 目录
  参数守卫、USAGE 与 `init`/`adopt`/`doctor` 的 `COMMAND_HELP` 退出码补 `2`。
- `packages/psycho-frame/test/cli.test.mjs`：新增 3 条测试（帮助矩阵、未知命令带 `--help`、非法
  参数不落盘）。
- `packages/psycho-frame/README.md`：命令表 `help` 行补 `--help` / `-h` 约定。
- 新增决策记录 `decisions/implemented/bug-fix/2026-09-17-cli-help-arg-guard.md`、本报告与任务卡。

## 2. 实现了什么

`--help`/`-h` 从"命令位才识别"改为任意命令参数位统一识别：只打印该命令专属帮助并退出码 0，不再
执行命令本身；`init`/`adopt`/`doctor` 的未知选项与多余目录参数一律退出码 2，不再把 `--help` 当
目标目录名就地脚手架，也不再静默丢参。

## 3. 跑了哪些命令

- 复现（修复前）：`psycho-frame init --help` 在仓库根生成 `--help/` 目录并脚手架全套骨架文件。
- `pnpm test`（worktree 内，109 项）；`node --check packages/psycho-frame/src/cli.mjs`。
- `node packages/psycho-frame/src/cli.mjs verify`；`pnpm change-scope --base main`。
- 手工矩阵（临时目录内）：8 条 `--help`/`-h` 组合与 5 条非法参数组合，逐个核对退出码与落盘情况。

## 4. 验证结果

- 测试 109/109 通过（新增 3 条），`node --check` 与文档门禁通过。
- 手工矩阵：`init`/`adopt`/`doctor`/`verify`/`mode`/`upgrade`/`self-upgrade`/`version` 的 `--help`
  或 `-h` 全部退出码 0 且只打印专属帮助；`init --bogus`、`init a b`、`adopt -x`、`doctor a b`、
  `bogus --help` 全部退出码 2。
- 全部用例执行后临时目录仍为空（修复前 `init --help` 会生成 `--help/`）。

## 5. 文档与决策是否同步

已同步：决策记录（`bug-fix` 类）+ README 命令表 + USAGE 与 `COMMAND_HELP`；本报告记录复现路径
与验证矩阵。

## 6. 还剩什么阻塞

无。分支 `cli-arg-guard` 待按 `workMode.merge=ask` 合流（合流后才置任务 `DONE`）。
