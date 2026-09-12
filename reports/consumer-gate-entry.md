# 消费方门禁入口与 pnpm 单一化 执行报告

- task_key: consumer-gate-entry
- 状态: IN_PROGRESS

## 1. 改了哪些文件

- 模板：`AGENTS.md`、`README.md`、`docs/development.md`（环境段 + 新增"门禁接入"）、
  `docs/cookbook/parallel-worktrees.md`（新增第 2 步"依赖供给"并重排编号）、
  新增 `.github/workflows/ci.yml`。
- CLI：`packages/psycho-frame/src/init.mjs`（scaffold 下一步输出按 init/adopt 分流；
  doctor 补齐脚本与 devDependency 提示）。
- 使用者向文档：包 `README.md`、根 `README.md`、`docs/development.md`、
  `docs/cookbook/tutorial.md`、`docs/cookbook/parallel-worktrees.md`。
- 测试：`packages/psycho-frame/test/init.test.mjs` 新增两条入口与依赖提示断言。
- 过程：本报告、`tasks/2026-09-13-consumer-gate-entry.md`、
  `decisions/implemented/process/2026-09-13-consumer-gate-entry.md`。

## 2. 实现了什么

消费方门禁入口不再要求预先 install：`pnpm verify:docs` 会自动补齐 devDependency；环境段
删除"npm/yarn 亦可"，写明一个 checkout 只用 pnpm 与沙箱 EPERM 事实；worktree cookbook 增
依赖供给步骤（`CI=true pnpm install --frozen-lockfile`）与禁止软链/复制 `node_modules`；
模板内置零依赖 CI；`init`/`doctor` 输出给出可直接照做的接入片段。

## 3. 跑了哪些命令

- `node packages/psycho-frame/src/cli.mjs verify`（worktree 根）
- `node --test packages/psycho-frame/test/*.test.mjs`
- `node packages/psycho-frame/src/cli.mjs init <tmp>/proj`，再在该脚手架项目内跑 `verify` 与
  `doctor`
- `pnpm change-scope --base main`
- 消费方沙箱能力实测（临时目录）：`npm install` / `npx` / `pnpm dlx` 全部 EPERM；
  `CI=true pnpm install` 与 `pnpm verify:docs`（自动补齐 devDependency）成功

## 4. 验证结果

- 文档门禁：通过（107 个 Markdown 文件，链接与锚点、决策结构、任务头字段、预算、工作模式全绿）。
- 测试：83/83 通过，含新增的模板入口断言与 doctor 依赖提示断言。
- 脚手架端到端：生成的消费方项目 14 个 Markdown 文件门禁通过，`.github/workflows/ci.yml`
  随脚手架落盘；去掉 scripts 后 `doctor` 输出可照做的接入片段且退出码 0。
- 预算：仓库 `docs/development.md` 730/750、`docs/cookbook/parallel-worktrees.md` 378/400；
  模板 `docs/development.md` 602/750、`docs/cookbook/parallel-worktrees.md` 373/400，均在限内。

## 5. 文档与决策是否同步

- 决策记录 `process/2026-09-13-consumer-gate-entry.md` 覆盖入口分层、pnpm 单一化、CI 与
  CLI 提示；模板与使用者向文档同一提交同步。
- 官网内容由 `README.md`、`docs/cookbook/tutorial.md`、`docs/concepts.md`、包 README 生成，
  本次改到其中两个源，官网构建需在合流后复跑。

## 6. 还剩什么阻塞

- 无阻塞。绝对 store 固定属机器配置，未进仓库。
