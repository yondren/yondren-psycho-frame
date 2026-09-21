# Agent Note: 项目评估后的六项可靠性加固

Status: implemented

## Problem

[项目评估](../../../reports/project-assessment.md) F01—F12 涉及提交内容、hooks、升级所有权、
CLI 合同、消费方与发布流程；正常路径测试不足以覆盖错误放行和意外写入。

## Decision

按六个任务独立实施、验证与合流，保持零运行时依赖、Markdown/Git 知识层和现有默认工作模式。

| 任务 | 对应发现 | 行为合同的唯一家 |
| --- | --- | --- |
| commit-content-guard | F01/F04 | [内容门禁](../process/2026-09-18-destroy-mode-gate.md) |
| task-hook-lifecycle | F02/F09 | [任务启动](../process/2026-09-18-task-start-cli.md) |
| upgrade-boundaries | F03/F05 | [升级边界](../feature/2026-09-09-skeleton-upgrade.md) |
| cli-contract-alignment | F10/F11/F12 | [CLI 合同](../bug-fix/2026-09-21-cli-contract-alignment.md) |
| ci-onboarding-contract | F06/F07 | [CI 与消费方](2026-09-21-ci-onboarding-contract.md) |
| release-resume | F08 | [发布恢复](../process/2026-09-09-publish-release-script.md) |

验收必须是有判别力的行为测试：暂存区/中间提交命中、删除决策、拒绝型原 hook、DONE key 拒绝、
半初始化恢复、外部链接不变、索引保留、子目录诊断、版本排序、clone CI、完整 tarball 教程、
第二包失败恢复、摘要冲突、过期基线、tag 冲突及镜像失败恢复。执行结果放在
[验收报告](../../../reports/hardening-completion.md)，不复制到长期文档。

## Alternatives considered

**仅修改提示或提高覆盖率指标** — 无法防止真实错误放行；需要内容快照、所有权与生命周期反例。

**重写整个 CLI** — 扩大正常路径回归面；按失效边界修复。

**所有检查永远本地全量执行** — 默认使用最窄验证，CI 拥有平台矩阵；destroy 模式另有明确合同。

**借此增加新模式/检索系统/视觉设计** — 不属于当前可靠性问题；历史延期的 branch-hygiene 保持延期。

## Consequences

六项修复的代码、模板、文档与测试共同交付。远端 CI、真实 registry 发布及部署必须有独立结果，
本地成功不代表远端已通过。hooks 依赖原来源持续可用，升级中断与跨 Git/registry 发布仍不具全局事务。
扫描跳过项、轻量 Markdown 子集及首次 CI 基线之前的历史范围均明确报告，不假称完整覆盖。
