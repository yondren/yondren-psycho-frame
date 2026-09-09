# 两包锁步发布 0.3.0

- task_key: publish-psycho-frame-030
- status: IN_PROGRESS
- created: 2026-09-09
- updated: 2026-09-09
- report: [reports/publish-psycho-frame-030.md](../reports/publish-psycho-frame-030.md)

## 范围

本次包含：推送前置（origin/main 对齐 + 租约核对）、`pnpm release 0.3.0 --publish --push`
（bump 两包与模板 pin → verify/doctor → pack 预检 → commit + tag v0.3.0 → npm 双发 →
推 origin main + tag）、发布收尾报告与任务状态。

本次不包含：版本号以外的功能变更。

## 进度

- [IN_PROGRESS] 2026-09-09 版本 0.3.0（minor）全量发布已确认，开始执行。
