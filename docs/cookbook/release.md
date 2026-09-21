# 发布两包到 npm

设计见 [发布决策](../../decisions/implemented/process/2026-09-09-publish-release-script.md)。

## 1. 准备

发布任务先在 worktree 完成材料并合入 main，卡片保持 IN_PROGRESS。
根 checkout 的 main 必须干净，HEAD 与 origin/main 精确相同，tag 无冲突。

```sh
pnpm release:prepare patch --task-key=<key>
```

准备执行安装、bump、文档/内容门禁、当前源码测试、doctor、双包 pack 和受测产物教程冒烟，
再 commit/tag。`--preview` 只读；默认不发布不推送。
恢复记录、原文件及 SHA-512 产物位于 Git common-dir/releases/<version>/，不入 Git，不随清理 worktree 丢失。

## 2. 发布与恢复

```sh
pnpm release --resume=<version> --publish
pnpm release --resume=<version> --publish --push
```

发布保存的 tarball；每包先查 registry 摘要，相同即跳过、不同即停止，缺失才发布。
稳定版 tag 为 latest，预发布为 next；恢复不会改写已存在版本或重新指定 dist-tag。
第二包失败直接同版本恢复。推送使用明确租约，origin 原子提交 main/tag 后再推 codeup mirror。
远端、HEAD/tag 或摘要变化立即停止；mirror 失败同样可恢复。

## 3. 收尾与失败

成功后更新报告、移除 worktree、置 DONE；另核对 CI 与网站。
准备阶段失败不会自动回滚：按 state.json 的 originals 恢复三份文件，核对本地 commit/tag 后保留或移走状态目录再重试。
发布过的版本不能覆盖；认证/网络失败须先解决再恢复，不把查询失败当成未发布。
进程异常退出可能留 .lock，确认没有发布进程后再移除；跨 registry/Git 无全局事务。
