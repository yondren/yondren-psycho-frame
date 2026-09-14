# Agent Note: 工作模式新增合流开关（merge）

Status: proposed

## Problem

0.3.1 使用反馈：任务分支提交完成后代理不主动合流到 `main`，用户要再问一次"收束到主分支了嘛"。
该行为不是模型偶发，而是骨架契约的四个缺口叠加：

- **完成定义不含合流**：[tasks/README.md](../../../tasks/README.md) 规则 2 的完成顺序以"提交 → 置
  `DONE`"结束，[docs/development.md](../../../docs/development.md) 日常顺序第 7 步同样止于提交；
  合流只在 [docs/architecture.md](../../../docs/architecture.md) 的流转末句作为一个名词出现。
- **没有常驻授权**：`plan=on` 要求改动前先出计划并等确认，`confirmAmbiguous=true` 要求歧义必问；
  合流与推送都不在已确认的计划文本里，默认动作只能是停下来询问。
- **动作位置与规则冲突**：[cookbook/parallel-worktrees.md](../../../docs/cookbook/parallel-worktrees.md)
  一面规定"一个对话只在自己的 `.worktrees/<task_key>` 内工作，文件路径以它为前缀"，一面规定
  "main checkout 只做合流"；合流的触发时机、目标分支与执行者三样都缺。宿主自建分支更落在
  worktree 规则之外（消费者实测 103 个本地分支中 77 个为 `codex/*`）。
- **状态不可见**：没有任何位置记录"待合流"。`doctor`
  （[init.mjs](../../../packages/psycho-frame/src/init.mjs)）只查必需文件、配置与脚本，
  `change-scope` 只算 merge-base，未合分支只能靠人问出来。

后果：任务在 `tasks/` 里可以是 `DONE` 而未合流，`DONE` 与事实脱钩；任务分支与 `main` 的差距
跨会话累积。

## Proposal

在 `workMode` 增加第四把正交开关 `merge`（`off` / `ask` / `auto`，默认 `ask`），语义真源放
[docs/development.md](../../../docs/development.md)：

- `merge=off`：任务不合流，任务卡与报告必须写明保留的分支名与原因。
- `merge=ask`：任务收尾时显式询问是否合流，未获确认前不得静默停止；等价当前实际行为，但把
  沉默改成一次显式询问。
- `merge=auto`：任务置 `DONE` 之前主动把任务分支 merge-forward 到它的父分支；父分支默认
  `main`，栈式分支逐层向上、不越级。**不含推送**：`auto` 只产生本地合流，推送始终另行确认。

配套三件事（缺一开关不生效）：

1. **完成定义**：`tasks/README.md` 规则 2 与 `docs/development.md` 日常顺序改为"合流完成后置
   `DONE`；未合流时写明分支名与原因（`merge=off`、冲突或前置不满足）"。
2. **记录载体**：[reports/README.md](../../../reports/README.md) 模板增加合流状态字段，未合流必须
   写分支名与原因。
3. **机器可见**：`doctor` 增加"领先父分支的本地分支"提示（列出分支与领先提交数，无则通过），把
   "是否已合流"从人问变成命令可查。

失败语义：`merge=auto` 遇到冲突、main checkout 脏或父分支分叉时停止并显式报告（任务置 `BLOCKED`
或写明原因），禁止静默跳过。

取值、默认与校验收敛在 [work-mode.mjs](../../../packages/psycho-frame/src/work-mode.mjs)；`mode`
子命令的解析、回显与 reset 已从 `DEFAULT_WORK_MODE` 派生；模板与仓库自举实例同步同一批默认与语义。

本提案只定义设计，不含实现；落地时按 [tasks/](../../../tasks/README.md) 规则先登记任务并置
`IN_PROGRESS`。

## Alternatives considered

**布尔开关 `merge=on/off`** — 否决：把"项目明确不合流"与"需要授权"混为一谈，且无论默认取哪边都会
改变现有行为；三值让默认 `ask` 与今天的事实一致。

**把 `merge` 与 `push` 合并为一条流水线（如 `merge=auto-push`）** — 否决：推送是外向、难回滚的动作，
[scripts/release.mjs](../../../scripts/release.mjs) 的既有先例是默认不发布不推送、`--push` 才推且推送前
重查远端 OID；消费者实测未推送的 main 提交（`zw` 36 个、`yune-platform` 12 个）可能是刻意保留，
默认自动推送的风险不对称。

**不加开关，只补完成定义与可见性** — 否决：能治"忘记"，治不了授权缺口；`plan=on` 下代理仍会停下来问，
截图行为照旧复现。

**把合流意图写进每张任务卡而不加项目级开关** — 否决：同类决策要在每张任务卡重复，且没有项目级默认；
个别例外仍可由任务卡承载。

**让门禁校验 `DONE` 任务是否真的合流** — 否决：任务卡在任务分支内写就，`DONE` 与合流的先后顺序无法
在单次 `verify` 中判定；可见性由 `doctor` 承担，门禁只保持取值封闭。

## Acceptance criteria

- `psycho-frame verify` 校验 `workMode.merge` 取值封闭（off / ask / auto），非法即失败；旧配置缺省
  使用内置默认，零迁移。
- `mode`、`mode set`、`mode reset` 与 `help mode` 展示 `merge`；`doctor` 的 workMode 缺省提示含新默认值。
- `tasks/README.md` 规则 2 与 `docs/development.md` 日常顺序包含"合流或显式记录未合流"，模板同步。
- `reports/README.md` 报告模板含合流状态字段。
- `doctor` 能列出领先父分支的本地分支及领先提交数；无领先分支时静默通过。
- `merge=auto` 在冲突、脏 main 或父分支分叉时以显式失败收场，任务状态与报告写明原因。
- 测试覆盖：取值封闭与默认迁移（work-mode）、CLI 回显与退出码（cli）、init 生成默认（init）、
  配置增量合并（upgrade）。

## Risks

- **`auto` 被误读为含推送**：缓解是在配置说明、`mode` 帮助与文档三处显式写"不含推送"。
- **脏 main 或冲突下静默失败**：缓解是把失败路径写进验收标准（`BLOCKED` + 报告原因），不只写成功路径。
- **父分支名不是 `main`**：缓解是规则表述为"父分支（创建时的 base）"，`main` 只作默认值；真出现
  `master`/`development` 主线时再引入配置项，避免提前增加配置面。
- **常驻文档预算已紧**：`docs/development.md` 719/750、`docs/cookbook/parallel-worktrees.md` 363/400、
  `docs/cookbook/fleet-mode.md` 396/400；落地时必须先搬迁或精简，再考虑显式提预算。
- **门禁只能校验取值封闭**，无法校验"真的合了"；缓解是 `doctor` 可见性与报告字段，否则规则仍回到
  "靠记得"。
- **宿主分支与 worktree 规则并存**：`codex/*` 一类宿主分支不会因此消失；缓解是把目标分支规则表述为
  "当前分支的父分支"，让 worktree 内外都成立。
