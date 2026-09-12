# CLI 健壮性与元数据一致性

- task_key: cli-robustness
- status: DONE
- created: 2026-09-13
- updated: 2026-09-13
- report: [reports/cli-robustness.md](../reports/cli-robustness.md)

## 范围

本次包含：`upgrade` 识别框架源码仓库并中止；根 `package.json` engines 对齐 Node ≥ 22.13
并新增 `.nvmrc`；`doctor` 把缺失 package.json 从 issue 降为 note；任务头 `report` 字段强制
指向 `reports/<task_key>.md` 并重命名历史不一致报告；补 0.3.0 发布任务的历史收尾。

本次不包含：P0 官网基路径（用户负责）；upgrade 配置合并语义与官网内容映射（任务 3）。

## 进度

- [DONE] 2026-09-13 upgrade 自保护、report 强校验、engines/.nvmrc、doctor 判定、历史收尾全部落地；
  验证与合流完成。
