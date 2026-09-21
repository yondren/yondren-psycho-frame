# task-hook-lifecycle 执行报告

- task_key: task-hook-lifecycle
- 状态: IN_PROGRESS

## 1. 改了哪些文件

worktree 模块、CLI 帮助、worktree 测试、并行 cookbook 及模板、task start 决策。

## 2. 实现了什么

F02：隔离目录中的 hook 转发原脚本，保留参数、stdin、退出码；拒绝覆盖自定义转发项。
F09：DONE key 拒绝重开；重试校验任务状态、报告链接，并修复缺失报告与已知转发项。task check 检测损坏转发和分支错配。

## 3. 跑了哪些命令

scope --base main；node --test packages/psycho-frame/test/*.test.mjs；verify；git diff --check。

## 4. 验证结果

170 个核心测试通过。新增既有拒绝 hook、自定义含空格引号路径、DONE 重开、幂等恢复四项场景。

## 5. 文档与决策是否同步

CLI 帮助、cookbook 及模板、既有 task start 决策同步。

## 6. 合流状态

待合流 main，无远端推送。

## 7. 还剩什么阻塞

无。hooks 转发保留原来源；未知 installer 修改隔离目录时须用户迁移，不承诺自动兼容。
