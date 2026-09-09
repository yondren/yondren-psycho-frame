# CLI 自升级命令与自动版本检查执行报告

- task_key: cli-self-update
- 状态: DONE

## 1. 改了哪些文件

- 新增 `packages/psycho-frame/src/self-update.mjs`：registry 查询、版本比较、更新缓存、
  后台检查子进程、self-upgrade 命令实现。
- 修改 `packages/psycho-frame/src/cli.mjs`：新增 `self-upgrade` 命令与 USAGE，启动时
  自动检查块（提示 + 后台刷新）。
- 修改 `packages/psycho-frame/README.md`：安装节补全局安装与自动检查说明，命令表补
  `self-upgrade` 行。
- 修改 `docs/architecture.md`：扩展点补 self-update 模块条目。
- 修改 `docs/development.md`：包发布节补发布后旧版 CLI 的升级提示行为。
- 修改 `packages/psycho-frame/template/docs/architecture.md`：门禁层命令清单补
  `self-upgrade`。
- 新增 `tasks/2026-09-09-cli-self-update.md`、
  `decisions/implemented/feature/2026-09-09-cli-self-update.md`、本报告。

## 2. 实现了什么

- `psycho-frame self-upgrade`：查询 npm registry dist-tags；npm 全局安装自动
  `npm install -g` 无缝升级，其余安装方式打印指引；`--check` 只查询（0=最新、1=落后）；
  查询失败一行错误退出 2。
- 任意命令自动检查：缓存同步读命中即提示；缺失/过期时 detached 子进程静默刷新，
  不阻塞命令、不改变退出码；24h TTL、3s 网络超时、离线静默、非 TTY 跳过，
  `PSYCHO_FRAME_NO_UPDATE_CHECK=1` 关闭。

## 3. 跑了哪些命令

- `node packages/psycho-frame/src/cli.mjs scope --base main`（改动面）
- `node packages/psycho-frame/src/cli.mjs verify`（门禁）
- `node packages/psycho-frame/src/cli.mjs self-upgrade --check`（真实 registry 与 stub）
- 本地 stub registry（port 39873）+ `PSYCHO_FRAME_REGISTRY_URL` /
  `PSYCHO_FRAME_UPDATE_CACHE_FILE` 覆盖：模块级 notify/spawn/compare 断言；伪 TTY
  （`script -q /dev/null`）下 verify/mode 两轮运行验证"首轮静默建缓存、次轮提示"。

## 4. 验证结果

- 真实 registry：`--check` 输出当前 v0.2.0 / 最新 v0.2.0，退出 0。
- stub（latest=9.9.9）：`--check` 退出 1；非全局安装打印指引退出 0。
- 伪 TTY 两轮：首轮无提示并生成缓存 `{"checkedAt":...,"latest":"9.9.9"}`，次轮 stderr
  输出升级提示，退出码不变；非 TTY 与 `NO_UPDATE_CHECK=1` 均无提示、不建缓存。
- `compareVersions` 5 组断言通过；spawn 子进程静默写缓存通过。
- 验证中发现并修复 `fetchLatest` 对 http:// 覆盖 URL 抛 `ERR_INVALID_PROTOCOL` 的问题
  （按协议选 http/https 模块 + try/catch 兜底）。

## 5. 文档与决策是否同步

- 决策记录：`decisions/implemented/feature/2026-09-09-cli-self-update.md`。
- README、architecture、development、模板架构地图均已同步；官网经 sync MAP 自动展示。
- 门禁 `verify` 全绿。

## 6. 还剩什么阻塞

无。
