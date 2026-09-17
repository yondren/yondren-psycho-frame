# CLI 参数守卫：任意命令的 --help 与非法参数

- task_key: cli-help-arg-guard
- status: IN_PROGRESS
- created: 2026-09-17
- updated: 2026-09-17
- report: [reports/cli-help-arg-guard.md](../reports/cli-help-arg-guard.md)

## 范围

本次包含：`--help`/`-h` 出现在任意命令参数位时打印该命令专属帮助（退出码 0，未知命令回退总览并
退出码 2）；`init`/`adopt`/`doctor` 拒绝未知选项与多余目录参数（退出码 2）；对应测试与决策记录。

本次不包含：新增命令、改动 release.mjs 的参数处理、`help <命令>` 既有路径。
