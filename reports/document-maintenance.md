# 文档整理提示词执行报告

- task_key: document-maintenance
- 状态: IN_PROGRESS

## 交付

新增 [可复制提示词](../docs/cookbook/document-maintenance.md)，登记自举仓库和消费方模板的
Cookbook 索引及预算。

## 验证

- `pnpm change-scope --base main` 识别出文档、模板和配置的改动。
- `pnpm verify:docs` 与 `git diff --check` 通过。`pnpm test` 共 188 项通过。
- `pnpm pack` 生成的本地包经 init、adopt 和 upgrade 验证。三种样本的提示词正文一致，索引入口
  可达，文档门禁通过。升级保留自定义索引，二次升级预览为零改动。
- ZW 本地快照 `e82d2ad5` 只读验证。从文档索引找到快照 AI 整理合同，用批次号找到第 315 批
  的报告小节和对应决策文件。

## 文档与决策

[决策记录](../decisions/implemented/process/2026-11-23-document-maintenance-prompt.md) 说明分发方式。

## 合流状态

任务分支 `document-maintenance` 等待按 `merge=ask` 确认合流到本地 `main`。
