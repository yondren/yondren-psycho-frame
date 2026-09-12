# 消费方门禁入口：零依赖路径与 pnpm 单一化

- task_key: consumer-gate-entry
- status: DONE
- created: 2026-09-13
- updated: 2026-09-13
- report: [reports/consumer-gate-entry.md](../reports/consumer-gate-entry.md)

## 范围

本次包含：模板与使用者向文档的门禁入口分层（`pnpm verify:docs` 自动补齐 devDependency +
workspace 内免安装兜底）；环境段删去"npm/yarn 亦可"并写清沙箱与混装规则；worktree cookbook
新增依赖供给步骤；`init`/`doctor` 输出给出可执行的门禁接入提示；模板内置零依赖 CI。

本次不包含：CLI 新增子命令、包管理器抽象层、把绝对值 store 写进仓库配置。

## 进度

- [DONE] 2026-09-13 模板环境段、入口分层、worktree 依赖供给、模板 CI、init/doctor 提示全部
  落地；门禁、83 条测试与脚手架端到端验证通过，报告与决策已同步。
- [IN_PROGRESS] 2026-09-13 开工。消费者场景已实测：agent 沙箱内 `npm`/`npx`/`pnpm dlx`
  写不了 workspace 外缓存（EPERM），项目内 `pnpm install` 与 `pnpm verify:docs` 可用。
