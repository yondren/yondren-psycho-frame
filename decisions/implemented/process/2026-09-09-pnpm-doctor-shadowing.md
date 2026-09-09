# Agent Note: pnpm doctor 内置命令遮蔽同名 script，文档统一 pnpm run doctor

Status: implemented

## Problem

pnpm ≥ 11.14 内置 `pnpm doctor`（环境诊断），且内置命令优先于同名 npm script；仓库与
模板文档指引的 `pnpm doctor` 实际执行 pnpm 环境诊断，而非 psycho-frame 的结构漂移检查。

## Decision

保留 `doctor` npm script 与 CLI 子命令不变；文档中的调用方式统一为 `pnpm run doctor`。
`pnpm run doctor` 在所有 pnpm 版本下均解析到仓库脚本。

## Alternatives considered

**重命名 script 为无碰撞名（如 drift-check）** — 否决：彻底消除歧义，但破坏既有输入习惯；
且 npm 亦有内置 `npm doctor`，同名遮蔽不限于 pnpm，换名收益低于成本。

**文档指引直接调 `psycho-frame doctor`** — 否决：绕开 script 层，但与仓库统一的
`pnpm run <script>` 入口约定不一致。

## Consequences

- 按文档执行 `pnpm run doctor` 必命中结构漂移检查。
- `pnpm doctor` 在 pnpm ≥ 11.14 上被内置命令遮蔽，文档不再以该写法指引。
