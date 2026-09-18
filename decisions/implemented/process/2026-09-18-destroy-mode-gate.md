# Agent Note: 毁灭模式把门禁拉满

Status: implemented

## Problem

骨架的纪律（worktree、任务绑定、决策记录、凭据不入库）此前只写在文档里：违反了没有代价，
`verify` 校验的是文档格式，不看改动本身。"agent 不开单独 worktree"这类反馈就是这种失效——规则
存在，但没有会失败的信号。另一方面，不同项目的严格程度差异很大，把最严的检查默认打开会让常规
提交付出不必要的成本。

## Decision

新增第七把开关 `workMode.destroy`（on/off，默认 off）。`destroy=on` 时 `psycho-frame verify` 追加
一组硬检查，缺一即失败：

1. worktree 纪律（`psycho-frame task check` 的全部项，见 [task start 记录](2026-09-18-task-start-cli.md)）；
2. 当前改动绑定唯一任务（分支名即 task_key，或全仓库唯一 `IN_PROGRESS`），且状态允许提交；
3. 必须显式 `--base <父分支 ref>`；
4. 改动面至少新增或更新一条 decisions/ 记录——微小改动豁免在此不适用；
5. `base..HEAD` 的每个非合并提交都含 task_key；
6. 凭据扫描：命中只报路径与行号、不回显内容，行内 `psycho-frame:allow-secret` 豁免假阳性；
7. 本地全量矩阵：配置 `destroyChecks` 的命令逐条执行，任一失败即门禁失败（不写 `verify` 自身）。

它只加严，不改动其他六把开关；默认 off 让 CI 与常规提交不受影响。语义的唯一家在
[docs/modes.md](../../../docs/modes.md)。

## Alternatives considered

**默认打开全部检查** — 否决：显式 `--base` 与本地全量矩阵对微小改动是纯成本，且 CI 里没有
worktree 与任务分支，默认打开会让远端与本地门禁语义分叉。

**做成独立命令 `psycho-frame destroy-verify`** — 否决：第二个入口意味着可以被选择性跳过，
"打开模式即拉满"比"记得多跑一条命令"可靠；`--json` 增加 `destroy` / `checks` 字段已够机器消费。

**本地不跑矩阵，全部交给 CI** — 否决：worktree、任务卡与决策记录是本地事实，CI 看不到；
毁灭模式的矩阵是"提交前"信号，[零依赖测试套件与 CI](2026-09-13-node-test-suite-and-ci.md) 的 CI
硬门禁不变。

**只加凭据扫描** — 否决：凭据只是失效面之一，反馈中的真实失效是纪律不被执行。

## Consequences

- 默认行为不变：`verify` 仍是文档门禁，CI 与日常 `pnpm verify:docs` 不受影响。
- 打开毁灭模式后 `verify` 需要 `--base`，并真的执行 `destroyChecks`（本仓库配 `pnpm test` +
  `pnpm run doctor`），门禁变慢，但提交前就能发现。
- [docs/development.md](../../../docs/development.md) 的"本地最窄验证 + 全量矩阵归 CI"仍是默认
  分工；毁灭模式只是在该模式下把本地矩阵变成硬要求，不与之冲突。
- 凭据扫描有假阳性，豁免标记是该模式的一部分，位置写进 [docs/modes.md](../../../docs/modes.md)。
- 毁灭模式是本地门禁，不进 CI：CI 只有单一 checkout，任务分支必然在根 checkout 检出，接进 CI
  会恒失败；CI 继续跑自己的 `verify` + `doctor` + `test`。
