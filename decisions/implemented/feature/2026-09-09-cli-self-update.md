# Agent Note: CLI 自升级命令与任意命令的自动版本检查提示

Status: implemented

## Problem

`yondern-psycho-frame` 已发布 npm，但 CLI 自身没有升级入口：`upgrade` 命令升级的是用户
项目的骨架文件，CLI 包升级只能靠用户手动 `npm install -g` / `pnpm add -D`；用户运行
任意命令时也无从知道自己落后于 registry 最新版。

## Decision

- 新增 `psycho-frame self-upgrade`（实现在
  [self-update.mjs](../../../packages/psycho-frame/src/self-update.mjs)）：查询
  `registry.npmjs.org` 的 `/-/package/<name>/dist-tags`；已最新提示并退出 0；有新版且
  检测到 npm 全局安装（CLI 真实路径位于 `npm root -g` 下）时自动
  `npm install -g <name>@latest` 无缝升级，其余安装方式打印对应指引退出 0；`--check`
  只查询（退出码 0=最新、1=落后）；查询失败输出一行错误退出 2。
- 运行任意命令时自动检查并提示：启动时同步读缓存
  （`~/.cache/psycho-frame/update-check.json`，尊重 XDG_CACHE_HOME 与 Windows
  LOCALAPPDATA），缓存命中且 latest > current 时在 stderr 打印
  `[psycho-frame] 新版本 vX.Y.Z 可用（当前 vA.B.C），运行 psycho-frame self-upgrade 升级`；
  缓存缺失/过期（TTL 24h）时 spawn detached 后台子进程静默查询并写缓存（stdio 隔离 +
  unref），不阻塞命令、不改变退出码；提示在后台检查完成后的下一次运行出现。
- 网络用 `node:https`/`node:http`（按 URL 协议选择）手写请求：3s 超时、任何失败返回
  null、绝不抛错；维持零运行时依赖，避开 Node 18 fetch 的 ExperimentalWarning。
- 门控：非 TTY（CI/管道）完全跳过；`PSYCHO_FRAME_NO_UPDATE_CHECK=1` 关闭；
  `help`/`--version`/`self-upgrade` 不参与；`PSYCHO_FRAME_REGISTRY_URL` 与
  `PSYCHO_FRAME_UPDATE_CACHE_FILE` 环境变量可覆盖 registry 与缓存路径（测试用）。
- 版本比较 `compareVersions`：数字段比较，忽略 prerelease/build 段。

## Alternatives considered

**依赖 update-notifier** — 否决：破坏零运行时依赖承诺，提示样式与节奏不可控。

**每次运行同步联网检查（进程内 fetch 后 await）** — 否决：离线时每次命令都要等超时；
且需收口 4 个模块 13 处 `process.exit` 才能保证提示必达，改动面与回归风险大。

**进程内异步 fetch + 800ms 封顶等待** — 否决：缓存未命中时每轮仍有数百毫秒延迟，
且 init/adopt/doctor 等直接 exit 的路径会丢提示。

**后台子进程完成后立即打印提示** — 否决：detached 子进程的延迟输出会与用户后续 shell
输入交错，体验不可控。

**检测 pnpm 全局安装并自动升级** — 否决：全局前缀检测不可靠时可能写错目录；保守
降级为打印指引，只对可验证的 npm 全局安装自动执行。

## Consequences

- npm 全局安装用户一条命令完成 CLI 升级，其余安装方式收到精确指引。
- 提示零延迟（缓存同步读）、每天最多一次网络请求、离线完全静默、CI 与非交互脚本
  零影响。
- 提示首次出现在后台检查完成后的下一次运行（update-notifier 同款节奏），离线用户
  每天最多一次后台尝试。
- 两个测试用环境变量使全链路可用本地 stub registry 复现。
- 官网经 sync MAP 自动展示 self-upgrade 用法；模板架构地图的命令清单同步更新。
