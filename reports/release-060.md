# 骨架 0.6.0 发布报告

- task_key: release-060
- 状态: DONE

## 范围

0.6.0 包含任务 worktree 命令、文档门禁增强、升级加固和
[文档整理提示词](../docs/cookbook/document-maintenance.md)。

## 验证

- 文档门禁、内容快照、当前源码测试、doctor、打包元数据与摘要校验均通过。
- 使用两份正式 tarball 完成创建、安装和任务收尾的教程冒烟。
- 两份 tarball 的 registry `dist.integrity` 与受测产物一致。

## 发布

按 [双包发布手册](../docs/cookbook/release.md) 完成发布。

- `yondren-psycho-frame@0.6.0` 的 `latest` 已发布。
- `create-yondren-psycho-frame@0.6.0` 的 `latest` 已发布。
- 发布提交为 `5b20a15`，标签为 `v0.6.0`。
- GitHub `main`、GitHub `v0.6.0` 和 Codeup `mirror` 均指向发布提交。
