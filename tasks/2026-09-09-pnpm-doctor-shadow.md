# pnpm doctor 内置命令遮蔽同名 script，文档改 pnpm run doctor

- task_key: pnpm-doctor-shadow
- status: DONE
- created: 2026-09-09
- updated: 2026-09-09
- report: [reports/pnpm-doctor-shadow.md](../reports/pnpm-doctor-shadow.md)

## 范围

pnpm ≥ 11.14 内置 `pnpm doctor`（环境诊断），内置命令优先于同名 npm script；仓库与模板
文档中指引结构漂移检查的 `pnpm doctor` 改为 `pnpm run doctor`，`doctor` script 与 CLI
子命令保留。

## 进度

- [DONE] 2026-09-09 两处文档修正落地；change-scope 改动面 5 文件，verify:docs 通过。
