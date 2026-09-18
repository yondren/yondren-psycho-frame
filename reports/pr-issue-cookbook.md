# pr-issue-cookbook 执行报告

- task_key: pr-issue-cookbook
- 状态: DONE

## 1. 改了哪些文件

- 新增 `docs/cookbook/submit-pr.md`：提 issue 与 PR 的协议（该开什么、正文结构、`gh` 命令、回退、
  CI 与 review 规则、验证清单）。
- 新增 `.github/PULL_REQUEST_TEMPLATE.md`、`.github/ISSUE_TEMPLATE/bug_report.md`、
  `.github/ISSUE_TEMPLATE/feature_request.md`：正文小节骨架，规则链接到 cookbook。
- `packages/psycho-frame/src/verify-docs.mjs`：目录遍历的跳过集合收敛为 `SKIP_DIRS`，新增 `.local`
  （issue/PR 正文草稿的默认位置不参与门禁）。
- `packages/psycho-frame/test/verify-docs.test.mjs`：新增「跳过 `.local/` 与 `.worktrees/`」用例。
- `packages/psycho-frame/test/init.test.mjs`：新增「issue/PR 模板与 cookbook 随模板落地」用例。
- 文档：[AGENTS.md](../AGENTS.md)（提 issue / PR 一条常驻命令）、
  [docs/architecture.md](../docs/architecture.md)（门禁跳过目录的事实）、
  [docs/cookbook/README.md](../docs/cookbook/README.md)（索引）。
- 配置：[.psycho-frame.json](../.psycho-frame.json) 新增 `docs/cookbook/submit-pr.md` 预算并把
  `docs/cookbook/README.md` 120→200。
- 官网：[website/scripts/content-map.mjs](../website/scripts/content-map.mjs) 新增「提 issue 与 PR」
  页面（源文件即上述 cookbook）。
- 模板镜像：`template/docs/cookbook/submit-pr.md`、`template/.github/`（PR + 两个 issue 模板）、
  `template/gitignore`（`.local/`）、`template/AGENTS.md`、`template/docs/cookbook/README.md`、
  `template/.psycho-frame.json`。
- 决策：[提 issue 与 PR 的 cookbook 与模板](../decisions/implemented/process/2026-09-18-submit-pr-cookbook.md)。

## 2. 实现了什么

agent 现在有了一条可直接执行的提交流程：先判断该开 issue、PR 还是都不开（重复单先搜索，命中就补
评论），再按模板写正文（范围、改动面、验证证据含退出码、决策记录、风险与回退、未包含项、task_key），
用 `gh ... --body-file` 提交，草稿落在 `.local/`；无 `gh` 或远端非 GitHub 时打印正文交人粘贴。
CI 红时追加修复提交（重写已推历史必须租约保护），review 逐条回复，合并与关闭由人决定。

配套把 `.local/` 纳入门禁的跳过集合，否则「草稿写 `.local/`」这条建议会让门禁去校验草稿里的临时
链接。

## 3. 跑了哪些命令

- `psycho-frame task start pr-issue-cookbook --title ...`（首次实战使用任务 1 新增的命令）。
- `node packages/psycho-frame/src/cli.mjs verify`、`task check`。
- `node --test packages/psycho-frame/test/*.test.mjs`。
- 官网内容映射存在性校验：逐个 `contentMap.src` 检查文件存在（全部 ok）。

## 4. 验证结果

- 文档门禁通过：154 个 Markdown 文件（新增模板与 cookbook 后）。
- 测试 149 项全过（新增 2 项：`.local/` 跳过、模板落地）。
- `task check` 通过（worktree 纪律）。
- 官网映射：`docs/cookbook/submit-pr.md` 存在且映射到 `src/guide/submit-pr`。
- 未跑 `pnpm docs:build`：官网依赖未在 worktree 内安装，构建属 CI/发布流程；本轮只校验映射与源
  文件存在。

## 5. 文档与决策是否同步

同步。规则与理由的唯一家在新增 cookbook，模板只承载小节骨架并链接回 cookbook；常驻命令进
[AGENTS.md](../AGENTS.md) 与模板镜像；决策记录一条新增。预算上调两处：新增
`docs/cookbook/submit-pr.md`（550），`docs/cookbook/README.md` 120→200（索引新增条目），理由与
位置写在决策记录中。

## 6. 合流状态

已按 `workMode.merge=ask`（用户授权）合流到 `main`：任务提交 `253e5b4`、合流提交 `d9cbf7a`
（`git merge --no-ff pr-issue-cookbook`），worktree `.worktrees/pr-issue-cookbook` 已删除。

## 7. 还剩什么阻塞

无。后续任务：`cookbook-authoring`（`cookbook new` 命令、authoring 技能与文档、共享工具链范例）。
