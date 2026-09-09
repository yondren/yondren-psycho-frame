# 决策记录（Decision Notes）

每个"为什么这么定 + 放弃了什么"的事实记一条。路径编码
`{生命周期}/{类别}/yyyy-mm-dd-主题.md`，随状态变化在生命周期目录间移动。
交叉引用只用相对 Markdown 链接，不用纯文本或编号，门禁机械校验。

## 生命周期

- `proposed/` 提案（未实施）。`Status: proposed`。
- `implemented/` 已落地，现在时描述现实；随代码事实（路径、名称、默认值）同步更新，只改事实不改决策。
- `rejected/` 已否决。`Status: rejected — <原因，一行>`；只保留能防止再次踩坑的，否则删除。
- `archived/` 冻结历史。从 `implemented/` 移入：保留 `Status: implemented`，紧接状态行插入
  `Archived: YYYY-MM-DD`（不早于文件名日期），修复入站链接。归档后只读——永不编辑、翻译、
  重排、移动或删除，也不作为当前行为依据；文档门禁只复查归档头部，跳过章节与出站链接。

## 类别（封闭集合）

封闭集合定义在 [.psycho-frame.json](../.psycho-frame.json) 的 `decisionClasses`；本仓库默认
`feature` / `bug-fix` / `simplification` / `architecture` / `process` / `testing`。
新增类别须同时更新配置文件与本表。

## 何时写

每个非平凡变更（改变行为、架构、跨文件契约、流程、格式）必须在同一提交中新增或更新
至少一条记录；更新已有记录优先于新建。纯机械/局部编辑豁免（判定与微小改动一致，见
[docs/development.md](../docs/development.md)）。决策反转必须新记录 + 交叉链接，不得把旧记录
改写为相反决策。

## 格式

前四行严格为（门禁强制）：

```md
# Agent Note: <标题>

Status: <状态>
```

后跟空行；`Status:` 全文只出现一次。正文首个章节为 `## Problem`。

- `implemented/`：`## Problem` `## Decision` `## Alternatives considered` `## Consequences`；
  禁止 `## Proposal`、`## Plan`、`## Migration plan`、`## Acceptance criteria`（提案期用语）。
- `proposed/`：`## Problem` `## Proposal` `## Alternatives considered` `## Acceptance criteria` `## Risks`。
- `rejected/`：`## Problem` `## Proposal` `## Alternatives considered`，保留提案章节，结论写在 `Status:` 行。
- `## Alternatives considered` 必填：每个被否方案一个加粗引导段落，含败因。
- 文件名日期为首次提出日期（按 git 历史）。
