# CLI 健壮性与元数据一致性 执行报告

- task_key: cli-robustness
- 状态: IN_PROGRESS

## 1. 改了哪些文件

- `packages/psycho-frame/src/upgrade.mjs`：新增 `isFrameworkSource` 入口守卫。
- `packages/psycho-frame/src/verify-docs.mjs`：新增 `expectReportLink`，report 字段强制命名。
- `packages/psycho-frame/src/init.mjs`：`doctor` 缺失 package.json 从 issue 降为 note。
- `packages/psycho-frame/src/cli.mjs`：`upgrade` 用法与专属帮助补充框架源码仓库中止。
- 根 `package.json`：engines 提到 `>=22.13`；新增 `.nvmrc`。
- `reports/yondern-psycho-frame-website.md` → `reports/yondern-website.md`（`git mv`），
  `tasks/2026-09-09-yondern-website.md` 头字段同步。
- `tasks/2026-09-09-publish-psycho-frame-030.md` 与 `reports/publish-psycho-frame-030.md`：
  发布事实按 registry 核对后收尾为 DONE。
- 文档：`tasks/README.md`、`docs/development.md`、`docs/architecture.md`、
  根 `README.md`、`packages/psycho-frame/README.md`。
- 测试：`verify-docs.test.mjs`、`init.test.mjs`、`upgrade.test.mjs` 各增用例。
- 决策：`bug-fix/2026-09-13-upgrade-self-guard.md`、
  `bug-fix/2026-09-13-task-report-field-validation.md`、
  `bug-fix/2026-09-13-engines-and-doctor-notes.md`。

## 2. 实现了什么

`upgrade` 在入口识别框架源码仓库（根 package 名或包内模板目录）并中止，杜绝模板覆盖富文档；
任务 report 头字段从“存在即可”变为必须是 `reports/<task_key>.md` 链接，历史不一致报告改名对齐；
根 engines 与 `.nvmrc` 锁 Node 22，消除与 pnpm 11.20 的矛盾；doctor 不再把合法的非 Node 项目
判为失败。0.3.0 发布任务按 registry 元数据收尾。

## 3. 跑了哪些命令

- `node --test packages/psycho-frame/test/*.test.mjs`：75 用例。
- `node packages/psycho-frame/src/cli.mjs verify`
- `node packages/psycho-frame/src/cli.mjs doctor`
- `curl https://registry.npmjs.org/{yondern-psycho-frame,create-yondern-psycho-frame}`：核对 0.3.0。

## 4. 验证结果

- 测试：75/75 通过（含新增的 upgrade 自保护、report 命名、doctor note 用例）。
- 文档门禁：通过；改名前后的报告链接全部可解析。
- doctor：通过。

## 5. 文档与决策是否同步

- 规则同步到 [tasks/README.md](../tasks/README.md)；环境同步到
  [docs/development.md](../docs/development.md)；升级语义同步到
  [docs/architecture.md](../docs/architecture.md) 与包 README、CLI 帮助。
- 三条 bug-fix 决策记录覆盖自保护、report 命名、engines/doctor。

## 6. 还剩什么阻塞

- 无阻塞。P0 官网基路径由用户处理，不在本任务范围。
