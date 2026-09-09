# CLI 新增 version 与 help [命令]

- task_key: cli-version-help
- status: DONE
- created: 2026-09-09
- updated: 2026-09-09
- report: [reports/cli-version-help.md](../reports/cli-version-help.md)

## 范围

新增 `psycho-frame version`（输出纯版本号，与 `--version` 等价）与
`psycho-frame help [命令]`（无参打印全量用法，带参打印该命令专属帮助）。二者均为
一等命令，`help`/`--help`/`-h` 与 `--version`/`-v` 行为不变。
