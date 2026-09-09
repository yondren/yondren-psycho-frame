# 发布脚本 执行报告

- task_key: publish-release-script
- 状态: DONE

## 1. 改了哪些文件

- 新增 `scripts/release.mjs`（零依赖两包锁步发布脚本）与根 package.json `release` 脚本。
- `docs/development.md` 包发布节改为脚本入口；`docs/architecture.md` 扩展点补 release 脚本。
- 新增决策记录 `decisions/implemented/process/2026-09-09-publish-release-script.md`、
  本报告与 `tasks/2026-09-09-publish-release-script.md`。

## 2. 实现了什么

调研结论：npm/pnpm 的 create 命令按包名严格解析 `create-<initializer>`，无主包回退
（npm init.js 与 pnpm create.ts 源码确认），故保持两包锁步发布、不合并单包；发布流程
从手工清单收敛为 `pnpm release <bump>`，默认不发布不推送，`--publish`/`--push` 显式解锁。

## 3. 跑了哪些命令

- `pnpm change-scope --base HEAD`、`pnpm verify:docs`、`node --check scripts/release.mjs`
- 临时 clone 内：`node scripts/release.mjs patch --preview`（只读预览）与
  `node scripts/release.mjs patch`（真实 bump/门禁/pack 预检/commit/tag，不发布不推送）

## 4. 验证结果

- 门禁与语法检查通过；change-scope 改动面 = 文档/脚本/包清单/任务/决策。
- 临时 clone 全链路自测通过：两包与模板 pin 三处同步 bump、verify/doctor 通过、pack 预检
  断言（shim 依赖固化 `^x.y.z`、模板 pin 一致、无 `.gitignore` 条目）、commit 与
  `v0.2.1` 注解 tag 生成；未发布未推送，clone 已删除。
- 自测发现并修复两处缺陷：干净 clone 缺 workspace 链接导致 shim pack 失败（补
  `pnpm install --frozen-lockfile` 预检步骤）；`git add/commit/tag/push` 被双重包装
  报 exit undefined（修正为直接调用）。修复后重跑全链路 exit 0。

## 5. 文档与决策是否同步

已同步：development/architecture 文档更新，决策记录含 Alternatives（单包合并/changesets/
CI 发布/shim 依赖 latest 均被否）与 Consequences。

## 6. 还剩什么阻塞

无。
