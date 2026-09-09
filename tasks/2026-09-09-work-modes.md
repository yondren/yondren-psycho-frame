# 可配置工作模式（plan / confirmAmbiguous）

- task_key: work-modes
- status: DONE
- created: 2026-09-09
- updated: 2026-09-09
- report: [reports/work-modes.md](../reports/work-modes.md)

## 范围

为骨架增加可配置工作模式：`.psycho-frame.json` 的 `workMode`（`plan` on/off、
`confirmAmbiguous` true/false）、CLI `mode`（查看 / set / reset）、verify 门禁取值校验与
doctor 缺失提示、模板与仓库文档同步；对话内调整即 Agent 执行 `mode set` 持久化到配置。
