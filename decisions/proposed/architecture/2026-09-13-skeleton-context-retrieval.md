# Agent Note: 骨架层上下文检索与 token 上限设计

Status: proposed

## Problem

常驻入口的 token 已被 `budgets` 管住（根 [AGENTS.md](../../../AGENTS.md) 按门禁口径 478 字，
上限 550），但知识层随记录数单调增长：`decisions/` 28 篇 13,083 字、`reports/` 25 篇
11,016 字、`docs/` 8 篇 4,294 字（口径为
[countWords](../../../packages/psycho-frame/src/verify-docs.mjs)）。预算清单只覆盖 11 个常驻
文件，不覆盖单篇决策与报告，因此 Agent 的上下文成本主要花在"找事实"而非"用事实"，且这项
成本随仓库寿命只增不减。具体缺口：

- 无检索索引：面对 28 篇决策只能逐篇打开；路径编码只给出类别与日期，不表达"这篇回答什么问题"。
- 无单篇上限：一篇超长记录永久进入每次检索的成本，`archived/` 只有人为归档，无超限触发。
- 冷热未分档：分层表说明了职责，未说明**加载时机**；
  [tasks/README.md](../../../tasks/README.md) 的"恢复上下文"路径把 `reports/` 与
  `decisions/` 并列，容易整片读取。
- 门禁报错面向人：[verify-docs.mjs](../../../packages/psycho-frame/src/verify-docs.mjs) 的错误
  是长句、无稳定 code，修一个链接错要先读约 375 行源码。
- 模板缺按需流程层：`.agents/skills/` 只存在于本仓库，
  [template/AGENTS.md](../../../packages/psycho-frame/template/AGENTS.md) 未携带，消费者拿不到
  "流程按需进入上下文"这一档。

## Proposal

在骨架层新增三条机制，真源与归属如下。

**约定层：加载时机分档。** 在 [docs/AGENTS.md](../../../docs/AGENTS.md) 的分层表增加一列
"加载时机（常驻 / 按需 / 冷）"：根 `AGENTS.md` 与子树 `AGENTS.md` 为常驻；`docs/` 事实与
`decisions/` 记录为按需；`reports/` 与 `decisions/archived/` 为冷。各子树 `AGENTS.md` 声明本
目录档位，并给出该档的检索入口（按需档→索引，冷档→按 task_key 定位）。

**生成物层：路由索引与摘要头字段。** 每篇非归档决策在 `Status:` 行后增加一个头字段
`- summary: <一行>`，只回答"本记录回答什么问题"，**不得复述结论、状态或取舍**。门禁顺带生成
`decisions/INDEX.md`（路径、生命周期、类别、summary），并支持 `verify --json` 导出同一份数据；
索引是生成物，禁止手改，门禁重建后比对，不一致即失败。

**门禁层：单篇上限、错误码与上下文打包。** `budgets` 扩展到 `decisions/**` 的单篇上限；
`verify` 每条错误带稳定 code（如 `DOC001`）与修复动作，`--json` 输出该 code；新增
`psycho-frame context <task_key>`，一次输出"常驻入口 + 该任务的决策 summary + 任务卡链接"，
替代 Agent 的自由探索。实现顺序：先索引与 summary（只读、可渐进补齐），再单篇预算与错误码，
最后 `context` 命令；触及 [cli.mjs](../../../packages/psycho-frame/src/cli.mjs) 与
[template/](../../../packages/psycho-frame/template/AGENTS.md) 的改动需同步
[测试](../../../packages/psycho-frame/test/verify-docs.test.mjs) 与升级语义。

本提案只定义设计，不含实现；落地时按 [tasks/](../../../tasks/README.md) 规则先登记任务并置
`IN_PROGRESS`。

## Alternatives considered

**靠 Agent 自律少读文件** — 否决：不可校验、换工具即失效；骨架层的既有价值正来自"规则一旦
机器可校验就不依赖记得去改"，同一标准必须适用于省 token 的规则。

**把 `decisions/` 合并成单一大文件** — 否决：违背 one home per fact，冲突面放大，生命周期在
目录间移动的机制失效，归档冻结也无法表达。

**引入向量检索或嵌入索引** — 否决：违背零运行时依赖与"Markdown + Git 原样带走"的迁移承诺；
在本仓库量级（万级字数）关键词语义检索收益不抵新增依赖与不透明性。

**直接调低既有 `budgets` 数值** — 否决：预算是护栏不是压缩目标，压缩常驻文案会牺牲可追溯性；
缺口在单篇记录与检索路径，不在入口。

**让 summary 承载结论以进一步省 token** — 否决：摘要即第二事实源，正文一改就漂移，正是骨架
要消除的腐化模式；summary 只能做路由。

**把 `reports/` 移出 Git 或移出仓库** — 否决：报告是复盘与追责的冷层真源，移出后不可 diff、
不可随仓库迁移；正确做法是标注冷档并给检索入口，而非删除。

## Acceptance criteria

- `psycho-frame verify` 校验每篇非归档决策存在 `- summary:` 头字段、长度在上限内，并校验
  `decisions/INDEX.md` 与文件名、生命周期、类别一致；缺失或漂移即失败。
- `verify --json` 可导出不含正文的索引数据，Agent 无需读取任何决策正文即可完成路由。
- `budgets` 支持对 `decisions/**` 设置单篇上限；超限报错文案指向"搬迁到 reports/、精简或显式
  提预算"三条出路。
- `verify` 错误包含稳定 code；同一错误在人类输出与 `--json` 中 code 一致。
- `psycho-frame context <task_key>` 输出可复现的上下文包，包含常驻入口、相关决策 summary 与
  任务卡链接，输出中不内联决策正文。
- [template/](../../../packages/psycho-frame/template/AGENTS.md) 携带 `.agents/skills/` 层；
  `init` / `adopt` / `upgrade` 测试覆盖新增文件与配置字段。
- 现有 28 篇决策在迁移提交中补齐 summary 头字段，或按类别分批补齐且期间门禁只警告不失败
  （分批窗口与切换点由实现任务定义）。

## Risks

- **summary 与正文语义漂移**：门禁只能校验存在、长度与唯一性，无法校验语义一致；缓解是把
  summary 限定为"回答什么问题"这一种句式，并在 [docs/AGENTS.md](../../../docs/AGENTS.md)
  写作规则里列为审查项。
- **索引变成第二个家**：缓解是把 `INDEX.md` 明确为生成物、禁止手改、门禁重建比对，与
  `reports/` 一样的冷层定位。
- **单篇上限逼走必要细节**：缓解是保持"先搬迁、再精简、最后才提预算"的既有处理顺序；上限
  只对新增记录生效，存量迁移单独一轮。
- **门禁与模板同时变更**：错误码与索引是消费者可见面，需同步
  [docs/development.md](../../../docs/development.md) 的升级说明与测试，避免骨架升级时静默
  破坏既有仓库的门禁通过状态。
