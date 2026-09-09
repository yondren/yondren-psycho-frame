# 骨架评审修复与 DSH 官方门禁对齐

- task_key: skeleton-review-fixes
- status: DONE
- created: 2026-09-07
- updated: 2026-09-07
- report: [reports/skeleton-review-fixes.md](../reports/skeleton-review-fixes.md)

## 范围

本次包含：评审发现的 P1/P2/P3 修复（归档语义矛盾、断引用、任务头字段门禁、pnpm 工作区
污染、微小改动豁免统一、未来态措辞、doc-sync 死脚本、预算清单扩充、change-scope 参数
健壮性、verify-docs 根目录解析、引用式链接与锚点校验、packageManager、.DS_Store 清理），
以及对照 DSH 官方仓库（deepseek-ai/deepseek-harness）的 gap 盘点与门禁对齐（Status 语法、
类别封闭集合、implemented 禁提案期章节、归档头部语义）。

本次不包含：CI 接入、lefthook 与 hooks installer、归档冻结 manifest、verify-md-wrap 移植、
官方 skills（dsh-doc / dsh-prose-standard / dsh-archive-agent-notes）移植、catalog 生成器族
（业务代码出现后再评估）。

## 进度

- [DONE] 2026-09-07 修复落地，门禁负向/正向验证通过，变更已提交并 merge 回 main。
