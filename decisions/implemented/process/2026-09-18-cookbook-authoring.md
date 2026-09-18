# Agent Note: cookbook 从"手写文档"变成一条命令加技能

Status: implemented

## Problem

cookbook 是骨架里唯一"给下次会话看"的 how-to 层，但新增一本要手工做三件事：写文件、在
[docs/cookbook/README.md](../../../docs/cookbook/README.md) 登记索引、在 `.psycho-frame.json` 的
`budgets` 登记字数上限；漏掉后两件时门禁不会报错（只报预算清单里缺文件，不报新增文件没进清单）。
更关键的是：用户用大白话讲一个反复出现的痛点（"系统里四五套 JDK，AI 每家自己搞一套，我希望有一套
以后大家共用"）时，agent 没有固定的整理路径，倾向于当场解决而不留文档，下次会话重新踩。

## Decision

`psycho-frame cookbook new <slug> [--title <标题>] [--budget <正整数>]`：写 `docs/cookbook/<slug>.md`
骨架（编号步骤 + 验证清单，与既有 cookbook 同构）、在索引追加一行、在 `budgets` 登记上限（默认
400）；文件已存在时幂等跳过，只补索引与预算缺项。

判定标准与五问收敛在 [cookbook/authoring-cookbooks.md](../../../docs/cookbook/authoring-cookbooks.md)：
重复出现、跨会话、可验证、有稳定做法四条同时满足才写；反模式对照表把设计理由、事故故事、任务
进度分别指回 [decisions/](../../../decisions/README.md)、[postmortem/](../../../docs/postmortem/README.md)、
[reports/](../../../reports/README.md)。触发这条流程的技能在
[.agents/skills/author-cookbook/](../../../.agents/skills/author-cookbook/SKILL.md)，随模板分发。

[cookbook/shared-toolchain.md](../../../docs/cookbook/shared-toolchain.md) 是第一个范例，把
"一套就够、全员共用"落成：探测已有 → 选定唯一供给源 → 写进常驻命令与项目声明 → 一条检测命令 →
例外与回收条件。

## Alternatives considered

**只写文档，不加命令** — 否决：索引与预算靠人记，正是反馈里"规则写了但没人执行"的同一种失效；
命令把两件易漏的事变成副产品。

**让 `cookbook new` 顺带改根 AGENTS.md** — 否决：常驻命令要判断"这条约束是否每次会话都必须在场"，
机器判不了；命令只提示，是否加常驻命令由 agent 与用户决定。

**把用户痛点自动分类到 cookbook / decisions / postmortem** — 否决：分类依赖对"是不是决策反转、
是不是一次性"的判断，误判的代价是文档进错层；判定标准给人读，技能只负责按标准追问。

**技能写成流程脚本** — 否决：五问是对话，不是脚本；技能负责触发与追问顺序，落盘交给命令。

## Consequences

- 新增 cookbook 从三件手工事变成一条命令；索引与预算不会再漏。
- 用户的大白话痛点有了固定去处：技能触发 → 五问 → `cookbook new` → 填步骤，必要时补常驻命令。
- 技能随模板分发（`.agents/skills/author-cookbook/`），消费方 init/adopt/upgrade 后同样可用。
- 命令不改根 AGENTS.md：是否加常驻命令仍需判断，漏加时下次会话可能看不到该 cookbook。
