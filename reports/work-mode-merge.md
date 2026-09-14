# 合流开关（merge）执行报告

- task_key: work-mode-merge
- 状态: DONE（实现、验证与合流完成）

## 1. 改了哪些文件

- `packages/psycho-frame/src/work-mode.mjs`：`MERGE_VALUES`、默认 `merge: 'ask'`、
  `validateWorkMode` / `readWorkMode` 覆盖 merge，对象报错文案补键名
- `packages/psycho-frame/src/cli.mjs`：usage 与 `help mode` 展示 merge 取值、默认值与"不含推送"
- `packages/psycho-frame/src/init.mjs`：新增 `branchesAhead`，doctor 在 git 仓库根列出领先
  集成分支（main / master）的本地分支与领先提交数
- 配置：根与模板 `.psycho-frame.json` 加 `workMode.merge`、`docs/cookbook/merge.md` 预算 200，
  `docs/development.md` 预算 750 → 780
- 文档：`docs/development.md`（语义 + 日常顺序第 7 步）、`docs/concepts.md`、
  `docs/architecture.md`、`docs/cookbook/README.md`、`docs/cookbook/parallel-worktrees.md`（合流节
  收敛为链接）、新增 `docs/cookbook/merge.md`、`tasks/README.md` 规则 2、`tasks/AGENTS.md`、
  `reports/README.md` 模板
- 模板同步：上述文件的 `packages/psycho-frame/template/` 副本与 `template/AGENTS.md`
- 测试：`work-mode` / `cli` / `init` / `verify-docs` / `upgrade` 五个套件
- 决策 `decisions/implemented/feature/2026-09-14-work-mode-merge.md`（由同名 proposed 记录转
  implemented）、任务卡与本报告

## 2. 实现了什么

`workMode` 第四把正交开关 `merge`（off / ask / auto，默认 ask）：`auto` 在置 `DONE` 前把任务分支
merge-forward 到父分支（默认 `main`，栈式逐层向上），`ask` 收尾先问，`off` 不合流，三者都不含
推送。语义家在 `docs/development.md`，操作规格（触发、目标、步骤、失败语义）在
`docs/cookbook/merge.md`。配套：`tasks/README.md` 规则 2 的完成顺序加入合流，报告模板加"合流
状态"字段，`doctor` 列出领先集成分支的本地分支。`mode` CLI 的键集合、回显与 reset 仍由
`DEFAULT_WORK_MODE` 派生，只改了 help 文案与示例。

## 3. 跑了哪些命令

- `node --check` 覆盖 `work-mode.mjs` / `init.mjs` / `cli.mjs`
- `pnpm test`（node:test 全量，99 项）
- `node packages/psycho-frame/src/cli.mjs verify`（worktree 内，117 个 Markdown 文件）
- 模板预算脚本：按 `countWords` 口径核对 `template/.psycho-frame.json` 清单全部达标
- 冒烟：worktree 内 `doctor`（列出 9 个历史遗留分支）、`mode`（回显四项含 merge=ask）

## 4. 验证结果

- `pnpm test`：99 项全绿（新增 9 项：merge 取值封闭、缺省补 ask、非法不落盘、mode CLI 回显与
  退出码、`help mode` 含"不含推送"、init 模板默认值与模板文档/预算、doctor 列出领先分支、
  无领先分支时静默、非 git 目录跳过、upgrade 为老配置补 merge）
- `pnpm verify:docs`：通过（117 个 Markdown 文件；链接、决策结构与格式、任务头字段、预算、
  工作模式取值全部合规）
- 模板预算：12 个清单文件全部达标（`merge.md` 192/200、`development.md` 734/780）
- 根预算：13 个清单文件全部达标（`merge.md` 196/200、`development.md` 778/780）
- 冒烟：`doctor` 在含领先分支的仓库给出 note 且退出码 0；`mode` 回显
  `plan=on，confirmAmbiguous=true，fleet=off，merge=ask`

## 5. 文档与决策是否同步

已同步。语义唯一事实源在 `docs/development.md`，合流操作规格独立成页 `docs/cookbook/merge.md`，
其余位置只放链接；完成定义在 `tasks/README.md` 规则 2（`tasks/AGENTS.md` 同步）；决策记录由
proposed 转为 implemented，与代码同一提交；模板与仓库自举实例的默认值、文档、预算一致。

## 6. 合流状态

已合流：分支 `work-mode-merge` 以 `--no-ff` 合入 `main`（merge 提交 `0e2639d`），worktree 已移除；
任务置 `DONE`。

## 7. 还剩什么阻塞

无。包版本 bump 归 release 任务；`merge=auto` 的会话行为本身不进门禁，靠完成定义、报告字段与
doctor 可见性看护。
