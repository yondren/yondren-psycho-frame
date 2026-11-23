# 骨架 0.6.0 发布报告

- task_key: release-060
- 状态: IN_PROGRESS

## 范围

0.6.0 包含任务 worktree 命令、文档门禁增强、升级加固和
[文档整理提示词](../docs/cookbook/document-maintenance.md)。

## 验证

- 发布前的 28 个提交通过 CI 内容门禁，GitHub `main` 和 Codeup `mirror` 均推进至 `3257fa1`。
- 临时目录中打包两份 0.6.0 候选产物，完成创建、安装和任务收尾的教程冒烟。

## 发布

按 [双包发布手册](../docs/cookbook/release.md) 准备并验证正式产物，之后核对 npm 版本和摘要。
