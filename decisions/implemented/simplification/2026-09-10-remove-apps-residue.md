# Agent Note: 移除 apps/ 残留业务代码

Status: implemented

## Problem

OSS 拆分（见
[../architecture/2026-09-09-yondern-psycho-frame-oss.md](../architecture/2026-09-09-yondern-psycho-frame-oss.md)）
已把 apps/ 业务源码从 git 树删除并保留在历史，但同一提交把业务数据库
apps/fde-server/data/leads.db 误纳入跟踪；工作树还残留被忽略的构建/运行产物：
apps/{fde-server,fde-miniprogram,fde-admin}/ 的 node_modules/、dist/、fde-server 的
.env（业务密钥）与 data/uploads/（约 145 个文件、2.6 MB）。骨架仓库当前树因此仍携带
业务代码与业务数据。

## Decision

- 从当前树彻底移除 apps/：`git rm` 被跟踪的 apps/fde-server/data/leads.db，磁盘删除整个
  apps/ 目录（含被忽略的 node_modules/、dist/、.env、data/）。
- git 历史不动：业务源码与数据库 blob 按 OSS 决策继续留在历史，可按需恢复。
- 骨架文档对 apps/ 作为消费方可选业务层的说明保留
  （[template/docs/architecture.md](../../../packages/psycho-frame/template/docs/architecture.md)）。

## Alternatives considered

**保留现状** — 否决：开源骨架仓库当前树携带业务数据库与含密钥的 .env，与 OSS 决策
「继续保留 apps/ 在仓库内」的否决结论相悖。

**重写历史彻底清除 apps/** — 否决：与 OSS 决策「业务代码留在 git 历史」相反，需租约
保护与强制推送，收益不抵风险。

## Consequences

- 当前树只剩骨架代码，`git ls-files` 不含任何业务文件。
- 业务源码与 leads.db 仍可从 git 历史恢复。
