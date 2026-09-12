# Agent Note: 零依赖测试套件与 CI 门禁

Status: implemented

## Problem

骨架以“机器可校验”为卖点，但仓库没有任何测试与 `test` 脚本；[docs/development.md](../../../docs/development.md)
声称模板漂移由 init/adopt 测试用例看护，实际并不存在。CI 只在 push main 时跑 verify 与
官网构建，PR 没有门禁。

## Decision

`packages/psycho-frame/test/` 用 Node 内置 `node:test` 写零依赖测试，覆盖门禁解析
（链接/锚点、决策结构与格式、任务头字段、字数预算、配置错误）、脚手架与漂移检查、升级的
模板优先与配置合并、自升级的版本比较与缓存、change-scope 的参数与输出。`scaffold` 与
`doctor` 改为返回 `{ exitCode }` 而不直接 `process.exit`，由 CLI 统一退出，使其可在同进程内
测试。根与包各加 `test` 脚本；[.github/workflows/ci.yml](../../../.github/workflows/ci.yml) 在
push main 与 pull_request 上以 Node 20/22 跑 verify、doctor、test（零依赖，无需 pnpm install）。

## Alternatives considered

**引入 vitest 或 jest** — 否决：破坏零依赖承诺，安装与评测成本与收益不匹配。

**只加 CI，不补测试** — 否决：没有测试的 CI 只是换个地方重复本地命令。

**用子进程黑盒覆盖 scaffold/doctor 退出码** — 否决：启动慢、定位差，返回退出码的重构更小。

## Consequences

- 门禁语义改动必须同提交更新测试；CI 成为 PR 的硬门禁。
- 发布包不含 `test/`（`files` 未列），消费者拿到的仍是精简包。
- [docs/development.md](../../../docs/development.md) 的“测试看护”表述指向真实存在的测试目录。
