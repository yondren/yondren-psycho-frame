# Agent Note: 工作模式新增合流开关（merge）

Status: implemented

## Problem

0.3.1 使用反馈：任务分支提交完成后代理不主动合流到 `main`，用户要再问一次"收束到主分支了嘛"。
根因是四个契约缺口叠加：完成定义以"提交 → 置 `DONE`"结束，合流不在其中；`plan=on` 与
`confirmAmbiguous=true` 下没有对合流的常驻授权，默认动作只能是询问；会话绑定 worktree 而合流要
在父分支 checkout 执行，触发时机、目标分支与执行者三样都缺；没有任何位置记录"待合流"，而消费者
实际使用的宿主分支（实测 103 个本地分支中 77 个为 `codex/*`）还落在 worktree 规则之外。

## Decision

- `.psycho-frame.json` 的 `workMode` 新增第四把正交开关 `merge`（`off` / `ask` / `auto`，默认
  `ask`），与 `plan`、`confirmAmbiguous`、`fleet` 并列：`auto` 在置 `DONE` 前把任务分支
  merge-forward 到父分支（默认 `main`，栈式逐层向上），`ask` 收尾先问，`off` 不合流；三者都
  不含推送。冲突、父分支 checkout 脏或分叉时停下写明原因，不静默跳过。
- 语义唯一事实源在 [docs/development.md](../../../docs/development.md)，操作规格（触发、目标、步骤与
  失败语义）在新增的 [docs/cookbook/merge.md](../../../docs/cookbook/merge.md)；
  [cookbook/parallel-worktrees.md](../../../docs/cookbook/parallel-worktrees.md) 的合流节只留链接。
- 完成定义写进 [tasks/README.md](../../../tasks/README.md) 规则 2：提交后合流，未合流须在任务卡与
  报告写明分支名与原因，再置 `DONE`；
  [reports/README.md](../../../reports/README.md) 模板相应增加"合流状态"字段。
- 机器可见：[doctor](../../../packages/psycho-frame/src/init.mjs) 在 git 仓库根列出领先集成分支
  （优先 `main`，其次 `master`）的本地分支与领先提交数，只记 note、不改变退出码。
- 取值、默认与校验收敛在 [work-mode.mjs](../../../packages/psycho-frame/src/work-mode.mjs)；`mode` CLI
  的解析、回显与 reset 从 `DEFAULT_WORK_MODE` 派生，新增开关不必改 CLI 列表。
- 模板与仓库自举实例同步同一批默认与语义；`upgrade` 的配置深合并为老项目补 `merge=ask`，老配置
  零迁移。

## Alternatives considered

**布尔开关 `merge=on/off`** — 否决：把"项目明确不合流"与"需要授权"混为一谈，默认值取哪边都会改变
现有行为；三值让默认 `ask` 与今天的事实一致。

**把 `merge` 与 `push` 合并为一条流水线** — 否决：推送是外向、难回滚的动作，
[scripts/release.mjs](../../../scripts/release.mjs) 的既有先例是默认不推送、`--push` 才推且推送前重查
远端 OID；消费者实测未推送的 main 提交（`zw` 36 个、`yune-platform` 12 个）可能是刻意保留，默认
自动推送的风险不对称。

**只补完成定义与 doctor 可见性，不加开关** — 否决：能治"忘记"，治不了授权缺口，`plan=on` 下代理
仍会停下来问。

**把合流规格写进 parallel-worktrees.md 或 development.md** — 否决：两处都贴着预算上限（400 / 750），
塞入只能靠压缩常驻事实；合流对 worktree 内外的任务分支同样成立，独立成页后 worktree 文档只留链接。

**让门禁校验 `DONE` 任务是否真的合流** — 否决：任务卡在任务分支内写就，`DONE` 与合流的先后无法在
单次 `verify` 中判定；门禁保持取值封闭，可见性交给 doctor。

## Consequences

- 会话有了常驻的合流授权与明确完成顺序，`DONE` 不再允许与未合流并存；未合流必须留痕。
- 新增 [docs/cookbook/merge.md](../../../docs/cookbook/merge.md)（预算 200）；`docs/development.md` 预算
  由 750 提到 780 —— 先做了搬迁（合流步骤独立成页）与精简，提额部分只用于第四把开关的语义，语义
  必须留在唯一语义家。
- `doctor` 在存在领先分支时新增一条 note（不改变退出码）；框架仓库自身会列出历史遗留分支。
- 老项目升级路径：配置深合并补 `merge=ask`，模板与自举实例的默认值一致。
- 合流动作从文档里的一个名词变成带命令、目标分支与失败语义的可执行流程，且可由
  `doctor` 查询。
