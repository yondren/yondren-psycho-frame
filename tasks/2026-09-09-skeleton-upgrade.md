# 骨架一键升级命令（psycho-frame upgrade）

- task_key: skeleton-upgrade
- status: DONE
- created: 2026-09-09
- updated: 2026-09-09
- report: [reports/skeleton-upgrade.md](../reports/skeleton-upgrade.md)

## 范围

新增 `psycho-frame upgrade [目录]`：把模板骨架文件一键同步进已有项目，模板优先、
被覆盖的本地改动自动备份到 `.psycho-frame-upgrade/`，`.psycho-frame.json` 与
`package.json` 做键级合并（保留用户值、只补模板新增键/脚本），`--dry-run` 只预览
（有变更退出码 1）；模板/仓库文档与 .gitignore 同步备份目录忽略规则。
