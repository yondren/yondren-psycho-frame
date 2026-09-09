# upgrade 命令缺陷修复（README 覆盖 / 根定位 / 空目录防护 / 异常处理）

- task_key: upgrade-fixes
- status: DONE
- created: 2026-09-09
- updated: 2026-09-09
- report: [reports/upgrade-fixes.md](../reports/upgrade-fixes.md)

## 范围

修复 `psycho-frame upgrade` 四个缺陷：用户自定义的 README.md 被模板覆盖（改为保留本地并
报告）；无显式目录参数时不解析 git 仓库根（子目录运行会把骨架撒进子目录，改为与
verify/mode 一致解析仓库根）；空目录/非骨架目录无前置检查（补骨架特征检查并提示
init/adopt）；异常场景（目标为文件、不可读等）抛原始堆栈（补 try/catch 与前置校验）。
