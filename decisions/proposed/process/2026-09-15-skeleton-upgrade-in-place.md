# Agent Note: 骨架维护模式：升级在根 checkout 原地进行

Status: proposed

## Problem

骨架升级（`psycho-frame upgrade`）改的是仓库根级共享文件——`AGENTS.md`、`docs/`、
`.psycho-frame.json`、`package.json` scripts、`.gitignore`——语义是"整个仓库换一代骨架"；而
[AGENTS.md](../../../AGENTS.md) 的"任务与并行"铁律要求每个任务一个 worktree。两条规则相遇时
没有裁决，Agent 照铁律行事就会踩坑：

- 在 `.worktrees/<task_key>` 内升级，新骨架只存在于该分支：根 checkout 与其它并行 worktree
  仍是旧代际，升级提交挂在任务分支上，任务分支延期或放弃即留下长期代际分裂。
- 各 worktree 的 doctor 与 `upgrade --dry-run --exit-code` 会给出不同答案，门禁不再是全仓库
  一致的事实。
- [upgrade.mjs](../../../packages/psycho-frame/src/upgrade.mjs) 只在"框架源码仓库"与"目标不像
  骨架"两处中止，没有 worktree 判断。
- 会话侧没有"骨架可升级"的常驻入口：线索只有交互终端的版本提示与漂移检查，非交互会话（Agent）
  拿不到，也就无法主动提出升级。

## Proposal

把骨架升级定义为一个命名的特殊工作模式——**骨架维护模式**：由意图进入的一次性流程，不是
`workMode` 里的持久开关。

- 进入条件（封闭两条）：用户明确要求升级骨架；或漂移线索非 0（已有的
  `upgrade --dry-run --exit-code`，或 doctor 新增的一条骨架漂移提示）。
- 执行位置：仓库根 checkout 原地执行，**不建 worktree、不建任务分支**，升级提交直接落在集成分支
  （main）。升级产物本就是所有 worktree 共享的根文件，绕经分支只是把一次写入换成一次合流。
- 边界：一次只做"升级 → 门禁 → 提交"三件事，不夹带业务改动；工作区脏则先停并说明；按
  [tasks/](../../../tasks/README.md) 规则登记任务卡，但 worktree 一步豁免——豁免的判定与理由写在
  [parallel-worktrees.md](../../../docs/cookbook/parallel-worktrees.md)（worktree 铁律的家）。
- 机器约束：`upgrade` 在 linked worktree 内（`git rev-parse --git-dir` 与 `--git-common-dir`
  不同）中止并提示改到根 checkout 运行，不写任何文件；形状与
  [框架源码仓库自守卫](../../implemented/bug-fix/2026-09-13-upgrade-self-guard.md) 一致。
- 并发收束：升级后所有在飞任务 worktree 需从父分支 merge-forward 才能吃到新骨架；顺序与失败语义
  并进 [merge.md](../../../docs/cookbook/merge.md)。
- 会话入口：[AGENTS.md](../../../AGENTS.md) 只放 1–3 句触发指令 + 链接，语义家是 cookbook（新页
  或 [parallel-worktrees.md](../../../docs/cookbook/parallel-worktrees.md) 新小节）。

## Alternatives considered

**在任务 worktree 内升级再合流** — 否决：升级期间各 worktree 处于不同代际，门禁结果不一致；合流
顺序决定谁赢，回退要同时动多个分支。

**新增持久开关 `workMode.skeleton=inplace|worktree`** — 否决：一个"绕过 worktree 铁律"的持久开关
一旦忘记关闭，后续所有任务都会在根 checkout 上编码；绕过铁律应由一次性意图进入，不由配置常驻。

**让 upgrade 自建临时 worktree、升完自动合流回 main** — 否决：升级目标就是根 checkout 的共享文件，
临时 worktree 不减少任何风险，只多一个中间分支与一次合流。

**只写文档约定，不加 CLI 守卫** — 否决：与骨架"规则一旦机器可校验就不依赖记得去改"的立场冲突；
`upgrade` 已有两处入口守卫先例，新增一处成本极低。

**并入 `self-upgrade`（CLI 自身升级）** — 否决：两者对象不同（npm 包 vs 仓库内骨架文件），合并后
"这次升级了什么"不可分辨；但会话提示可以由同一条线索触发。

## Acceptance criteria

- `psycho-frame upgrade` 在 linked worktree 内以一行可读错误中止、退出码非 0 且不落盘；根 checkout
  行为不变；[upgrade.test.mjs](../../../packages/psycho-frame/test/upgrade.test.mjs) 覆盖两条路径。
- 骨架维护模式的进入条件、执行位置、边界与并发收束只有一个家（cookbook）；
  [AGENTS.md](../../../AGENTS.md) 与
  [template/AGENTS.md](../../../packages/psycho-frame/template/AGENTS.md) 只放 1–3 句 + 链接。
- 升级线索对 Agent 可达：doctor 或 `upgrade --dry-run --exit-code` 之一出现在
  [AGENTS.md](../../../AGENTS.md) 常驻清单里，输出带可判定退出码。
- 至少一次真实升级演练（含升级后各 worktree 的 merge-forward）记入 reports/。
- `pnpm verify:docs` 与 `pnpm test` 通过。

## Risks

- **模式被当作"在 main 上干活"的通行证**：缓解是把进入条件封闭为两条，并把"升级提交的改动面必须
  全属模板集"写进验收，`change-scope` 可机械核对。
- **升级窗口内的并发不一致**：缓解是升级前要求无在飞任务，或升级后立即逐 worktree merge-forward，
  并把这一条写进 [tasks/](../../../tasks/README.md) 的完成顺序。
- **预算已近上限**：[AGENTS.md](../../../AGENTS.md) 现 480/550、
  [parallel-worktrees.md](../../../docs/cookbook/parallel-worktrees.md) 现 356/400；新增文案进 cookbook
  前先精简或搬迁，最后才提预算。
- **与[上下文检索提案](../architecture/2026-09-13-skeleton-context-retrieval.md)同批改模板与门禁**：
  缓解是落地顺序在实现任务里对齐，避免两条提案在同一批改动 `verify` 与 `template/`。
