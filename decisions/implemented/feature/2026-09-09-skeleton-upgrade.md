# Agent Note: 骨架一键升级命令（psycho-frame upgrade）

Status: implemented

## Problem

升级 npm 包只更新 CLI 与门禁，init 时拷贝进项目的骨架文件（AGENTS.md、docs/、
.psycho-frame.json 等）停留在旧版本；使用者要手动 diff 模板与项目文件再逐处合并，
体验差且易长期漂移，新版本的行为（如 workMode 语义）无法自动落地。

## Decision

- 新增 CLI `psycho-frame upgrade [目录]`（默认 `.`），把模板骨架文件一键同步进已有项目。
- 策略为模板优先：缺文件补齐；与模板一致跳过；不一致的普通文件更新为模板版，本地版本
  先备份到 `.psycho-frame-upgrade/<时间戳>/` 并逐文件报告；命令行永不产生合并标记；
  README.md 属用户内容，与模板不同时保留本地（见
  [upgrade-guardrails](../bug-fix/2026-09-09-upgrade-guardrails.md)）。
- 配置做增量合并，用户值永不覆盖：`.psycho-frame.json` 保留用户已有键、只补模板新增键；
  `package.json` 只补模板缺失的 scripts；`.gitignore` 只补模板新增行。
- `--dry-run` 只预览不落盘，有变更时退出码 1，可作 CI 漂移预检。
- 前置守卫：目标须为带骨架特征的目录，无显式目录参数时定位 git 仓库根，异常输出一行
  可读错误（见 [upgrade-guardrails](../bug-fix/2026-09-09-upgrade-guardrails.md)）。
- 备份目录由模板 `.gitignore` 忽略；用户自有内容（decisions/tasks/reports 记录、自建
  文档页）不在模板内，天然不受影响。

## Alternatives considered

**复用 / 扩展 adopt** — 否决：adopt 的公开契约是"只增不改、绝不覆盖既有文件"（README
与官网已承诺），升级必须能覆盖，混入会破坏契约语义。

**本地优先 + 模板新版暂存** — 否决：升级后项目仍落后于模板，新行为无法自动落地，
等于把合并工作推迟回用户手里。

**git 三方合并 + 基线状态文件** — 否决：需要记录每次脚手架的基线并在升级时取旧模板
内容，状态与复杂度高；骨架文件归框架所有，模板优先 + 备份在同一体验下零状态、零依赖。

**交互式逐文件确认** — 否决：违背"一个命令更新、不手工处理冲突"的目标。

## Consequences

- 一键升级、永不手工合并；本地改动不丢失（备份 + 报告可随时回看/恢复）。
- 配置增量合并让新配置项（如 workMode）在老项目自动落地，用户自定义值保留。
- `--dry-run` 退出码 1 可进 CI 预检；doctor 的缺文件提示同步指向 upgrade。
- 官网经 sync MAP 自动展示 upgrade 命令与用法。
