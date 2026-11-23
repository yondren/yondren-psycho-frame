# 执行报告

- [项目综合评估](project-assessment.md)（含复现证据与改进优先级）。
- [工作区接管收尾](workspace-closeout.md)（成果保全、合流与清理）。

- [六项加固验收](hardening-completion.md)（F01—F12 修复、验证和收尾）。

- [文档整理提示词验收](document-maintenance.md)。

单次执行的过程产物，命名 `reports/<task_key>.md`。同一任务多轮迭代继续更新同一份，
不建日期副本。报告是过程记录，不是长期事实；长期结论去 docs/ 与 decisions/。
任务规则见 [tasks/README.md](../tasks/README.md)。

## 模板

```md
# <任务名称> 执行报告

- task_key:
- 状态:

## 1. 改了哪些文件
## 2. 实现了什么
## 3. 跑了哪些命令
## 4. 验证结果
## 5. 文档与决策是否同步
## 6. 合流状态（已合流的分支与目标，或未合流的分支名与原因）
## 7. 还剩什么阻塞
```
