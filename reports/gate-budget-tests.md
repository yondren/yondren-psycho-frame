# 门禁可信度：中文预算计数、零依赖测试与 CI 覆盖 执行报告

- task_key: gate-budget-tests
- 状态: IN_PROGRESS

## 1. 改了哪些文件

- `packages/psycho-frame/src/verify-docs.mjs`：新增 `countWords`（CJK 逐字 + 拉丁/数字串逐词）；
  配置读取与校验整体 try/catch；`isExternal` 先排除 Windows 盘符。
- `packages/psycho-frame/src/init.mjs`：`scaffold`/`doctor` 改为返回 `{ exitCode, … }` 并注入
  `stdout`/`stderr`，不再在库内 `process.exit`。
- `packages/psycho-frame/src/cli.mjs`：`verify` 兜底 try/catch；`init`/`adopt`/`doctor` 按返回码退出。
- `packages/psycho-frame/test/`（新增）：`helpers.mjs` 与 6 个 `*.test.mjs`，共 70 个用例。
- 根 `package.json` 与 `packages/psycho-frame/package.json`：新增 `test` 脚本。
- 根与 `packages/psycho-frame/template/.psycho-frame.json`：`budgets` 按实测上调。
- `docs/AGENTS.md`、`packages/psycho-frame/template/docs/AGENTS.md`、`packages/psycho-frame/README.md`：
  预算语义改为 CJK 感知口径。
- `docs/development.md`、`docs/architecture.md`：测试与 CI 的归属。
- `.github/workflows/ci.yml`（新增）：PR 与 main 的 verify + doctor + test。
- `decisions/implemented/`：`testing/2026-09-13-budget-counting-cjk.md`、
  `process/2026-09-13-node-test-suite-and-ci.md`、`bug-fix/2026-09-13-verify-gate-reachability.md`。

## 2. 实现了什么

字数预算从 `wc -w` 语义改为 CJK 感知计数：汉字等 CJK 字符逐字计 1，拉丁/数字串逐词计 1，
空白与标点不计。六个常驻文档在旧计量下分别只计 107–166 词，新计量下为 478–629 字，
预算因此按实测上调并在根与模板同步。门禁配置损坏从"打印 Node 堆栈"变为一行门禁错误；
Windows 盘符路径检查从不可达变为可达。新增零依赖 `node:test` 套件，覆盖门禁解析、
脚手架/漂移检查、升级合并、自升级缓存与 change-scope 输出；CI 在 Node 20/22 上跑
verify + doctor + test，PR 与 main 都触发，无需 pnpm install。

## 3. 跑了哪些命令

- `pnpm test`：70 用例。
- `node packages/psycho-frame/src/cli.mjs verify`
- `node packages/psycho-frame/src/cli.mjs doctor`

## 4. 验证结果

- 测试：70/70 通过。
- 文档门禁：通过（链接/锚点、决策格式、任务头、预算、工作模式）。
- doctor：通过。

## 5. 文档与决策是否同步

- 预算语义同步到根与模板的 [docs/AGENTS.md](../docs/AGENTS.md) 与包 README。
- 测试与 CI 归属同步到 [docs/development.md](../docs/development.md)、
  [docs/architecture.md](../docs/architecture.md)。
- 三条决策记录覆盖预算口径、测试/CI、门禁两处失效修复。

## 6. 还剩什么阻塞

- 无阻塞。P0 官网基路径由用户处理，不在本任务范围。
