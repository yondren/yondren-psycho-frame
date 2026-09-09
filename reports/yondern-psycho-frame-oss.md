# yondern-psycho-frame 开源化与 npm 分发 执行报告

- task_key: yondern-psycho-frame-oss
- 状态: DONE

## 1. 改了哪些文件

- 新增 packages/psycho-frame/：src/cli.mjs（五命令）、src/verify-docs.mjs（泛化门禁）、
  src/change-scope.mjs、src/init.mjs（init/adopt/doctor）、template/（21 个模板文件）、
  package.json、README.md。
- 新增 packages/create-yondern-psycho-frame/：bin/create.mjs、package.json、README.md。
- 新增根 .psycho-frame.json、LICENSE。
- 重写：根 package.json、README.md、pnpm-workspace.yaml、.gitignore、
  docs/architecture.md、docs/development.md。
- 更新：docs/AGENTS.md、decisions/README.md、docs/cookbook/parallel-worktrees.md、
  两条既有 process 决策的门禁路径链接（事实同步）。
- 删除（保留在 git 历史）：apps/、docker/、docker-compose.yml、scripts/、.npmrc、
  业务 decisions（feature/bug-fix 全部）、业务 tasks/reports（fde-*、api-key 等）。

## 2. 实现了什么

- pnpm monorepo：核心包 yondern-psycho-frame（门禁 + CLI + 模板）与 create 入口包。
- 门禁泛化：仓库根 = cwd 的 git toplevel（无 git 回退 cwd）；decisionClasses/
  taskStatuses/budgets/ignore 由 .psycho-frame.json 配置，缺省用内置值。
- CLI：verify / scope / init / adopt / doctor，零依赖，仅 Node ≥ 18.20。
- 模板：知识四层 + AGENTS.md + 配置；{{PROJECT_NAME}} 占位符替换；init 只进空目录，
  adopt add-only（既有文件跳过）。
- 仓库自举：根脚本直指包内 CLI，无需 install 即可跑门禁。

## 3. 跑了哪些命令

- `node packages/psycho-frame/src/cli.mjs verify`（仓库，40 个 Markdown 文件）
- `node packages/psycho-frame/src/cli.mjs doctor`
- `node packages/psycho-frame/src/cli.mjs scope --base main`
- `pnpm install`（workspace 链接 + lockfile 清理，无 fde 残留）
- 临时目录端到端：init 新项目 → 项目内 verify/doctor；init 拒绝非空目录；
  adopt 旧项目（既有 README 跳过、原文保留）；create 入口包脚手架。

## 4. 验证结果

- 仓库门禁：通过（40 个 Markdown 文件，链接/锚点、决策结构、任务头字段、预算全绿）。
- doctor：通过（7 个必需文件齐全，无 note）。
- change-scope：输出 formatVersion 1 四层报告，merge-base 解析正确。
- init 端到端：生成 21 文件，包名占位符替换为目录名；生成项目内 verify 通过
  （14 个 Markdown 文件）、doctor 通过。
- init 非空目录：正确拒绝（exit 1）。
- adopt：README.md 显示 [skip] 且原文未动，其余写入；verify/doctor 通过。
- create 入口：经 workspace 链接转发 init 成功，生成项目 verify 通过。
- pnpm-lock.yaml：无 fde-/旧包名残留。

## 5. 文档与决策是否同步

- 决策：[decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md](../decisions/implemented/architecture/2026-09-09-yondern-psycho-frame-oss.md)。
- 文档：README.md、docs/architecture.md、docs/development.md、docs/AGENTS.md、
  decisions/README.md、docs/cookbook/parallel-worktrees.md 同步更新。
- 任务：[tasks/2026-09-09-yondern-psycho-frame-oss.md](../tasks/2026-09-09-yondern-psycho-frame-oss.md)。

## 6. 还剩什么阻塞

- 包名未在 npm 注册；发布顺序先 yondern-psycho-frame 后 create-yondern-psycho-frame。
- 英文模板与仓库 i18n 未做；GitHub remote 与 npm scope 迁移待定。
