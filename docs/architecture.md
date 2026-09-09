# 架构地图

本仓库 = 产品代码（packages/）+ 自举实例（知识四层）。改 `packages/`、`AGENTS.md` 分层
或目录结构前先读本文件。

## 组成

- 产品层：[packages/psycho-frame](../packages/psycho-frame/README.md)（门禁 verify-docs/
  change-scope + CLI + 模板 template/）、
  [packages/create-yondren-psycho-frame](../packages/create-yondren-psycho-frame/README.md)
  （npm create 入口，转发 init）。
- 自举层：`docs/`（当前事实）、`decisions/`（理由）、`tasks/`（状态）、`reports/`（过程）；
  仓库按产品的方式组织自身文档，即模板 `template/` 的源头。
- 配置：[.psycho-frame.json](../.psycho-frame.json)：决策类别、任务状态、工作模式、字数预算、忽略路径。
- 指令层：根 `AGENTS.md` + 子树 `AGENTS.md`，Agent 按当前目录自动收到对应规则。
- 门禁层：`packages/psycho-frame/src/`（零依赖 Node 脚本，任意目录运行都解析同一仓库根）。
- 网站层：[website/](../website/README.md)：VitePress 官网，指南/参考由 sync-content.mjs
  从权威文档生成，构建前运行；手写内容只有首页与站点配置。

## 流转

任务 → worktree → 编码/文档 → change-scope 取改动面 → 最窄验证 → 决策记录 + 报告 →
`pnpm verify:docs` → 提交（含 task_key）→ merge-forward 合流。

## 扩展点

- 门禁语义在 `packages/psycho-frame/src/verify-docs.mjs`；封闭集合与预算走
  `.psycho-frame.json`，缺省用包内置值。
- 工作模式（plan / confirmAmbiguous）的取值、读写与默认收敛在
  `packages/psycho-frame/src/work-mode.mjs`，verify 门禁与 mode CLI 共用。
- 骨架升级语义在 `packages/psycho-frame/src/upgrade.mjs`：模板优先 + 本地改动备份、
  配置增量合并、--dry-run 预览。
- CLI 自升级与自动版本检查在 `packages/psycho-frame/src/self-update.mjs`：`self-upgrade`
  命令、registry 查询、24h 节流缓存与交互终端提示。
- 两包锁步发布在 [scripts/release.mjs](../scripts/release.mjs)：bump 两包与模板 pin、预检、
  pack 检查、commit/tag、按序双发与推送（默认不发布不推送）。
- 模板在 `packages/psycho-frame/template/`；新增可选模块同步 docs/cookbook/。
- 官网页面映射在 `website/scripts/sync-content.mjs` 的 MAP；新增文档页先加映射再发布。
- 高频操作沉淀为 `.agents/skills/<name>/SKILL.md`。
- 全量门禁矩阵归 CI；本地只跑改动面匹配的检查。
