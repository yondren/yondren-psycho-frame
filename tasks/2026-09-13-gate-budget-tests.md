# 门禁可信度：中文预算计数、零依赖测试与 CI 覆盖

- task_key: gate-budget-tests
- status: IN_PROGRESS
- created: 2026-09-13
- updated: 2026-09-13
- report: [reports/gate-budget-tests.md](../reports/gate-budget-tests.md)

## 范围

本次包含：字数预算改为 CJK 感知计数并按实测值显式提预算；`scaffold`/`doctor` 改为返回退出码、
`verify` 对坏配置干净报错；新增零依赖 `node:test` 测试套件与根/包 `test` 脚本；新增
`.github/workflows/ci.yml` 覆盖 pull_request 的 verify、doctor、测试。

本次不包含：P0 官网基路径（用户负责）；upgrade 自保护、engines、任务头 report 强校验
（任务 2）；upgrade 合并语义与官网单一真源（任务 3）。

## 进度

- [IN_PROGRESS] 2026-09-13 开工：worktree `.worktrees/gate-budget-tests`，分支 `gate-budget-tests`。
