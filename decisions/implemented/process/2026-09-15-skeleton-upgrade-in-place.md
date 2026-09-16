# Agent Note: 骨架维护模式：升级在根 checkout 原地进行

Status: implemented

## Problem

骨架升级（`psycho-frame upgrade`）改的是仓库根级共享文件——`AGENTS.md`、`docs/`、`.psycho-frame.json`、
`package.json` scripts、`.gitignore`——语义是整个仓库换一代骨架；而
[每个任务一个 worktree](../process/2026-09-09-worktree-parallel.md) 的铁律要求编码在任务 worktree 内
进行。两条规则相遇时没有裁决：

- 在 `.worktrees/<task_key>` 内升级，新骨架只存在于该分支：根 checkout 与其它并行 worktree 仍是旧
  代际，升级提交挂在任务分支上，任务分支延期或放弃即留下长期代际分裂。
- 各 worktree 的 doctor 与 `upgrade --dry-run --exit-code` 会给出不同答案，门禁不再是全仓库一致的
  事实。
- [upgrade.mjs](../../../packages/psycho-frame/src/upgrade.mjs) 只在"框架源码仓库"与"目标不像骨架"
  两处中止，没有 worktree 判断。
- 会话侧没有"骨架可升级"的常驻线索：只有交互终端的版本提示，非交互会话（Agent）拿不到。

## Decision

- 骨架升级按**骨架维护模式**执行：由意图进入的一次性流程，不是 `workMode` 里的持久开关。进入条件
  封闭两条——用户明确要求，或漂移线索非 0（doctor 的骨架漂移 note，或
  `psycho-frame upgrade --dry-run --exit-code` 退出码 1）。
- 执行位置是仓库根 checkout：不建 worktree、不建任务分支，升级提交直接落在集成分支；一次只做
  "升级 → 门禁 → 提交"，不夹带业务改动，工作区脏时先停。步骤、并发收束与验证清单在
  [docs/cookbook/skeleton-upgrade.md](../../../docs/cookbook/skeleton-upgrade.md)；worktree 铁律的例外
  写在 [parallel-worktrees.md](../../../docs/cookbook/parallel-worktrees.md)。
- 机器约束：[upgrade.mjs](../../../packages/psycho-frame/src/upgrade.mjs) 在 linked worktree 内
  （`git rev-parse --git-dir` 与 `--git-common-dir` 指向不同）以一行错误中止、退出码 1 且不落盘。
- 会话线索：[init.mjs](../../../packages/psycho-frame/src/init.mjs) 新增 `skeletonDrift`，doctor 对比
  包内模板后给出一条 note（本地改动数与缺失数，指向 `psycho-frame upgrade --dry-run`）；只记 note、
  不改变退出码。框架源码仓库标识收敛为 `isFrameworkRepo` 单一实现，doctor 与 upgrade 共用，该仓库内
  不做模板比较。
- 常驻触发：根 [AGENTS.md](../../../AGENTS.md) 与
  [template/AGENTS.md](../../../packages/psycho-frame/template/AGENTS.md) 各一行——漂移线索非 0 时提出
  升级，并说明升级在根 checkout 原地进行。
- 并发收束：升级提交落在集成分支后，在飞的任务 worktree 逐个 merge-forward 父分支并重跑
  `pnpm verify:docs`（[cookbook/skeleton-upgrade.md](../../../docs/cookbook/skeleton-upgrade.md)）。

## Alternatives considered

**在任务 worktree 内升级再合流** — 否决：升级期间各 worktree 处于不同代际，门禁结果不一致；合流顺序
决定谁赢，回退要同时动多个分支。

**新增持久开关 `workMode.skeleton=inplace|worktree`** — 否决：一个"绕过 worktree 铁律"的持久开关一旦
忘记关闭，后续所有任务都会在根 checkout 上编码；绕过铁律应由一次性意图进入，不由配置常驻。

**让 upgrade 自建临时 worktree、升完自动合流回 main** — 否决：升级目标就是根 checkout 的共享文件，
临时 worktree 不减少任何风险，只多一个中间分支与一次合流。

**只写文档约定，不加 CLI 守卫** — 否决：与骨架"规则一旦机器可校验就不依赖记得去改"的立场冲突；
`upgrade` 已有框架源码仓库守卫先例，新增一处沿用同一形状成本极低。

**doctor 只提示"跑一次 upgrade --dry-run"，不做模板比较** — 否决：那只是把检查推给用户，Agent 与
用户都拿不到"漂移了多少、缺了什么"的可判定信息；比较零依赖、只读、只记 note，代价可控。

**把骨架版本号写进仓库文件或配置** — 否决：版本会成为随升级漂移的第二事实源，还多一份要维护的文件；
版本由 npm 包与 `self-upgrade` 表达，仓库内只比较文件内容。

## Consequences

- 升级不再分裂骨架代际：升级只发生在根 checkout，linked worktree 内的调用被守卫拦下且不落盘。
- 漂移对 Agent 可见：`pnpm run doctor` 与 `upgrade --dry-run --exit-code` 都给出可判定结论，
  [AGENTS.md](../../../AGENTS.md) 常驻一行指向升级流程与执行位置。
- `isFrameworkRepo` 成为框架源码仓库的唯一判定，doctor 与 upgrade 共用。
- 升级后的并发收束有据可依：cookbook 给出 merge-forward 步骤、备份位置与验证清单。
- 常驻预算偏紧：[AGENTS.md](../../../AGENTS.md) 543/550、
  [parallel-worktrees.md](../../../docs/cookbook/parallel-worktrees.md) 386/400、
  [cookbook/skeleton-upgrade.md](../../../docs/cookbook/skeleton-upgrade.md) 394/400 都在上限内，后续
  常驻文案改动须先精简或搬迁。
- 测试：upgrade 覆盖 linked worktree 中止与根 checkout 可用，init 覆盖骨架漂移 note 与框架源码仓库
  不比较，cli 覆盖 `help upgrade` 的新守卫说明。
