# upgrade 命令缺陷修复（README / 根定位 / 空目录 / 异常处理）执行报告

- task_key: upgrade-fixes
- 状态: DONE

## 1. 改了哪些文件

- `packages/psycho-frame/src/upgrade.mjs`（README 保留本地、前置守卫、目标校验、kept 报告）
- `packages/psycho-frame/src/cli.mjs`（upgrade 根解析对齐 verify/mode、try/catch、USAGE）
- `README.md`、`packages/psycho-frame/README.md`（upgrade 行补充新语义）
- 决策：新增 `decisions/implemented/bug-fix/2026-09-09-upgrade-guardrails.md`，更新
  `decisions/implemented/feature/2026-09-09-skeleton-upgrade.md` 事实并交叉链接
- 任务 `tasks/2026-09-09-upgrade-fixes.md`

## 2. 实现了什么

修复 upgrade 四个缺陷：① README.md 属用户内容，与模板不同时保留本地并报告（缺失时仍补
模板起始版）；② 无显式目录参数时定位 git 仓库根（与 verify/mode 一致），子目录误跑不再
撒文件；③ 前置守卫：目标须存在、为目录且带骨架特征（AGENTS.md / .psycho-frame.json /
package.json / docs 之一），否则中止并提示 init/adopt；④ 异常输出一行可读错误、退出码 1。

## 3. 跑了哪些命令

- `node --check` × 2；四场景回归脚本（A 用户 README、B 子目录、C 空目录、D 目标为文件）
- 正常路径回归：删文件 + 改 AGENTS.md → upgrade → verify/doctor
- `pnpm verify:docs`、`pnpm run doctor`、官网 sync、`pnpm change-scope --base 9cd5561`

## 4. 验证结果

- A：README 保留本地、报告列出、exit 0；B：子目录零写入、dry-run 定位到项目根；
  C：空目录中止（一行提示）exit 1、零写入；D：目标为文件一行错误 exit 1
- 回归：AGENTS.md 更新+备份、postmortem 恢复，升级后 verify/doctor 通过
- verify:docs 通过、doctor 通过、官网 sync 12 页无报错

## 5. 文档与决策是否同步

已同步。bug-fix 决策记录随本提交落地，skeleton-upgrade 决策事实更新并交叉链接；
README×2 的 upgrade 行同步新语义。

## 6. 还剩什么阻塞

无。
