# Agent Note: 骨架评审修复与 DSH 官方门禁对齐

Status: implemented

## Problem

初始化后评审发现门禁与文档语义存在真实缺陷：`archived/` 生命周期要求 `Status: archived`
与"只读永不编辑"互相矛盾，首次归档必然门禁失败；根 [AGENTS.md](../../../AGENTS.md) 引用
不存在的"计划模板"；tasks/ 头字段无机器校验；pnpm 运行污染工作区。同时对照 DSH 官方仓库
（deepseek-ai/deepseek-harness）裁剪前身，发现 Status 语法、类别封闭集合、implemented 禁
提案期章节、链接锚点校验、change-scope 健壮性等可低代价对齐。

## Decision

- 归档语义对齐官方：`archived/` 保留 `Status: implemented`，紧接状态行插入
  `Archived: YYYY-MM-DD`；门禁只复查归档头部，跳过章节与出站链接（冻结历史不复查），
  语义见 [decisions/README.md](../../../decisions/README.md)。
- Status 语法对齐官方：rejected 必须携带原因（`Status: rejected — <原因，一行>`）；
  implemented 禁 `## Proposal` / `## Plan` / `## Migration plan` / `## Acceptance criteria`。
- 类别改为封闭集合（feature / bug-fix / simplification / architecture / process / testing），
  新增类别须同步门禁内置集合与 [decisions/README.md](../../../decisions/README.md)。
- [verify-docs.mjs](../../../packages/psycho-frame/src/verify-docs.mjs) 扩展为四组检查：链接与锚点（GitHub slug
  + `<a id>`、引用式链接与定义、围栏感知）、决策结构与格式、任务头字段（task_key/status/
  created/updated/report，状态枚举、key 与文件名一致）、字数预算；根目录自脚本位置推导，
  预算清单解析容错。
- [change-scope.mjs](../../../packages/psycho-frame/src/change-scope.mjs) 对齐官方：parseArgs 严格参数、
  `--end-of-options` 防 ref 注入、merge-base 唯一性、`-z` NUL 路径解析、版本化报告结构
  （formatVersion / repositoryRoot / input / resolved / paths）。
- 修复断引用与一致性：根 [AGENTS.md](../../../AGENTS.md) 移除不存在的"计划模板"指向
  decisions/proposed 提案格式；微小改动豁免统一表述，home 在
  [docs/development.md](../../../docs/development.md)；"CI 后续接入"等未来态措辞改为现态。
- 删除死脚本 `doc-sync`；提交 pnpm-lock.yaml 并加 `packageManager: pnpm@11.20.0`；
  [.gitignore](../../../.gitignore) 增 `.pnpm-store/`；字数预算清单由 4 个文件扩到 11 个。
- 环境适配：本任务在单 checkout 内以分支 `skeleton-review-fixes` 完成（沙箱拒绝 workspace
  外的 worktree 写入；单任务无并行 checkout，worktree 规则的隔离目的不损失）。

## Alternatives considered

**全量照搬官方归档冻结机制（i18n 三件套 + sha256 append-only manifest）**
— 否决：骨架单语言、零归档存量，三件套与冻结 manifest 是负资产；归档头部语义先行，
冻结 manifest 列为后续候选（见[报告](../../../reports/skeleton-review-fixes.md)）。

**移植官方 verify-md-links 的 mdast AST 解析** — 否决：引入依赖违反零依赖约束；
用围栏感知 + 行内代码剔除的轻量解析覆盖骨架需要。

**保留骨架自有 `Status: archived` 语义并改文档迁就** — 否决：与官方语义偏离会在对照
与迁移时产生换算成本；骨架无既有归档记录，对齐成本最低。

**微小改动豁免保留两处表述（decisions 与 development 各一）** — 否决：违反 one home
per fact；统一到 docs/development.md，decisions/ 与 tasks/ 以链接引用。

## Consequences

- 门禁从单一脚本扩展为链接+锚点、决策结构+格式、任务头字段、预算四组检查，
  评审发现的缺陷面首次运行即被覆盖。
- 归档语义与官方一致，对照或迁移 DSH 官方时无语义换算成本。
- rejected 记录必须写原因；提案期章节无法渗入已落地记录。
- 字数预算覆盖面由 4 个常驻文档扩到 11 个，膨胀护栏更完整。
