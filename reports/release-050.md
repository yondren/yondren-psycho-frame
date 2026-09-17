# 两包锁步发布 0.5.0 与发布准备入口 执行报告

- task_key: release-050
- 状态: IN_PROGRESS

## 1. 改了哪些文件

- `scripts/release.mjs`：`--prepare` 只准备模式（与 `--publish`/`--push` 互斥）、`--task-key=` 参数
  与任务卡存在性断言、发布交接块输出、`--push` 补 codeup 镜像推送。
- 根 `package.json`：新增 `release:prepare` 入口。
- 新增 `docs/cookbook/release.md`（手动发布手册）、索引条目与 `.psycho-frame.json` 预算条目。
- `docs/development.md`「包发布」节改指向手册；`docs/architecture.md` 扩展点补 `release:prepare`。
- 新增决策记录 `decisions/implemented/process/2026-09-17-release-prepare-handoff.md`。
- 本次发布自身：两包 `package.json` 版本与模板 devDep pin 由 `release.mjs` 写入。

## 2. 实现了什么

"发布前准备"从口头约定（不加 `--publish`）变成不可能误发的独立入口：跑完即完成 bump、门禁、
pack 预检、commit 与注解 tag，并打印可直接复制的发布、核对、推送命令块；release commit 的
task_key 由参数决定并校验任务卡存在。

## 3. 跑了哪些命令

- `pnpm change-scope --base HEAD`、`pnpm verify:docs`、`pnpm test`、`pnpm run doctor`。
- 彩排（`.local/rehearsal/` 内临时 clone，用仓库内 store）：
  `pnpm release:prepare patch --task-key=release-050`。
- 真实准备：`pnpm release:prepare 0.5.0 --task-key=release-050`（发布与推送由维护者执行）。

## 4. 验证结果

- 文档门禁通过（143 个 Markdown），测试 106 项全通过，doctor 通过。
- 彩排全链路 exit 0：两包与模板 pin 三处同步升到 0.4.1、pack 预检断言通过、release commit
  含 `[release-050]`、注解 tag `v0.4.1` 生成、交接块打印完整；彩排 clone 已删除。
- 参数守卫实测：`--prepare` 叠加 `--publish`、非法 task_key、未登记 task_key 三种情况均在预检
  阶段 exit 1。

## 5. 文档与决策是否同步

已同步：手册落 `docs/cookbook/release.md`（development 只留入口与链接）、结构地图补入口、
决策记录含被否方案（独立脚本、自动发布、维持口头约定）。

## 6. 还剩什么阻塞

待维护者执行两条 `pnpm publish` 与推送；完成后本任务置 `DONE` 并补齐发布核对结果。
