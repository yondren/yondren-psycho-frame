# 舰队模式（fleet）：工作模式新增委派开关

- task_key: fleet-work-mode
- status: DONE
- created: 2026-09-13
- updated: 2026-09-13
- report: [reports/fleet-work-mode.md](../reports/fleet-work-mode.md)

## 范围

本次包含：`workMode` 新增第三把正交开关 `fleet`（`on`/`off`，默认 `off`）；`work-mode.mjs`
取值、默认与校验，`cli.mjs` 的 mode 解析/回显/reset 改为从 `DEFAULT_WORK_MODE` 派生，
`init.mjs` 的 doctor 提示同源派生；语义写入 `docs/development.md`，操作规格新增
`docs/cookbook/fleet-mode.md`；根与模板 `AGENTS.md`、`docs/concepts.md`、`docs/architecture.md`、
`packages/psycho-frame/README.md`、cookbook 索引与两处 `.psycho-frame.json` 预算同步；
work-mode / cli / verify-docs / init 测试覆盖。

本次不包含：把厂商模型名写进配置 schema（Sol/Luna 只在文档里作实例映射）；"`fleet=on` 必须
派发"的硬门禁；官网 content-map 新增页面（细节由 CLI 与配置页承载）；包版本 bump（归 release 任务）。

## 进度

- [DONE] 2026-09-13 代码、模板、文档与测试落地；测试 90 项全绿、门禁通过、临时项目冒烟通过。
