# 两包锁步发布 0.3.0 执行报告

- task_key: publish-psycho-frame-030
- 状态: IN_PROGRESS

## 1. 改了哪些文件

- packages/psycho-frame/package.json、packages/create-yondern-psycho-frame/package.json：
  版本 0.2.0 → 0.3.0（由 release.mjs 写入）。
- packages/psycho-frame/template/package.json：devDependencies 模板 pin 同步（由 release.mjs 写入）。
- tasks/2026-09-09-publish-psycho-frame-030.md、reports/publish-psycho-frame-030.md（本报告）。

## 2. 实现了什么

0.3.0 minor 版本发布：0.2.0 之后累积的增量功能（CLI self-upgrade、version/help 命令、
release.mjs 发布工具、verify-docs 跳过 .worktrees 嵌套布局支持）随两包锁步发布。

## 3. 跑了哪些命令

- 待补（发布执行后填写）。

## 4. 验证结果

- 待补（发布执行后填写）。

## 5. 文档与决策是否同步

- 纯流程发布，无设计决策；任务与本报告为本次唯一文档面。

## 6. 还剩什么阻塞

- 待补（发布执行后填写）。
