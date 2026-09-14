# 任务分支合流

把任务分支 merge-forward 回父分支，是 `workMode.merge` 的收尾动作，语义见
[development.md](../development.md)。

## 触发

任务置 `DONE` 前收束：`auto` 直接合、`ask` 先问、`off` 不合流；未合流时在任务卡与报告写明分支
名与原因，不得静默结束。

## 目标

当前分支的父分支（创建分支时的 base），默认 `main`；栈式分支逐层向上、不越级，不猜
`origin/<branch>`。

## 步骤

```sh
git -C <父分支 checkout> merge --no-ff <task-branch> -m "merge: <描述> [task_key]"
git worktree remove .worktrees/<task_key>
```

1. 修复落在引入问题的那一层，再逐层 merge-forward。
2. 冲突、父分支 checkout 脏或分叉时停下写明原因。
3. 推送不在开关内：推送前核对远程 OID 未变（租约保护）并单独确认。
