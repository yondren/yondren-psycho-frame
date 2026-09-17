# 两包锁步发布 0.5.0 与发布准备入口 执行报告

- task_key: release-050
- 状态: DONE

## 1. 改了哪些文件

- `scripts/release.mjs`：`--prepare` 只准备模式（与 `--publish`/`--push` 互斥）、`--task-key=` 参数
  与任务卡存在性断言、发布交接块输出、`--push` 补 codeup 镜像推送。
- 根 `package.json`：新增 `release:prepare` 入口。
- 新增 `docs/cookbook/release.md`（手动发布手册，含发布失败排查）；索引与 `.psycho-frame.json`
  预算同步。
- `docs/development.md`「包发布」节改指向手册；`docs/architecture.md` 扩展点补 `release:prepare`。
- 新增决策记录 `decisions/implemented/process/2026-09-17-release-prepare-handoff.md`。
- 发布自身：两包 `package.json` 与模板 devDep pin 由 `release.mjs` 写入（`59a07d9`）。

## 2. 实现了什么

"发布前准备"从口头约定（不加 `--publish`）变成不可能误发的独立入口：跑完即完成 bump、门禁、
pack 预检、commit 与注解 tag，并打印可直接复制的发布、核对、推送命令块；release commit 的
task_key 由参数决定并校验任务卡存在。

## 3. 跑了哪些命令

- 本地验证：`pnpm change-scope --base HEAD`、`pnpm verify:docs`、`pnpm test`、`pnpm run doctor`。
- 彩排（`.local/rehearsal/` 内临时 clone，用仓库内 store）：
  `pnpm release:prepare patch --task-key=release-050`。
- 真实准备：`pnpm release:prepare 0.5.0 --task-key=release-050`。
- 工具链改动推送：`git push origin main`、`git push codeup main:mirror`。
- 维护者发布：`pnpm publish --filter <包> --no-git-checks` 两条，随后推 `origin main`、`v0.5.0`
  与 codeup `mirror`。
- 收尾核对：registry packument 查询、tarball 下载解包、`npx yondren-psycho-frame@0.5.0 --version`、
  `npx create-yondren-psycho-frame@0.5.0 scaffold-check`。

## 4. 验证结果

- 门禁通过（143 个 Markdown）、测试 106 项全通过、doctor 通过；彩排全链路 exit 0。
- registry：两包 `versions` 含 `0.5.0`、`dist-tags.latest=0.5.0`，发布时间 `07:41:02Z`（核心）与
  `07:41:23Z`（shim），依赖序正确。
- tarball：核心 34 643 字节 / 36 条目，shim 1 901 字节 / 4 条目，均无 `.gitignore` 条目；核心包内
  模板 `devDependencies` 为 `^0.5.0`；shim `dependencies.yondren-psycho-frame` 为 `^0.5.0`
  （`workspace:` 已转换）。
- 消费端实测：`npx yondren-psycho-frame@0.5.0 --version` 输出 `0.5.0`；`npm create` 路径生成的
  骨架 `devDependencies` 为 `^0.5.0`，模板可解析。
- 首次 publish 失败排查：`~/.npmrc` 的 classic token 被 registry 判 401，PUT 伪装成 E404；确认未
  产生半发布（两包仍为 0.4.0），重新登录后从第一条重跑成功。

## 5. 文档与决策是否同步

已同步：手册（含发布失败节）、开发工作流、结构地图与决策记录同批提交；本报告记录过程与核对
结果。

## 6. 还剩什么阻塞

无。附带发现：`psycho-frame init --help` 会把 `--help` 当作目标目录名并就地脚手架（不打印用法），
收尾核对时误建该目录并已清理；是否修由后续任务决定。
