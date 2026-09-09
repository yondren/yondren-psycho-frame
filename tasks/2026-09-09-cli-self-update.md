# CLI 自升级命令与任意命令的自动版本检查提示

- task_key: cli-self-update
- status: DONE
- created: 2026-09-09
- updated: 2026-09-09
- report: [reports/cli-self-update.md](../reports/cli-self-update.md)

## 范围

新增 `psycho-frame self-upgrade`：查询 npm registry，有新版时无缝升级（npm 全局安装
自动 `npm install -g`，其余安装方式打印对应指引），`--check` 只查询（退出码 0=最新、
1=落后）。运行任意命令时自动检查最新版本并提示：零依赖、不阻塞命令、离线静默、
24h 节流、非 TTY/CI 跳过，可用 `PSYCHO_FRAME_NO_UPDATE_CHECK=1` 关闭。
