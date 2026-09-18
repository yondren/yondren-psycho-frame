# cookbook-authoring 执行报告

- task_key: cookbook-authoring
- 状态: DONE

## 1. 改了哪些文件

- 新增 `packages/psycho-frame/src/cookbook.mjs`：`newCookbook`（写骨架、登记索引、登记预算）、
  `cookbookText`、`SLUG_RE`。
- `packages/psycho-frame/src/cli.mjs`：`cookbook new` 子命令、帮助文本与示例、USAGE。
- 新增 `docs/cookbook/authoring-cookbooks.md`（判定四条 + 五问 + 反模式对照表）、
  `docs/cookbook/shared-toolchain.md`（共享工具链范例，Java/Maven 案例）。
- 新增 `.agents/skills/author-cookbook/SKILL.md`：用户大白话讲重复痛点时的触发技能。
- `packages/psycho-frame/src/worktree.mjs`：修 `mergeCards` 优先级——任务状态以主 checkout 为权威，
  分支只补主 checkout 没有的卡（详见第 4 节）。
- 测试：新增 `test/cookbook.test.mjs`（9 项）、`test/cli.test.mjs` 加 2 项、`test/worktree.test.mjs`
  加 1 项回归、`test/init.test.mjs` 加模板落地用例。
- 文档与配置：[docs/architecture.md](../docs/architecture.md)（cookbook 扩展点）、
  [packages/psycho-frame/README.md](../packages/psycho-frame/README.md)（命令表）、
  [docs/cookbook/README.md](../docs/cookbook/README.md)（索引）、
  [website/scripts/content-map.mjs](../website/scripts/content-map.mjs)（两个新页面）、
  [.psycho-frame.json](../.psycho-frame.json)（预算）。
- 模板镜像：上述两本 cookbook、技能、索引与预算同步进 `packages/psycho-frame/template/`。
- 决策：[cookbook 从"手写文档"变成一条命令加技能](../decisions/implemented/process/2026-09-18-cookbook-authoring.md)，
  并更新 [task start 记录](../decisions/implemented/process/2026-09-18-task-start-cli.md)的任务卡权威方向。

## 2. 实现了什么

`psycho-frame cookbook new <slug> [--title] [--budget]` 一条命令完成新增 cookbook 的三件事：写
`docs/cookbook/<slug>.md` 骨架（编号步骤 + 验证清单）、在索引追加一行、在 `budgets` 登记字数上限
（默认 400）；重复执行幂等，只补缺项。

`authoring-cookbooks.md` 给出判定标准（重复出现、跨会话、可验证、有稳定做法）与五问，并用
`shared-toolchain.md` 当范例：探测已有安装 → 选定唯一供给源（优先已有、被 IDE/CI 引用的那套）→
写进常驻命令与项目声明 → 一条检测命令 → 例外与回收条件。这正是用户描述的"系统里四五套
JDK/Maven，AI 各家自己搞一套，我希望有一套以后大家共用"。

`.agents/skills/author-cookbook/` 让这条流程能被自动触发：用户在会话里用大白话讲重复痛点时，
技能给出五问与落地步骤。

## 3. 跑了哪些命令

- `psycho-frame task start cookbook-authoring --title ...`、`task check`。
- `node --test packages/psycho-frame/test/*.test.mjs`（162 项）。
- `psycho-frame verify`（163 个 Markdown 文件）、毁灭模式自审 `verify --base main`
  （`[ok] pnpm test`、`[ok] pnpm run doctor`），随后 `mode set destroy=off` 复位。
- 模板落地检查：`scaffold` 后确认 `.agents/skills/author-cookbook/SKILL.md` 与两本 cookbook 存在。
- 打包检查：`npm pack --dry-run` 确认 `.agents/`、`.github/` 与两本 cookbook 随包发布。

## 4. 验证结果

- 测试 162 项全过；文档门禁通过（163 个文件）；`task check` 通过。
- 毁灭模式自审全绿（矩阵 2 条通过）。
- **dogfooding 抓到并修掉一个假阳性**：`task check` 在任务 3 的 worktree 里报"任务
  pr-issue-cookbook 为 IN_PROGRESS 但没有 worktree"——该任务其实已合流并置 DONE，只是本分支
  还停在旧提交。原因是任务卡合并视图让当前 checkout 覆盖主 checkout。改为"主 checkout 权威、
  当前 checkout 只补缺"后消失，并加回归测试锁住。
- 打包检查确认新增的 `.agents/` 点目录随 npm 包发布（模板能把它发给消费方）。

## 5. 文档与决策是否同步

同步。判定标准与五问的唯一家在新增 cookbook，技能只负责触发与追问顺序并链接回它；命令用法在包
README 与 CLI 帮助；扩展点进 [docs/architecture.md](../docs/architecture.md)。决策记录一条新增 +
一条事实更新（任务卡权威方向）。预算上调三处：新增
`docs/cookbook/authoring-cookbooks.md`（650）、`docs/cookbook/shared-toolchain.md`（580），
`docs/cookbook/README.md` 200→240（索引新增两行），模板同步。

## 6. 合流状态

已按用户授权合流到 `main`：任务提交 `b2cbb6c`、合流提交 `8df7b56`
（`git merge --no-ff cookbook-authoring`），worktree `.worktrees/cookbook-authoring` 已删除。

## 7. 还剩什么阻塞

无。
