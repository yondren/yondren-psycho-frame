# 文档标准

本文件定义文档分层、书写规则与反腐化自查清单。写作或审查文档前先读本文件；
机器门禁为 `pnpm verify:docs`（[verify-docs.mjs](../packages/psycho-frame/src/verify-docs.mjs)）。

## 分层：每个事实只有一个家

| 层级 | 职责 | 不归它管 |
| --- | --- | --- |
| 根 [AGENTS.md](../AGENTS.md) | 常驻命令，1–3 句/条 + 链接 | 故事、流程细节 |
| 子树 AGENTS.md（`docs/`、`decisions/`、`reports/`、`tasks/`） | 该目录专属命令 | 全仓库规则 |
| [architecture.md](architecture.md) | 结构地图：模块、流转、扩展点；改代码前必读 | 单模块细节 |
| [development.md](development.md) | 环境搭建与日常工作流 | 设计理由（→ decisions/） |
| [cookbook/](cookbook/README.md) | 带验证步骤的 how-to | 设计理由（→ decisions/） |
| [postmortem/](postmortem/README.md) | 事故故事（唯一允许"讲故事"的层级） | — |
| `decisions/` | 决策记录：为什么、放弃了什么 | 变更史（→ commit/reports） |
| `reports/` | 单次执行的过程产物 | 长期事实 |
| `tasks/` | 任务状态 | 任务内容细节（→ docs/reports） |

## 书写规则

1. 只写当前状态，不写变更史：禁止"之前/现在/不再/已迁移"式叙述。
2. 引用一律用相对路径链接，禁止绝对路径与裸文件名；链接目标与 `#锚点` 由门禁校验。
3. 一段一条规则；代码块与表格保持原格式。
4. 反腐化自查（官方 slop checklist 裁剪）：
   - 同一规则是否在多处重复？保留一家，其余改为链接。
   - 是否在复述历史或堆进度记录？移到 commit/reports。
   - 是否在标注"已实现/未来将"？状态由代码与 tasks/ 承载。
   - 是否在写推理过程？只留结论合同，删掉推导过程。

## 字数预算

[.psycho-frame.json](../.psycho-frame.json) 的 `budgets` 字段为易膨胀的常驻文档设置词数上限
（`wc -w` 语义），超限或清单内文件缺失即门禁失败。处理顺序：先搬迁到归属层、再精简、
最后才显式提高预算并说明理由。预算是护栏，不是压缩目标。
